import { Book, ReadingSession, ReadingStats } from './types';

export const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Mystery',
  'Romance',
  'Science Fiction',
  'Fantasy',
  'Biography',
  'History',
  'Self-Help',
  'Technology',
  'Business',
  'Health',
  'Travel',
  'Poetry',
  'Other'
];

export const generateBookId = () => {
  return `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateProgress = (currentPage: number, totalPages: number): number => {
  if (totalPages === 0) return 0;
  return Math.min(100, Math.round((currentPage / totalPages) * 100));
};

export const formatReadingTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
};

export const calculateReadingStats = (
  books: Book[],
  sessions: ReadingSession[]
): ReadingStats => {
  const completedBooks = books.filter(book => book.status === 'completed');
  const totalPages = completedBooks.reduce((sum, book) => sum + book.totalPages, 0);
  const totalReadingTime = sessions.reduce((sum, session) => sum + session.timeSpent, 0);

  // Calculate genre frequency
  const genreCounts = books.reduce((acc, book) => {
    acc[book.genre] = (acc[book.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const genreEntries = Object.entries(genreCounts);
  const favoriteGenre = genreEntries.length > 0 
    ? genreEntries.reduce((a, b) => 
        genreCounts[a[0]] > genreCounts[b[0]] ? a : b
      )[0] 
    : 'None';

  // Calculate reading streak (simplified)
  const today = new Date();
  const daysSinceLastSession = sessions.length > 0 
    ? Math.floor((today.getTime() - new Date(sessions[sessions.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const currentStreak = daysSinceLastSession <= 1 ? 7 : 0; // Simplified streak calculation

  return {
    totalBooks: books.length,
    completedBooks: completedBooks.length,
    totalPages,
    currentStreak,
    longestStreak: currentStreak,
    averagePagesPerDay: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + s.pagesRead, 0) / 30)
      : 0,
    favoriteGenre,
    totalReadingTime
  };
};