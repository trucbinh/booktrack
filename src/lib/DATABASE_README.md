# MongoDB-Compatible Database System

This project demonstrates a complete MongoDB-compatible database abstraction layer built on Spark KV storage. The system provides the same API you would use with real MongoDB or Cosmos DB, making it easy to migrate to a production database later.

## Architecture Overview

The database system consists of four main components:

### 1. Database Abstraction Layer (`/src/lib/database.ts`)
- **Collection Class**: Provides MongoDB-like operations (find, insert, update, delete)
- **Database Class**: Manages collections and database-wide operations
- **Document Interface**: Enforces structure with `_id`, `createdAt`, and `updatedAt` fields
- **Query Support**: Filtering, sorting, pagination, and aggregation

### 2. Schema Definitions (`/src/lib/schemas.ts`)
- **Typed Documents**: TypeScript interfaces for all document types
- **Validation Functions**: Type guards for runtime validation
- **Default Values**: Sensible defaults for new documents
- **Relationship Support**: References between documents via IDs

### 3. Service Layer (`/src/lib/database-service.ts`)
- **Business Logic**: High-level operations specific to the application
- **Data Validation**: Input validation and business rules
- **Analytics**: Computed statistics and aggregations
- **Migration Support**: Data upgrade and transformation functions

### 4. Demo Interface (`/src/components/DatabaseDemo.tsx`)
- **Interactive Testing**: Real-time database operations
- **Visual Feedback**: Live updates and statistics
- **Error Handling**: Comprehensive error reporting
- **Performance Metrics**: Operation timing and success rates

## Core Features

### MongoDB-Compatible Operations

```typescript
// Insert operations
const book = await collection.insertOne({
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  totalPages: 180
});

const books = await collection.insertMany([...bookData]);

// Query operations
const allBooks = await collection.find({});
const readingBooks = await collection.find({ status: 'reading' });
const recentBooks = await collection.find({}, { 
  sort: { createdAt: -1 }, 
  limit: 10 
});

// Update operations
await collection.updateOne(
  { _id: bookId },
  { currentPage: 150, updatedAt: new Date() }
);

await collection.updateMany(
  { status: 'reading' },
  { reminderSent: true }
);

// Delete operations
await collection.deleteOne({ _id: bookId });
await collection.deleteMany({ status: 'abandoned' });

// Aggregation
const count = await collection.countDocuments({ status: 'completed' });
```

### Advanced Query Features

```typescript
// Complex filtering
const books = await collection.find({
  status: 'reading',
  totalPages: { $gte: 200 }  // Simulated - currently exact match only
});

// Sorting and pagination
const pagedResults = await collection.find({}, {
  sort: { createdAt: -1 },
  skip: 20,
  limit: 10
});

// Text search (service layer)
const searchResults = await bookService.searchBooks(userId, "gatsby");
```

### Schema Validation

```typescript
interface BookDocument extends DatabaseDocument {
  userId: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'want-to-read' | 'reading' | 'completed' | 'abandoned';
  tags: string[];
  // ... additional fields
}

// Type-safe operations
const books = db.collection<BookDocument>('books');
const book = await books.insertOne({
  // TypeScript ensures all required fields are present
  userId: "user123",
  title: "Book Title",
  // ...
});
```

## Document Schemas

### Users
- **Authentication**: GitHub ID, login, email, avatar
- **Preferences**: Reading goals, themes, notifications
- **Statistics**: Total books read, current streak, achievements

### Books
- **Metadata**: Title, author, ISBN, publication year, genre
- **Progress**: Current page, total pages, reading status
- **Organization**: Tags, collections, notes, ratings
- **Timestamps**: Started date, completed date, last updated

### Reading Sessions
- **Activity**: Date, duration, pages read, page range
- **Context**: Notes, mood, location, interruptions
- **Relationships**: Linked to specific books and users

### Goals & Challenges
- **Targets**: Daily/weekly/monthly/yearly goals
- **Progress**: Automatic tracking and achievement detection
- **Social**: Shared challenges and leaderboards

## Service Layer Patterns

### User Management
```typescript
const userService = new UserService();

// Create new user
const user = await userService.createUser({
  githubId: "user123",
  login: "johndoe",
  email: "john@example.com",
  avatarUrl: "https://example.com/avatar.jpg"
});

// Update preferences
await userService.updatePreferences(userId, {
  dailyGoal: 30,
  theme: 'dark'
});
```

### Book Management
```typescript
const bookService = new BookService();

// Add book to library
const book = await bookService.createBook({
  userId: "user123",
  title: "1984",
  author: "George Orwell",
  totalPages: 328,
  status: 'want-to-read',
  tags: ['dystopian', 'classic']
});

// Search books
const results = await bookService.searchBooks(userId, "orwell");

// Get reading statistics
const stats = await bookService.getReadingStats(userId);
```

### Reading Tracking
```typescript
const sessionService = new ReadingSessionService();

// Record reading session
const session = await sessionService.createSession({
  userId: "user123",
  bookId: "book456",
  date: new Date(),
  duration: 45, // minutes
  pagesRead: 15,
  startPage: 100,
  endPage: 115,
  notes: "Great character development in this chapter"
});

// Calculate reading streak
const streak = await sessionService.getReadingStreak(userId);
```

## Performance Optimizations

### Indexing Strategy
```typescript
// Automatic index creation for common queries
await db.collection('users').createIndex({ githubId: 1 });
await db.collection('books').createIndex({ userId: 1, status: 1 });
await db.collection('reading_sessions').createIndex({ userId: 1, date: -1 });
```

### Caching Patterns
- **In-memory collections**: Keep frequently accessed data in component state
- **Optimistic updates**: Update UI immediately, sync with storage async
- **Batch operations**: Group multiple updates into single storage calls

### Data Partitioning
- **User isolation**: All data is scoped by user ID
- **Collection organization**: Logical separation of document types
- **Archive strategies**: Move old data to separate collections

## Migration and Deployment

### Data Migration
```typescript
export async function migrateData(): Promise<void> {
  // Example: Add missing fields to existing documents
  const books = await db.collection<BookDocument>('books').find({});
  
  for (const book of books) {
    const updates: Partial<BookDocument> = {};
    
    if (!book.tags) {
      updates.tags = [];
    }
    
    if (Object.keys(updates).length > 0) {
      await db.collection<BookDocument>('books').updateOne(
        { _id: book._id },
        updates
      );
    }
  }
}
```

### Production Deployment
When deploying to production with real MongoDB/Cosmos DB:

1. **Replace Storage Backend**: Swap Spark KV calls with MongoDB driver
2. **Update Connection**: Configure database connection strings
3. **Preserve API**: Keep all service methods unchanged
4. **Add Monitoring**: Implement performance tracking and error logging

```typescript
// Production MongoDB implementation
import { MongoClient } from 'mongodb';

export class Collection<T extends DatabaseDocument> {
  constructor(private mongoCollection: MongoCollection<T>) {}
  
  async insertOne(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    // Use MongoDB native operations
    return await this.mongoCollection.insertOne({
      ...doc,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  // ... other methods remain the same
}
```

## Testing and Validation

### Demo Interface Features
- **Live Operations**: Real-time database interactions
- **Data Visualization**: Statistics and relationship displays
- **Error Testing**: Edge cases and validation scenarios
- **Performance Metrics**: Operation timing and success rates

### Test Scenarios
1. **User Management**: Create, update, delete users
2. **Book Library**: Add books, update progress, search
3. **Reading Sessions**: Record activity, calculate streaks
4. **Data Integrity**: Relationships and constraint validation
5. **Performance**: Large dataset operations

## Security Considerations

### Data Isolation
- **User Scoping**: All operations include user ID filtering
- **Access Control**: Services validate user permissions
- **Input Sanitization**: All user inputs are validated and escaped

### Best Practices
- **No Direct DB Access**: Always use service layer
- **Validation**: Type checking and business rule enforcement
- **Audit Trail**: Automatic timestamp tracking
- **Error Handling**: Graceful degradation and user feedback

## Future Enhancements

### Advanced Features
- **Full-text Search**: Implement search indexing
- **Relationships**: Support for JOIN-like operations
- **Transactions**: Multi-document atomic operations
- **Real-time Updates**: WebSocket-based live data sync

### Scalability Improvements
- **Sharding**: Distribute data across multiple storage backends
- **Caching**: Redis-compatible caching layer
- **Replication**: Multiple storage replicas for reliability
- **Analytics**: Dedicated reporting and analytics pipeline

This database system provides a solid foundation that can scale from prototype to production while maintaining code compatibility and developer productivity.