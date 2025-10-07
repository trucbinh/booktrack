/**
 * Database Demo Component
 * Demonstrates MongoDB-compatible database operations using the database abstraction layer
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Database, 
  Plus, 
  Book, 
  User, 
  Calendar,
  Trash,
  MagnifyingGlass,
  ChartBar
} from '@phosphor-icons/react';
import { 
  bookService, 
  userService, 
  readingSessionService, 
  initializeDatabase,
  migrateData 
} from '@/lib/database-service';
import { BookDocument, UserDocument, ReadingSessionDocument } from '@/lib/schemas';

export function DatabaseDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [books, setBooks] = useState<BookDocument[]>([]);
  const [sessions, setSessions] = useState<ReadingSessionDocument[]>([]);
  const [stats, setStats] = useState<any>({});

  // Form states
  const [newUser, setNewUser] = useState({
    githubId: '',
    login: '',
    email: '',
    avatarUrl: 'https://github.com/github.png'
  });

  const [newBook, setNewBook] = useState({
    userId: '',
    title: '',
    author: '',
    totalPages: 0,
    currentPage: 0,
    status: 'want-to-read' as const,
    tags: [] as string[]
  });

  const [newSession, setNewSession] = useState({
    userId: '',
    bookId: '',
    duration: 0,
    pagesRead: 0,
    startPage: 0,
    endPage: 0,
    notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const handleInitializeDatabase = async () => {
    try {
      await initializeDatabase();
      await migrateData();
      setIsInitialized(true);
      toast.success('Database initialized successfully!');
    } catch (error) {
      console.error('Database initialization failed:', error);
      toast.error('Failed to initialize database');
    }
  };

  const loadData = async () => {
    try {
      // In a real app, you'd load data based on current user
      // For demo, we'll load all data
      const allUsers = await userService.collection.find({});
      setUsers(allUsers);

      if (allUsers.length > 0) {
        const userId = allUsers[0]._id;
        const userBooks = await bookService.findByUser(userId);
        setBooks(userBooks);

        const userSessions = await readingSessionService.findByUser(userId, 10);
        setSessions(userSessions);

        const readingStats = await bookService.getReadingStats(userId);
        setStats(readingStats);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!newUser.githubId || !newUser.login || !newUser.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      const user = await userService.createUser(newUser);
      setUsers(prev => [...prev, user]);
      setNewUser({ githubId: '', login: '', email: '', avatarUrl: 'https://github.com/github.png' });
      toast.success(`User ${user.login} created successfully!`);
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleCreateBook = async () => {
    try {
      if (!newBook.userId || !newBook.title || !newBook.author) {
        toast.error('Please fill in all required fields');
        return;
      }

      const book = await bookService.createBook({
        ...newBook,
        date: new Date()
      });
      
      setBooks(prev => [...prev, book]);
      setNewBook({
        userId: newBook.userId,
        title: '',
        author: '',
        totalPages: 0,
        currentPage: 0,
        status: 'want-to-read',
        tags: []
      });
      
      toast.success(`Book "${book.title}" added successfully!`);
      await loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to create book:', error);
      toast.error('Failed to create book');
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!newSession.userId || !newSession.bookId || newSession.pagesRead <= 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      const session = await readingSessionService.createSession({
        ...newSession,
        date: new Date()
      });
      
      setSessions(prev => [session, ...prev.slice(0, 9)]); // Keep latest 10
      setNewSession({
        userId: newSession.userId,
        bookId: newSession.bookId,
        duration: 0,
        pagesRead: 0,
        startPage: newSession.endPage,
        endPage: 0,
        notes: ''
      });
      
      toast.success(`Reading session recorded: ${session.pagesRead} pages!`);
      await loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    try {
      await bookService.deleteBook(bookId);
      setBooks(prev => prev.filter(book => book._id !== bookId));
      toast.success('Book deleted successfully!');
      await loadData(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Failed to delete book');
    }
  };

  const handleSearchBooks = async () => {
    if (!searchTerm.trim()) {
      await loadData();
      return;
    }

    try {
      if (users.length > 0) {
        const results = await bookService.searchBooks(users[0]._id, searchTerm);
        setBooks(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Database size={32} className="text-primary" />
          <h1 className="text-3xl font-bold">MongoDB-Compatible Database Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This demonstrates a complete MongoDB-compatible database abstraction layer built on Spark KV storage.
          All operations use the same API you would use with real MongoDB/Cosmos DB.
        </p>
        
        {!isInitialized && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Initialize Database</CardTitle>
              <CardDescription>
                Set up indexes and run migrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInitializeDatabase} className="w-full">
                <Database className="mr-2" size={16} />
                Initialize Database
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {isInitialized && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={20} />
                User Management
              </CardTitle>
              <CardDescription>Create and manage users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="githubId">GitHub ID</Label>
                  <Input
                    id="githubId"
                    value={newUser.githubId}
                    onChange={(e) => setNewUser(prev => ({ ...prev, githubId: e.target.value }))}
                    placeholder="user123"
                  />
                </div>
                <div>
                  <Label htmlFor="login">Login</Label>
                  <Input
                    id="login"
                    value={newUser.login}
                    onChange={(e) => setNewUser(prev => ({ ...prev, login: e.target.value }))}
                    placeholder="johndoe"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>

              <Button onClick={handleCreateUser} className="w-full">
                <Plus className="mr-2" size={16} />
                Create User
              </Button>

              <div className="space-y-2">
                <h4 className="font-medium">Existing Users ({users.length})</h4>
                {users.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">{user.login}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="secondary">{user.githubId}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Book Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book size={20} />
                Book Management
              </CardTitle>
              <CardDescription>Add and manage books</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userId">User</Label>
                <select
                  id="userId"
                  className="w-full p-2 border rounded"
                  value={newBook.userId}
                  onChange={(e) => setNewBook(prev => ({ ...prev, userId: e.target.value }))}
                >
                  <option value="">Select a user</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>{user.login}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newBook.title}
                    onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={newBook.author}
                    onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="totalPages">Total Pages</Label>
                  <Input
                    id="totalPages"
                    type="number"
                    value={newBook.totalPages}
                    onChange={(e) => setNewBook(prev => ({ ...prev, totalPages: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    className="w-full p-2 border rounded"
                    value={newBook.status}
                    onChange={(e) => setNewBook(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="want-to-read">Want to Read</option>
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleCreateBook} className="w-full" disabled={!newBook.userId}>
                <Plus className="mr-2" size={16} />
                Add Book
              </Button>
            </CardContent>
          </Card>

          {/* Reading Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
                Reading Sessions
              </CardTitle>
              <CardDescription>Record reading progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sessionUser">User</Label>
                  <select
                    id="sessionUser"
                    className="w-full p-2 border rounded"
                    value={newSession.userId}
                    onChange={(e) => setNewSession(prev => ({ ...prev, userId: e.target.value }))}
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.login}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="sessionBook">Book</Label>
                  <select
                    id="sessionBook"
                    className="w-full p-2 border rounded"
                    value={newSession.bookId}
                    onChange={(e) => setNewSession(prev => ({ ...prev, bookId: e.target.value }))}
                  >
                    <option value="">Select a book</option>
                    {books.filter(book => book.userId === newSession.userId).map(book => (
                      <option key={book._id} value={book._id}>{book.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="duration">Minutes</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newSession.duration}
                    onChange={(e) => setNewSession(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="pagesRead">Pages Read</Label>
                  <Input
                    id="pagesRead"
                    type="number"
                    value={newSession.pagesRead}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      pagesRead: parseInt(e.target.value) || 0,
                      endPage: prev.startPage + (parseInt(e.target.value) || 0)
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="startPage">Start Page</Label>
                  <Input
                    id="startPage"
                    type="number"
                    value={newSession.startPage}
                    onChange={(e) => setNewSession(prev => ({ 
                      ...prev, 
                      startPage: parseInt(e.target.value) || 0,
                      endPage: (parseInt(e.target.value) || 0) + prev.pagesRead
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newSession.notes}
                  onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Reading notes..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleCreateSession} 
                className="w-full" 
                disabled={!newSession.userId || !newSession.bookId}
              >
                <Plus className="mr-2" size={16} />
                Record Session
              </Button>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBar size={20} />
                Reading Statistics
              </CardTitle>
              <CardDescription>Database-driven analytics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-2xl font-bold text-primary">{stats.totalBooks || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Books</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-2xl font-bold text-accent">{stats.completed || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-2xl font-bold text-secondary-foreground">{stats.currentlyReading || 0}</div>
                  <div className="text-sm text-muted-foreground">Reading</div>
                </div>
                <div className="text-center p-3 bg-muted rounded">
                  <div className="text-2xl font-bold text-muted-foreground">{stats.wantToRead || 0}</div>
                  <div className="text-sm text-muted-foreground">Want to Read</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Recent Sessions</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sessions.map(session => {
                    const book = books.find(b => b._id === session.bookId);
                    return (
                      <div key={session._id} className="text-sm p-2 bg-muted rounded">
                        <div className="font-medium">{book?.title || 'Unknown Book'}</div>
                        <div className="text-muted-foreground">
                          {session.pagesRead} pages • {session.duration} min
                        </div>
                      </div>
                    );
                  })}
                  {sessions.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No reading sessions recorded yet
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isInitialized && books.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MagnifyingGlass size={20} />
              Book Library
            </CardTitle>
            <CardDescription>Search and manage your books</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search books by title, author, or genre..."
                className="flex-1"
              />
              <Button onClick={handleSearchBooks}>
                <MagnifyingGlass size={16} />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {books.map(book => (
                <Card key={book._id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">{book.title}</CardTitle>
                        <CardDescription className="text-sm">{book.author}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBook(book._id)}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span>{book.currentPage}/{book.totalPages} pages</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(book.currentPage / book.totalPages) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <Badge variant={
                          book.status === 'completed' ? 'default' :
                          book.status === 'reading' ? 'secondary' : 'outline'
                        }>
                          {book.status.replace('-', ' ')}
                        </Badge>
                        {book.tags.length > 0 && (
                          <div className="flex gap-1">
                            {book.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}