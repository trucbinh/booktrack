/**
 * Database service layer that provides high-level operations
 * for the BookVault application using MongoDB-compatible API
 */

import { db } from './database';
import {
  UserDocument,
  BookDocument,
  ReadingSessionDocument,
  GoalDocument,
  QuoteDocument,
  CollectionDocument,
  defaultUserPreferences,
  defaultUserStats,
} from './schemas';

/**
 * User service for managing user data
 */
export class UserService {
  public collection = db.collection<UserDocument>('users');

  async createUser(userData: {
    githubId: string;
    login: string;
    email: string;
    avatarUrl: string;
  }): Promise<UserDocument> {
    return await this.collection.insertOne({
      ...userData,
      preferences: defaultUserPreferences,
      stats: defaultUserStats,
    });
  }

  async findByGithubId(githubId: string): Promise<UserDocument | null> {
    return await this.collection.findOne({ githubId });
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<UserDocument['preferences']>
  ): Promise<void> {
    await this.collection.updateOne(
      { _id: userId },
      { preferences }
    );
  }

  async updateStats(
    userId: string,
    stats: Partial<UserDocument['stats']>
  ): Promise<void> {
    await this.collection.updateOne(
      { _id: userId },
      { stats }
    );
  }
}

/**
 * Book service for managing book data
 */
export class BookService {
  private collection = db.collection<BookDocument>('books');

  async createBook(bookData: Omit<BookDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<BookDocument> {
    return await this.collection.insertOne(bookData);
  }

  async findByUser(userId: string): Promise<BookDocument[]> {
    return await this.collection.find({ userId }, { sort: { updatedAt: -1 } });
  }

  async findByStatus(userId: string, status: BookDocument['status']): Promise<BookDocument[]> {
    return await this.collection.find({ userId, status }, { sort: { updatedAt: -1 } });
  }

  async updateBook(bookId: string, updates: Partial<BookDocument>): Promise<void> {
    await this.collection.updateOne(
      { _id: bookId },
      updates
    );
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.collection.deleteOne({ _id: bookId });
  }

  async searchBooks(userId: string, searchTerm: string): Promise<BookDocument[]> {
    const books = await this.findByUser(userId);
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return books.filter(book => 
      book.title.toLowerCase().includes(lowercaseSearch) ||
      book.author.toLowerCase().includes(lowercaseSearch) ||
      book.genre?.toLowerCase().includes(lowercaseSearch) ||
      book.tags.some(tag => tag.toLowerCase().includes(lowercaseSearch))
    );
  }

  async getReadingStats(userId: string): Promise<{
    totalBooks: number;
    currentlyReading: number;
    completed: number;
    wantToRead: number;
  }> {
    const books = await this.findByUser(userId);
    
    return {
      totalBooks: books.length,
      currentlyReading: books.filter(b => b.status === 'reading').length,
      completed: books.filter(b => b.status === 'completed').length,
      wantToRead: books.filter(b => b.status === 'want-to-read').length,
    };
  }
}

/**
 * Reading session service for managing reading activity
 */
export class ReadingSessionService {
  private collection = db.collection<ReadingSessionDocument>('reading_sessions');

  async createSession(sessionData: Omit<ReadingSessionDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<ReadingSessionDocument> {
    return await this.collection.insertOne(sessionData);
  }

  async findByUser(userId: string, limit?: number): Promise<ReadingSessionDocument[]> {
    return await this.collection.find(
      { userId },
      { sort: { date: -1 }, limit }
    );
  }

  async findByBook(bookId: string): Promise<ReadingSessionDocument[]> {
    return await this.collection.find(
      { bookId },
      { sort: { date: -1 } }
    );
  }

  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReadingSessionDocument[]> {
    const sessions = await this.findByUser(userId);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  }

  async getTodaysSessions(userId: string): Promise<ReadingSessionDocument[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await this.findByDateRange(userId, today, tomorrow);
  }

  async getReadingStreak(userId: string): Promise<number> {
    const sessions = await this.findByUser(userId);
    
    if (sessions.length === 0) return 0;

    // Group sessions by date
    const sessionsByDate = new Map<string, ReadingSessionDocument[]>();
    sessions.forEach(session => {
      const dateKey = new Date(session.date).toDateString();
      if (!sessionsByDate.has(dateKey)) {
        sessionsByDate.set(dateKey, []);
      }
      sessionsByDate.get(dateKey)!.push(session);
    });

    // Calculate streak from today backwards
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Max 365 days
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = checkDate.toDateString();
      
      if (sessionsByDate.has(dateKey)) {
        streak++;
      } else if (i > 0) { // Allow today to be missing for current streak
        break;
      }
    }

    return streak;
  }
}

/**
 * Goal service for managing reading goals
 */
export class GoalService {
  private collection = db.collection<GoalDocument>('goals');

  async createGoal(goalData: Omit<GoalDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<GoalDocument> {
    return await this.collection.insertOne(goalData);
  }

  async findByUser(userId: string): Promise<GoalDocument[]> {
    return await this.collection.find({ userId }, { sort: { period: -1 } });
  }

  async updateProgress(goalId: string, progress: number): Promise<void> {
    await this.collection.updateOne(
      { _id: goalId },
      { progress, achieved: progress >= (await this.collection.findById(goalId))?.target! }
    );
  }

  async getCurrentGoals(userId: string): Promise<GoalDocument[]> {
    const goals = await this.findByUser(userId);
    const now = new Date();
    
    return goals.filter(goal => {
      const period = new Date(goal.period);
      const endOfPeriod = new Date(period);
      
      switch (goal.type) {
        case 'daily':
          endOfPeriod.setDate(endOfPeriod.getDate() + 1);
          break;
        case 'weekly':
          endOfPeriod.setDate(endOfPeriod.getDate() + 7);
          break;
        case 'monthly':
          endOfPeriod.setMonth(endOfPeriod.getMonth() + 1);
          break;
        case 'yearly':
          endOfPeriod.setFullYear(endOfPeriod.getFullYear() + 1);
          break;
      }
      
      return now >= period && now < endOfPeriod;
    });
  }
}

/**
 * Quote service for managing favorite quotes
 */
export class QuoteService {
  private collection = db.collection<QuoteDocument>('quotes');

  async createQuote(quoteData: Omit<QuoteDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<QuoteDocument> {
    return await this.collection.insertOne(quoteData);
  }

  async findByUser(userId: string): Promise<QuoteDocument[]> {
    return await this.collection.find({ userId }, { sort: { addedAt: -1 } });
  }

  async findByBook(bookId: string): Promise<QuoteDocument[]> {
    return await this.collection.find({ bookId }, { sort: { page: 1 } });
  }

  async findFavorites(userId: string): Promise<QuoteDocument[]> {
    return await this.collection.find({ userId, isFavorite: true }, { sort: { addedAt: -1 } });
  }
}

/**
 * Collection service for managing book collections
 */
export class CollectionService {
  private collection = db.collection<CollectionDocument>('collections');

  async createCollection(collectionData: Omit<CollectionDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<CollectionDocument> {
    return await this.collection.insertOne(collectionData);
  }

  async findByUser(userId: string): Promise<CollectionDocument[]> {
    return await this.collection.find({ userId }, { sort: { updatedAt: -1 } });
  }

  async addBookToCollection(collectionId: string, bookId: string): Promise<void> {
    const collection = await this.collection.findById(collectionId);
    if (collection && !collection.bookIds.includes(bookId)) {
      await this.collection.updateOne(
        { _id: collectionId },
        { bookIds: [...collection.bookIds, bookId] }
      );
    }
  }

  async removeBookFromCollection(collectionId: string, bookId: string): Promise<void> {
    const collection = await this.collection.findById(collectionId);
    if (collection) {
      await this.collection.updateOne(
        { _id: collectionId },
        { bookIds: collection.bookIds.filter(id => id !== bookId) }
      );
    }
  }
}

/**
 * Singleton instances of services
 */
export const userService = new UserService();
export const bookService = new BookService();
export const readingSessionService = new ReadingSessionService();
export const goalService = new GoalService();
export const quoteService = new QuoteService();
export const collectionService = new CollectionService();

/**
 * Database initialization function
 */
export async function initializeDatabase(): Promise<void> {
  // Create indexes for better performance
  await db.collection('users').createIndex({ githubId: 1 });
  await db.collection('books').createIndex({ userId: 1, status: 1 });
  await db.collection('reading_sessions').createIndex({ userId: 1, date: -1 });
  await db.collection('goals').createIndex({ userId: 1, period: -1 });
  await db.collection('quotes').createIndex({ userId: 1, bookId: 1 });
  await db.collection('collections').createIndex({ userId: 1 });
  
  console.log('Database initialized with indexes');
}

/**
 * Migration functions for data upgrades
 */
export async function migrateData(): Promise<void> {
  // Example migration: ensure all books have required fields
  const books = await db.collection<BookDocument>('books').find({});
  
  for (const book of books) {
    const updates: Partial<BookDocument> = {};
    
    if (!book.tags) {
      updates.tags = [];
    }
    
    if (!book.status) {
      updates.status = 'want-to-read';
    }
    
    if (Object.keys(updates).length > 0) {
      await db.collection<BookDocument>('books').updateOne(
        { _id: book._id },
        updates
      );
    }
  }
  
  console.log('Data migration completed');
}