import React from 'react';
import { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Star } from '@phosphor-icons/react';
import { calculateProgress } from '@/lib/utils-books';

interface BookCardProps {
  book: Book;
  onUpdate: (book: Book) => void;
  onSelect: (book: Book) => void;
}

export function BookCard({ book, onUpdate, onSelect }: BookCardProps) {
  const progress = calculateProgress(book.currentPage, book.totalPages);
  
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
        return 'Reading';
      default:
        return 'Not Started';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <CardContent className="p-4" onClick={() => onSelect(book)}>
        <div className="flex gap-4">
          {/* Book Cover */}
          <div className="w-16 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md flex items-center justify-center flex-shrink-0 border">
            {book.coverUrl ? (
              <img 
                src={book.coverUrl} 
                alt={book.title}
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <BookOpen size={24} className="text-primary" />
            )}
          </div>

          {/* Book Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-card-foreground truncate" title={book.title}>
                  {book.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate" title={book.author}>
                  by {book.author}
                </p>
              </div>
              <Badge className={getStatusColor(book.status)}>
                {getStatusText(book.status)}
              </Badge>
            </div>

            <div className="space-y-2">
              <Badge variant="outline" className="text-xs">
                {book.genre}
              </Badge>

              {book.status !== 'not-started' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{book.currentPage} / {book.totalPages} pages</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {book.rating && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      weight={i < book.rating! ? 'fill' : 'regular'}
                      className={i < book.rating! ? 'text-accent' : 'text-muted-foreground'}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}