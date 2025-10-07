import React, { createContext, useContext, useEffect, useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { User, AuthState } from '@/lib/types';
import { hashPassword, createUser } from '@/lib/auth';
import { GmailAuthService } from '@/lib/gmail-auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGmail: () => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [users, setUsers] = useKV<Record<string, { user: User; hashedPassword: string }>>('app_users', {});
  const [currentUserId, setCurrentUserId] = useKV<string | null>('current_user_id', null);
  const [isLoading, setIsLoading] = useState(true);

  const usersRecord = users || {};
  const currentUser = currentUserId && usersRecord[currentUserId] ? usersRecord[currentUserId].user : null;

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const hashedPassword = await hashPassword(password);
    
    const userEntry = Object.values(usersRecord).find(
      entry => entry.user.email.toLowerCase() === email.toLowerCase() && 
               entry.hashedPassword === hashedPassword
    );

    if (userEntry) {
      setCurrentUserId(userEntry.user.id);
      return { success: true };
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const register = async (userData: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const emailExists = Object.values(usersRecord).some(
      entry => entry.user.email.toLowerCase() === userData.email.toLowerCase()
    );

    if (emailExists) {
      return { success: false, error: 'Email already registered' };
    }

    const usernameExists = Object.values(usersRecord).some(
      entry => entry.user.username.toLowerCase() === userData.username.toLowerCase()
    );

    if (usernameExists) {
      return { success: false, error: 'Username already taken' };
    }

    const newUser = createUser({
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName
    });

    const hashedPassword = await hashPassword(userData.password);

    setUsers(currentUsers => ({
      ...(currentUsers || {}),
      [newUser.id]: {
        user: newUser,
        hashedPassword
      }
    }));

    setCurrentUserId(newUser.id);
    return { success: true };
  };

  const loginWithGmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const gmailAuth = GmailAuthService.getInstance();
      const googleUser = await gmailAuth.initiateGoogleSignIn();
      const userData = await gmailAuth.processGoogleUser(googleUser);

      // Check if user already exists by email
      const existingUserEntry = Object.values(usersRecord).find(
        entry => entry.user.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (existingUserEntry) {
        // User exists, log them in
        setCurrentUserId(existingUserEntry.user.id);
        return { success: true };
      } else {
        // Create new user
        const newUser = createUser({
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          authProvider: userData.authProvider,
          avatar: userData.avatar,
          googleId: userData.googleId
        });

        // For Google users, we don't store a password hash
        setUsers(currentUsers => ({
          ...(currentUsers || {}),
          [newUser.id]: {
            user: newUser,
            hashedPassword: '' // Google users don't have passwords
          }
        }));

        setCurrentUserId(newUser.id);
        return { success: true };
      }
    } catch (error) {
      console.error('Gmail auth error:', error);
      if (error instanceof Error && error.message === 'User cancelled Google sign in') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      return { success: false, error: 'Google sign-in failed. Please try again.' };
    }
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...userData };
    
    setUsers(currentUsers => {
      const currentUsersRecord = currentUsers || {};
      return {
        ...currentUsersRecord,
        [currentUser.id]: {
          ...currentUsersRecord[currentUser.id],
          user: updatedUser
        }
      };
    });
  };

  const authState: AuthContextType = {
    user: currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    loginWithGmail,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};