interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export class GmailAuthService {
  private static instance: GmailAuthService;
  private clientId = 'demo-client-id'; // In a real app, this would be from environment variables
  private redirectUri = window.location.origin;

  static getInstance(): GmailAuthService {
    if (!GmailAuthService.instance) {
      GmailAuthService.instance = new GmailAuthService();
    }
    return GmailAuthService.instance;
  }

  // Simulate Gmail OAuth flow
  async initiateGoogleSignIn(): Promise<GoogleUserInfo> {
    return new Promise((resolve) => {
      // Simulate OAuth popup and user selection
      const mockUsers: GoogleUserInfo[] = [
        {
          id: 'google_user_1',
          email: 'john.reader@gmail.com',
          name: 'John Reader',
          given_name: 'John',
          family_name: 'Reader',
          picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: 'google_user_2', 
          email: 'sarah.bookworm@gmail.com',
          name: 'Sarah Bookworm',
          given_name: 'Sarah',
          family_name: 'Bookworm',
          picture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        {
          id: 'google_user_3',
          email: 'mike.scholar@gmail.com', 
          name: 'Mike Scholar',
          given_name: 'Mike',
          family_name: 'Scholar',
          picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        }
      ];

      // Create modal for user selection
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 class="text-lg font-semibold mb-4">Choose a Google Account</h3>
          <p class="text-sm text-gray-600 mb-4">Select which demo account to sign in with:</p>
          <div class="space-y-2">
            ${mockUsers.map((user, index) => `
              <button 
                class="w-full text-left p-3 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                onclick="window.selectGoogleUser(${index})"
              >
                <img src="${user.picture}" alt="${user.name}" class="w-10 h-10 rounded-full" />
                <div>
                  <div class="font-medium">${user.name}</div>
                  <div class="text-sm text-gray-600">${user.email}</div>
                </div>
              </button>
            `).join('')}
          </div>
          <button 
            onclick="window.cancelGoogleSignIn()"
            class="w-full mt-4 p-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      // Add global handlers
      (window as any).selectGoogleUser = (index: number) => {
        document.body.removeChild(modal);
        delete (window as any).selectGoogleUser;
        delete (window as any).cancelGoogleSignIn;
        resolve(mockUsers[index]);
      };

      (window as any).cancelGoogleSignIn = () => {
        document.body.removeChild(modal);
        delete (window as any).selectGoogleUser;
        delete (window as any).cancelGoogleSignIn;
        throw new Error('User cancelled Google sign in');
      };
    });
  }

  private generateUsernameFromEmail(email: string): string {
    return email.split('@')[0].toLowerCase();
  }

  async processGoogleUser(googleUser: GoogleUserInfo) {
    const username = this.generateUsernameFromEmail(googleUser.email);
    
    return {
      email: googleUser.email,
      username,
      firstName: googleUser.given_name || '',
      lastName: googleUser.family_name || '',
      authProvider: 'gmail' as const,
      avatar: googleUser.picture,
      googleId: googleUser.id
    };
  }
}