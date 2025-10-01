import React, { useState } from 'react';
import { Book } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookOpen } from '@phosphor-icons/react';
import { GENRES, generateBookId } from '@/lib/utils-books';

interface AddBookDialogProps {
  onAdd: (book: Book) => void;
  trigger?: React.ReactNode;
}

export function AddBookDialog({ onAdd, trigger }: AddBookDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    totalPages: '',
    coverUrl: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author || !formData.genre || !formData.totalPages) {
      return;
    }

    const newBook: Book = {
      id: generateBookId(),
      title: formData.title,
      author: formData.author,
      genre: formData.genre,
      totalPages: parseInt(formData.totalPages),
      currentPage: 0,
      coverUrl: formData.coverUrl || undefined,
      addedDate: new Date().toISOString(),
      status: 'not-started',
      notes: formData.notes || undefined
    };

    onAdd(newBook);
    setFormData({
      title: '',
      author: '',
      genre: '',
      totalPages: '',
      coverUrl: '',
      notes: ''
    });
    setOpen(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus size={16} />
            Add Book
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen size={20} />
            Add New Book
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter book title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => updateField('author', e.target.value)}
              placeholder="Enter author name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="genre">Genre *</Label>
              <Select value={formData.genre} onValueChange={(value) => updateField('genre', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Total Pages *</Label>
              <Input
                id="pages"
                type="number"
                value={formData.totalPages}
                onChange={(e) => updateField('totalPages', e.target.value)}
                placeholder="0"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image URL</Label>
            <Input
              id="cover"
              value={formData.coverUrl}
              onChange={(e) => updateField('coverUrl', e.target.value)}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Personal notes about this book..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Add Book
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}