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

  const loginWithGmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const gmailService = GmailAuthService.getInstance();
      const googleUser = await gmailService.initiateGoogleSignIn();
      const userData = await gmailService.processGoogleUser(googleUser);

      // Check if user already exists
      const existingUser = Object.values(usersRecord).find(
        entry => entry.user.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (existingUser) {
        // Update existing user with Google info if it's a Gmail auth
        if (existingUser.user.authProvider === 'gmail' || existingUser.user.googleId === userData.googleId) {
          setCurrentUserId(existingUser.user.id);
          return { success: true };
        } else {
          return { success: false, error: 'An account with this email already exists. Please sign in with your password.' };
        }
      }

      // Create new user
      const newUser = createUser(userData);

      setUsers(currentUsers => ({
        ...(currentUsers || {}),
        [newUser.id]: {
          user: newUser,
          hashedPassword: '' // No password for Gmail users
        }
      }));

      setCurrentUserId(newUser.id);
      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes('cancelled')) {
        return { success: false, error: 'Sign in was cancelled' };
      }
      return { success: false, error: 'Failed to sign in with Google. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const hashedPassword = await hashPassword(password);
    
    const userEntry = Object.values(usersRecord).find(
      entry => entry.user.email.toLowerCase() === email.toLowerCase() && 
               entry.hashedPassword === hashedPassword &&
               entry.user.authProvider === 'email'
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