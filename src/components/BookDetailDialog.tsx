import React, { useState } from 'react';
import { Book, ReadingSession } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Star, Clock, Target } from '@phosphor-icons/react';
import { calculateProgress, generateSessionId } from '@/lib/utils-books';

interface BookDetailDialogProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (book: Book) => void;
  onAddSession: (session: ReadingSession) => void;
}

export function BookDetailDialog({ book, open, onClose, onUpdate, onAddSession }: BookDetailDialogProps) {
  const [currentPage, setCurrentPage] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (book) {
      setCurrentPage(book.currentPage.toString());
      setRating(book.rating || 0);
      setNotes(book.notes || '');
    }
  }, [book]);

  if (!book) return null;

  const progress = calculateProgress(book.currentPage, book.totalPages);

  const handleUpdateProgress = () => {
    const newPage = parseInt(currentPage);
    const timeSpent = parseInt(sessionTime) || 0;
    
    if (isNaN(newPage) || newPage < 0 || newPage > book.totalPages) return;

    const wasCompleted = book.status === 'completed';
    const isNowCompleted = newPage >= book.totalPages;
    
    const updatedBook: Book = {
      ...book,
      currentPage: newPage,
      status: isNowCompleted ? 'completed' : newPage > 0 ? 'reading' : 'not-started',
      startedDate: book.startedDate || (newPage > 0 ? new Date().toISOString() : undefined),
      completedDate: isNowCompleted && !wasCompleted ? new Date().toISOString() : book.completedDate,
      rating: rating > 0 ? rating : book.rating,
      notes: notes.trim() || undefined
    };

    onUpdate(updatedBook);

    // Add reading session if pages were read
    const pagesRead = newPage - book.currentPage;
    if (pagesRead > 0) {
      const session: ReadingSession = {
        id: generateSessionId(),
        bookId: book.id,
        date: new Date().toISOString(),
        pagesRead,
        timeSpent
      };
      onAddSession(session);
    }

    setSessionTime('');
  };

  const handleStartReading = () => {
    if (book.currentPage === 0) {
      setCurrentPage('1');
    }
  };

  const getStatusColor = (status: Book['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reading':
        return 'bg-accent/20 text-accent-foreground border-accent/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: Book['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'reading':
        return 'Currently Reading';
      default:
        return 'Not Started';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Book Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book Info */}
          <div className="flex gap-4">
            <div className="w-24 h-36 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0 border">
              {book.coverUrl ? (
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpen size={32} className="text-primary" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-xl font-semibold">{book.title}</h2>
              <p className="text-muted-foreground">by {book.author}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{book.genre}</Badge>
                <Badge className={getStatusColor(book.status)}>
                  {getStatusText(book.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {book.totalPages} pages
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-accent" />
              <h3 className="font-medium">Reading Progress</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Page {book.currentPage} of {book.totalPages}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {book.status === 'completed' && book.completedDate && (
              <p className="text-sm text-green-600">
                Completed on {new Date(book.completedDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Update Progress */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium flex items-center gap-2">
              <Clock size={16} />
              Update Progress
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current-page">Current Page</Label>
                <Input
                  id="current-page"
                  type="number"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  min="0"
                  max={book.totalPages}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session-time">Time Spent (mins)</Label>
                <Input
                  id="session-time"
                  type="number"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  placeholder="Optional"
                  min="0"
                />
              </div>
            </div>

            {book.status === 'not-started' ? (
              <Button onClick={handleStartReading} className="w-full">
                Start Reading
              </Button>
            ) : (
              <Button onClick={handleUpdateProgress} className="w-full">
                Update Progress
              </Button>
            )}
          </div>

          {/* Rating */}
          {book.status === 'completed' && (
            <div className="space-y-3">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      size={24}
                      weight={i < rating ? 'fill' : 'regular'}
                      className={i < rating ? 'text-accent' : 'text-muted-foreground hover:text-accent/50'}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="book-notes">Notes</Label>
            <Textarea
              id="book-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your thoughts about this book..."
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => {
                const updatedBook: Book = {
                  ...book,
                  rating: rating > 0 ? rating : book.rating,
                  notes: notes.trim() || undefined
                };
                onUpdate(updatedBook);
                onClose();
              }}
              className="flex-1"
            >
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}