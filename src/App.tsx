import React, { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Book, ReadingSession } from '@/lib/types';
import { Dashboard } from '@/components/Dashboard';
import { Library } from '@/components/Library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { ChartLine, BookOpen } from '@phosphor-icons/react';
import { calculateReadingStats } from '@/lib/utils-books';

function App() {
  const [books, setBooks] = useKV<Book[]>('books', []);
  const [sessions, setSessions] = useKV<ReadingSession[]>('reading-sessions', []);
  const [dailyGoal] = useKV<number>('daily-goal', 20);
  
  // Ensure we have valid arrays
  const booksArray = books || [];
  const sessionsArray = sessions || [];
  const dailyGoalValue = dailyGoal || 20;
  
  // Calculate today's pages read
  const today = new Date().toDateString();
  const todayPages = sessionsArray
    .filter(session => new Date(session.date).toDateString() === today)
    .reduce((sum, session) => sum + session.pagesRead, 0);

  const stats = calculateReadingStats(booksArray, sessionsArray);

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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">BookVault</h1>
              <p className="text-sm text-muted-foreground">Your Digital Reading Companion</p>
            </div>
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
              books={booksArray}
              onAddBook={handleAddBook}
              onUpdateBook={handleUpdateBook}
              onAddSession={handleAddSession}
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

export default App;