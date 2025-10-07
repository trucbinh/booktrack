/**
 * Database schemas and models for BookVault
 * These define the structure of documents in our MongoDB-compatible database
 */

import { DatabaseDocument } from './database';

/**
 * User document schema
 */
export interface UserDocument extends DatabaseDocument {
  githubId: string;
  login: string;
  email: string;
  avatarUrl: string;
  preferences: {
    dailyGoal: number;
    theme: 'light' | 'dark' | 'system';
    notifications: {
      dailyReminder: boolean;
      goalAchieved: boolean;
      bookCompleted: boolean;
    };
  };
  stats: {
    totalBooksRead: number;
    totalPagesRead: number;
    currentStreak: number;
    longestStreak: number;
  };
}

/**
 * Book document schema
 */
export interface BookDocument extends DatabaseDocument {
  userId: string;
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  description?: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number;
  status: 'want-to-read' | 'reading' | 'completed' | 'abandoned';
  rating?: number; // 1-5 stars
  notes?: string;
  tags: string[];
  startedAt?: Date;
  completedAt?: Date;
  source?: 'manual' | 'isbn' | 'search';
}

/**
 * Reading session document schema
 */
export interface ReadingSessionDocument extends DatabaseDocument {
  userId: string;
  bookId: string;
  date: Date;
  duration: number; // in minutes
  pagesRead: number;
  startPage: number;
  endPage: number;
  notes?: string;
  mood?: 'motivated' | 'focused' | 'distracted' | 'tired' | 'excited';
  location?: string; // where they read
}

/**
 * Goal document schema
 */
export interface GoalDocument extends DatabaseDocument {
  userId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number; // pages or books
  unit: 'pages' | 'books';
  period: Date; // the period this goal applies to
  progress: number;
  achieved: boolean;
  description?: string;
}

/**
 * Quote document schema
 */
export interface QuoteDocument extends DatabaseDocument {
  userId: string;
  bookId: string;
  text: string;
  page?: number;
  chapter?: string;
  tags: string[];
  isFavorite: boolean;
  addedAt: Date;
}

/**
 * Collection document schema (for book collections/lists)
 */
export interface CollectionDocument extends DatabaseDocument {
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  bookIds: string[];
  color?: string;
  icon?: string;
}

/**
 * Review document schema
 */
export interface ReviewDocument extends DatabaseDocument {
  userId: string;
  bookId: string;
  rating: number; // 1-5 stars
  title?: string;
  content: string;
  isPublic: boolean;
  likes: number;
  readingDate: Date;
  tags: string[];
}

/**
 * Reading challenge document schema
 */
export interface ChallengeDocument extends DatabaseDocument {
  userId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  target: number;
  unit: 'pages' | 'books';
  progress: number;
  isActive: boolean;
  isPublic: boolean;
  participants: string[]; // user IDs
}

/**
 * Application settings document schema
 */
export interface SettingsDocument extends DatabaseDocument {
  userId: string;
  category: string; // e.g., 'reading', 'notifications', 'privacy'
  settings: Record<string, any>;
}

/**
 * Type guards for document validation
 */
export function isUserDocument(doc: any): doc is UserDocument {
  return doc && typeof doc.githubId === 'string' && typeof doc.login === 'string';
}

export function isBookDocument(doc: any): doc is BookDocument {
  return doc && typeof doc.title === 'string' && typeof doc.author === 'string';
}

export function isReadingSessionDocument(doc: any): doc is ReadingSessionDocument {
  return doc && typeof doc.bookId === 'string' && typeof doc.pagesRead === 'number';
}

/**
 * Default values for new documents
 */
export const defaultUserPreferences = {
  dailyGoal: 20,
  theme: 'system' as const,
  notifications: {
    dailyReminder: true,
    goalAchieved: true,
    bookCompleted: true,
  },
};

export const defaultUserStats = {
  totalBooksRead: 0,
  totalPagesRead: 0,
  currentStreak: 0,
  longestStreak: 0,
};