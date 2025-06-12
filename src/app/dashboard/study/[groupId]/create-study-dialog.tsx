'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import bibleBooks from '@/lib/bibleBooks.json';
import { Shuffle } from "lucide-react"

interface CreateStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyGroupId: string;
  onStudyCreated: () => void;
}

export function CreateStudyDialog({ open, onOpenChange, studyGroupId, onStudyCreated }: CreateStudyDialogProps) {
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRandomBook = () => {
    const randomIndex = Math.floor(Math.random() * bibleBooks.length);
    const randomBook = bibleBooks[randomIndex];
    setSelectedBook(randomBook.name);
    setSelectedChapter(''); // Reset chapter when book changes
  };

  const handleRandomChapter = () => {
    if (!selectedBook) return;
    const book = bibleBooks.find(b => b.name === selectedBook);
    if (!book) return;
    const randomChapter = Math.floor(Math.random() * book.chapters) + 1;
    setSelectedChapter(randomChapter.toString());
  };

  const chapterOptions = selectedBook
    ? Array.from({ length: bibleBooks.find(b => b.name === selectedBook)?.chapters || 0 }, (_, i) => i + 1)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedChapter) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyGroupId,
          bibleBook: selectedBook,
          bibleChapter: parseInt(selectedChapter),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create study');
      }

      onOpenChange(false);
      setSelectedBook('');
      setSelectedChapter('');
      onStudyCreated();
    } catch (error) {
      console.error('Error creating study:', error);
      alert('Failed to create study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--paper)]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--foreground)]">Create New Study</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="bible-book" className="text-[var(--foreground)]">Bible Book</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomBook}
                  className="text-[var(--foreground)] hover:bg-[var(--deep-golden)] hover:text-[var(--paper)]"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Random
                </Button>
              </div>
              <Select
                value={selectedBook}
                onValueChange={(value: string) => {
                  setSelectedBook(value);
                  setSelectedChapter('');
                }}
              >
                <SelectTrigger id="bible-book" className="bg-[var(--background)] text-[var(--foreground)] border-[var(--muted)]">
                  <SelectValue placeholder="Select a book" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto bg-[var(--paper)]">
                  {bibleBooks.map((book: { name: string; chapters: number }) => (
                    <SelectItem 
                      key={book.name} 
                      value={book.name}
                      className="text-[var(--foreground)] hover:bg-[var(--deep-golden)] hover:text-[var(--paper)]"
                    >
                      {book.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="bible-chapter" className="text-[var(--foreground)]">Chapter</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRandomChapter}
                  disabled={!selectedBook}
                  className="text-[var(--foreground)] hover:bg-[var(--deep-golden)] hover:text-[var(--paper)] disabled:opacity-50"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Random
                </Button>
              </div>
              <Select
                value={selectedChapter}
                onValueChange={setSelectedChapter}
                disabled={!selectedBook}
              >
                <SelectTrigger id="bible-chapter" className="bg-[var(--background)] text-[var(--foreground)] border-[var(--muted)]">
                  <SelectValue placeholder="Select a chapter" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--paper)]">
                  {chapterOptions.map((chapter) => (
                    <SelectItem 
                      key={chapter} 
                      value={chapter.toString()}
                      className="text-[var(--foreground)] hover:bg-[var(--deep-golden)] hover:text-[var(--paper)]"
                    >
                      Chapter {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedBook || !selectedChapter}
              className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
            >
              {isSubmitting ? 'Creating...' : 'Create Study'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 