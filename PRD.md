# BookVault with Gmail SSO - Product Requirements Document

BookVault is a digital reading companion that helps users track their reading progress, build their personal library, and achieve their reading goals with seamless Google authentication integration.

**Experience Qualities**:
1. **Streamlined** - Users can sign in instantly with Google or create a traditional account, removing authentication friction
2. **Personal** - Each user's data is isolated and secure, with Google profile integration showing avatars and names  
3. **Trustworthy** - Clear authentication states and secure data handling build user confidence in the platform

**Complexity Level**: Light Application (multiple features with basic state)
The app handles user authentication through both traditional email/password and Google OAuth flows, with persistent data storage and multiple interconnected features for book management and reading tracking.

## Essential Features

### Gmail SSO Authentication
- **Functionality**: One-click sign-in with Google accounts, automatic profile data import
- **Purpose**: Reduces signup friction and leverages familiar Google authentication UX
- **Trigger**: User clicks "Continue with Google" button on login or registration screens
- **Progression**: Button click → Google account selection modal → automatic account creation/login → dashboard access
- **Success criteria**: Users can authenticate within 3 clicks and see their Google avatar/name in the UI

### Traditional Email Authentication  
- **Functionality**: Email/password registration and login with validation
- **Purpose**: Provides alternative for users who prefer not to use Google SSO
- **Trigger**: User fills out email/password form and submits
- **Progression**: Form input → validation → account creation/login → dashboard access
- **Success criteria**: Clear error messaging, secure password hashing, successful authentication

### User Profile Integration
- **Functionality**: Display Google avatars, names, and profile information when available
- **Purpose**: Creates personalized experience and confirms successful Google authentication
- **Trigger**: User signs in with Google or views their profile
- **Progression**: Authentication → profile data retrieval → avatar display in user menu
- **Success criteria**: Google avatars visible in user menu, fallback to initials for email users

### Data Isolation by Authentication Method
- **Functionality**: User data is properly scoped and isolated regardless of authentication method
- **Purpose**: Ensures data security and prevents cross-user data leakage  
- **Trigger**: Any data operation (book creation, reading session logging)
- **Progression**: User action → user ID verification → scoped data operation
- **Success criteria**: Each user only sees their own books and reading data

## Edge Case Handling

- **Email Already Exists**: Clear messaging when Google email matches existing email account, with merger options
- **Google Sign-in Cancellation**: Graceful handling when user cancels Google authentication flow
- **Network Failures**: Retry mechanisms and offline state indicators for authentication requests
- **Invalid Credentials**: Clear error messaging for traditional login failures without exposing security details
- **Session Persistence**: Users remain logged in across browser sessions until explicit logout

## Design Direction

The design should feel professional yet approachable, similar to modern SaaS applications with a literary twist. Clean, minimal interface with deliberate use of space creates focus on the user's reading content rather than competing interface elements.

## Color Selection

Complementary (opposite colors) - Using warm earth tones paired with cool blues to create visual interest while maintaining readability and a scholarly feel.

- **Primary Color**: Deep forest green (oklch(0.45 0.08 45)) - Communicates growth, knowledge, and reliability
- **Secondary Colors**: Warm cream (oklch(0.92 0.02 75)) - Provides gentle contrast and literary warmth
- **Accent Color**: Rich amber (oklch(0.65 0.15 65)) - Draws attention to interactive elements and achievements  
- **Foreground/Background Pairings**:
  - Background (Warm Cream): Dark forest text (oklch(0.25 0.05 45)) - Ratio 8.2:1 ✓
  - Card (White): Dark forest text (oklch(0.25 0.05 45)) - Ratio 9.1:1 ✓  
  - Primary (Forest Green): Cream text (oklch(0.92 0.02 75)) - Ratio 7.8:1 ✓
  - Accent (Amber): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓

## Font Selection

Typography should convey intelligence and readability while feeling modern and approachable, using Inter for its exceptional legibility across different reading contexts.

- **Typographic Hierarchy**:
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing  
  - H3 (Card Titles): Inter Medium/18px/normal spacing
  - Body Text: Inter Regular/16px/relaxed line height (1.6)
  - UI Labels: Inter Medium/14px/normal spacing

## Animations

Subtle and purposeful animations that feel responsive rather than decorative, enhancing the sense of digital craftsmanship without distracting from reading-focused tasks.

- **Purposeful Meaning**: Gentle transitions reinforce the thoughtful, literary nature of the app while providing clear feedback
- **Hierarchy of Movement**: Authentication state changes and user actions receive priority, with secondary animations for hover states and micro-interactions

## Component Selection

- **Components**: 
  - Cards for book displays and authentication forms
  - Dialogs for book details and add/edit forms
  - Avatars with fallback initials for user profiles
  - Buttons with distinct styling for Google vs traditional auth
  - Form inputs with validation states
  - Dropdown menus for user account management
  - Separators to divide authentication methods visually

- **Customizations**: Google sign-in button with custom Google logo styling, enhanced avatar component supporting external image sources

- **States**: Authentication buttons show loading states, form inputs provide real-time validation feedback, user menu shows authentication method context

- **Icon Selection**: GoogleLogo for SSO, BookOpen for app identity, User/Gear for profile management, Eye/EyeSlash for password visibility

- **Spacing**: Consistent 16px base unit with 4px grid system, generous padding around authentication elements

- **Mobile**: Authentication forms remain single-column on mobile, Google button maintains proper touch target size, user menu adapts to smaller screen constraints