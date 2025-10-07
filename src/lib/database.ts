/**
 * Database abstraction layer that provides MongoDB-like operations
 * using Spark KV storage. This can be easily replaced with actual
 * MongoDB/Cosmos DB connections when deployed to a server environment.
 */

declare global {
  var spark: {
    kv: {
      get: <T>(key: string) => Promise<T | undefined>;
      set: <T>(key: string, value: T) => Promise<void>;
      delete: (key: string) => Promise<void>;
      keys: () => Promise<string[]>;
    };
  };
}

export interface DatabaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface UpdateOptions {
  upsert?: boolean;
}

/**
 * Database collection class that provides MongoDB-like operations
 */
export class Collection<T extends DatabaseDocument> {
  private collectionName: string;

  constructor(name: string) {
    this.collectionName = name;
  }

  /**
   * Get the storage key for this collection
   */
  private getKey(): string {
    return `db_${this.collectionName}`;
  }

  /**
   * Generate a new ObjectId-like string
   */
  private generateId(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString(16);
    const random = Math.random().toString(16).substring(2, 14);
    return timestamp + random;
  }

  /**
   * Get all documents from the collection
   */
  private async getAllDocuments(): Promise<T[]> {
    const docs = await spark.kv.get<T[]>(this.getKey());
    return docs || [];
  }

  /**
   * Save all documents to the collection
   */
  private async saveAllDocuments(docs: T[]): Promise<void> {
    await spark.kv.set(this.getKey(), docs);
  }

  /**
   * Insert a single document
   */
  async insertOne(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const newDoc = {
      ...doc,
      _id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T;

    const docs = await this.getAllDocuments();
    docs.push(newDoc);
    await this.saveAllDocuments(docs);

    return newDoc;
  }

  /**
   * Insert multiple documents
   */
  async insertMany(docs: Omit<T, '_id' | 'createdAt' | 'updatedAt'>[]): Promise<T[]> {
    const newDocs = docs.map(doc => ({
      ...doc,
      _id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as T[];

    const existingDocs = await this.getAllDocuments();
    const allDocs = [...existingDocs, ...newDocs];
    await this.saveAllDocuments(allDocs);

    return newDocs;
  }

  /**
   * Find documents matching a query
   */
  async find(query: Partial<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    let docs = await this.getAllDocuments();

    // Apply query filter
    if (Object.keys(query).length > 0) {
      docs = docs.filter(doc => {
        return Object.entries(query).every(([key, value]) => {
          return doc[key] === value;
        });
      });
    }

    // Apply sorting
    if (options.sort) {
      const sortEntries = Object.entries(options.sort);
      docs.sort((a, b) => {
        for (const [field, direction] of sortEntries) {
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply skip and limit
    if (options.skip) {
      docs = docs.slice(options.skip);
    }
    if (options.limit) {
      docs = docs.slice(0, options.limit);
    }

    return docs;
  }

  /**
   * Find a single document
   */
  async findOne(query: Partial<T>): Promise<T | null> {
    const results = await this.find(query, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Find a document by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.findOne({ _id: id } as Partial<T>);
  }

  /**
   * Update documents matching a query
   */
  async updateMany(
    query: Partial<T>,
    update: Partial<Omit<T, '_id' | 'createdAt'>>,
    options: UpdateOptions = {}
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const docs = await this.getAllDocuments();
    let matchedCount = 0;
    let modifiedCount = 0;

    const updatedDocs = docs.map(doc => {
      const matches = Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });

      if (matches) {
        matchedCount++;
        modifiedCount++;
        return {
          ...doc,
          ...update,
          updatedAt: new Date(),
        };
      }

      return doc;
    });

    // Handle upsert
    if (matchedCount === 0 && options.upsert) {
      const newDoc = {
        ...query,
        ...update,
        _id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;
      updatedDocs.push(newDoc);
      matchedCount = 1;
      modifiedCount = 1;
    }

    await this.saveAllDocuments(updatedDocs);

    return { matchedCount, modifiedCount };
  }

  /**
   * Update a single document
   */
  async updateOne(
    query: Partial<T>,
    update: Partial<Omit<T, '_id' | 'createdAt'>>,
    options: UpdateOptions = {}
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const docs = await this.getAllDocuments();
    let matchedCount = 0;
    let modifiedCount = 0;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const matches = Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });

      if (matches) {
        matchedCount = 1;
        modifiedCount = 1;
        docs[i] = {
          ...doc,
          ...update,
          updatedAt: new Date(),
        };
        break;
      }
    }

    // Handle upsert
    if (matchedCount === 0 && options.upsert) {
      const newDoc = {
        ...query,
        ...update,
        _id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as T;
      docs.push(newDoc);
      matchedCount = 1;
      modifiedCount = 1;
    }

    await this.saveAllDocuments(docs);

    return { matchedCount, modifiedCount };
  }

  /**
   * Delete documents matching a query
   */
  async deleteMany(query: Partial<T>): Promise<{ deletedCount: number }> {
    const docs = await this.getAllDocuments();
    const initialCount = docs.length;

    const filteredDocs = docs.filter(doc => {
      return !Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });
    });

    await this.saveAllDocuments(filteredDocs);

    return { deletedCount: initialCount - filteredDocs.length };
  }

  /**
   * Delete a single document
   */
  async deleteOne(query: Partial<T>): Promise<{ deletedCount: number }> {
    const docs = await this.getAllDocuments();
    let deletedCount = 0;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const matches = Object.entries(query).every(([key, value]) => {
        return doc[key] === value;
      });

      if (matches) {
        docs.splice(i, 1);
        deletedCount = 1;
        break;
      }
    }

    await this.saveAllDocuments(docs);

    return { deletedCount };
  }

  /**
   * Count documents matching a query
   */
  async countDocuments(query: Partial<T> = {}): Promise<number> {
    const docs = await this.find(query);
    return docs.length;
  }

  /**
   * Drop the entire collection
   */
  async drop(): Promise<void> {
    await spark.kv.delete(this.getKey());
  }

  /**
   * Create an index (placeholder for MongoDB compatibility)
   */
  async createIndex(keys: Record<string, 1 | -1>): Promise<void> {
    // In a real MongoDB implementation, this would create an index
    // For now, this is a no-op but maintains API compatibility
    console.log(`Index created on ${this.collectionName}:`, keys);
  }
}

/**
 * Database class that manages collections
 */
export class Database {
  private dbName: string;

  constructor(name: string = 'bookvault') {
    this.dbName = name;
  }

  /**
   * Get a collection
   */
  collection<T extends DatabaseDocument>(name: string): Collection<T> {
    return new Collection<T>(`${this.dbName}_${name}`);
  }

  /**
   * Drop the entire database
   */
  async drop(): Promise<void> {
    const keys = await spark.kv.keys();
    const dbKeys = keys.filter(key => key.startsWith(`db_${this.dbName}_`));
    
    for (const key of dbKeys) {
      await spark.kv.delete(key);
    }
  }

  /**
   * List all collections in the database
   */
  async listCollections(): Promise<string[]> {
    const keys = await spark.kv.keys();
    const dbKeys = keys.filter(key => key.startsWith(`db_${this.dbName}_`));
    
    return dbKeys.map(key => {
      const parts = key.split('_');
      return parts.slice(2).join('_'); // Remove 'db_' and database name prefix
    });
  }
}

/**
 * Create a database connection
 */
export function createDatabase(name?: string): Database {
  return new Database(name);
}

/**
 * Default database instance
 */
export const db = createDatabase();