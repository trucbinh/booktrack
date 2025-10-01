import React, { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Book, ReadingSession } from '@/lib/types';
import { Dashboard } from '@/components/Dashboard';
import { Library } from '@/components/Library';
import { AuthProvider, useAuth } from '@/components/AuthProvider';
import { AuthScreen } from '@/components/AuthScreen';
import { UserMenu } from '@/components/UserMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ChartLine, BookOpen } from '@phosphor-icons/react';
import { calculateReadingStats } from '@/lib/utils-books';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  // User-specific keys for data isolation
  const userBooksKey = user ? `books_${user.id}` : 'books';
  const userSessionsKey = user ? `reading-sessions_${user.id}` : 'reading-sessions';
  const userGoalKey = user ? `daily-goal_${user.id}` : 'daily-goal';
  
  const [books, setBooks] = useKV<Book[]>(userBooksKey, []);
  const [sessions, setSessions] = useKV<ReadingSession[]>(userSessionsKey, []);
  const [dailyGoal] = useKV<number>(userGoalKey, user?.preferences.dailyGoal || 20);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">BookVault</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Ensure we have valid arrays and user
  const booksArray = books || [];
  const sessionsArray = sessions || [];
  const dailyGoalValue = dailyGoal || user?.preferences.dailyGoal || 20;
  
  // Filter data by current user
  const userBooks = booksArray.filter(book => book.userId === user!.id);
  const userSessions = sessionsArray.filter(session => session.userId === user!.id);
  
  // Calculate today's pages read
  const today = new Date().toDateString();
  const todayPages = userSessions
    .filter(session => new Date(session.date).toDateString() === today)
    .reduce((sum, session) => sum + session.pagesRead, 0);

  const stats = calculateReadingStats(userBooks, userSessions);

  const handleAddBook = (newBook: Book) => {
    setBooks(currentBooks => [...(currentBooks || []), newBook]);
    toast.success(`"${newBook.title}" added to your library!`);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks(currentBooks =>
      (currentBooks || []).map(book => book.id === updatedBook.id ? updatedBook : book)
    );
    
    // Show completion toast if book was just completed
    const originalBook = booksArray.find(b => b.id === updatedBook.id);
    if (originalBook?.status !== 'completed' && updatedBook.status === 'completed') {
      toast.success(`🎉 Congratulations! You completed "${updatedBook.title}"!`);
    }
  };

  const handleAddSession = (session: ReadingSession) => {
    setSessions(currentSessions => [...(currentSessions || []), session]);
    
    if (session.pagesRead > 0) {
      toast.success(`Great job! You read ${session.pagesRead} pages.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">BookVault</h1>
                <p className="text-sm text-muted-foreground">Your Digital Reading Companion</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <ChartLine size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen size={16} />
              Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard 
              stats={stats} 
              dailyGoal={dailyGoalValue}
              todayPages={todayPages}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-6">
            <Library
              books={userBooks}
              onAddBook={handleAddBook}
              onUpdateBook={handleUpdateBook}
              onAddSession={handleAddSession}
              userId={user!.id}
            />
          </TabsContent>
        </Tabs>
      </div>

      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;