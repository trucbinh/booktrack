import React, { useState } from 'react';
import { Book } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookCard } from './BookCard';
import { AddBookDialog } from './AddBookDialog';
import { BookDetailDialog } from './BookDetailDialog';
import { MagnifyingGlass, Funnel, BookOpen } from '@phosphor-icons/react';
import { GENRES } from '@/lib/utils-books';

interface LibraryProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onUpdateBook: (book: Book) => void;
  onAddSession: (session: any) => void;
}

export function Library({ books, onAddBook, onUpdateBook, onAddSession }: LibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === 'all' || book.genre === genreFilter;
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    
    return matchesSearch && matchesGenre && matchesStatus;
  });

  const bookCounts = {
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    notStarted: books.filter(b => b.status === 'not-started').length
  };

  if (books.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Library</h1>
          <AddBookDialog onAdd={onAddBook} />
        </div>

        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
            <BookOpen size={40} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Your Digital Library</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start building your collection by adding your first book. Track your reading progress 
            and build lasting reading habits.
          </p>
          <AddBookDialog 
            onAdd={onAddBook}
            trigger={
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Add Your First Book
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Library</h1>
        <AddBookDialog onAdd={onAddBook} />
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <Badge variant="outline" className="px-3 py-1">
          Total: {bookCounts.total}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 border-accent/30 text-accent">
          Reading: {bookCounts.reading}
        </Badge>
        <Badge variant="outline" className="px-3 py-1 border-green-200 text-green-700">
          Completed: {bookCounts.completed}
        </Badge>
        <Badge variant="outline" className="px-3 py-1">
          Not Started: {bookCounts.notStarted}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-[140px]">
            <Funnel size={16} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {GENRES.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="reading">Reading</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onUpdate={onUpdateBook}
              onSelect={setSelectedBook}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No books found matching your filters.
          </p>
        </div>
      )}

      {/* Book Detail Dialog */}
      <BookDetailDialog
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdate={onUpdateBook}
        onAddSession={onAddSession}
      />
    </div>
  );
}