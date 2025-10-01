export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  genre: string;
  totalPages: number;
  currentPage: number;
  coverUrl?: string;
  addedDate: string;
  startedDate?: string;
  completedDate?: string;
  status: 'not-started' | 'reading' | 'completed';
  rating?: number;
  notes?: string;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  date: string;
  pagesRead: number;
  timeSpent: number; // in minutes
}

export interface ReadingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number; // pages or books
  unit: 'pages' | 'books';
  createdDate: string;
  isActive: boolean;
}

export interface ReadingStats {
  totalBooks: number;
  completedBooks: number;
  totalPages: number;
  currentStreak: number;
  longestStreak: number;
  averagePagesPerDay: number;
  favoriteGenre: string;
  totalReadingTime: number; // in minutes
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  preferences: {
    dailyGoal: number;
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}