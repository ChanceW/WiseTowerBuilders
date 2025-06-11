'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CreateStudyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studyGroupId: string;
  onStudyCreated: () => void;
}

interface QuestionInput {
  context: string;
  discussion: string;
}

export function CreateStudyDialog({ open, onOpenChange, studyGroupId, onStudyCreated }: CreateStudyDialogProps) {
  const [questions, setQuestions] = useState<QuestionInput[]>([{ context: '', discussion: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, { context: '', discussion: '' }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionInput, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/studies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studyGroupId,
          questions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create study');
      }

      onOpenChange(false);
      setQuestions([{ context: '', discussion: '' }]);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Study</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {questions.map((question, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Question {index + 1}</h3>
                {questions.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`context-${index}`}>Context</Label>
                <Textarea
                  id={`context-${index}`}
                  value={question.context}
                  onChange={(e) => updateQuestion(index, 'context', e.target.value)}
                  placeholder="Enter the context for this question"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`discussion-${index}`}>Discussion Points</Label>
                <Textarea
                  id={`discussion-${index}`}
                  value={question.discussion}
                  onChange={(e) => updateQuestion(index, 'discussion', e.target.value)}
                  placeholder="Enter discussion points for this question"
                  required
                />
              </div>
            </div>
          ))}
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={addQuestion}
              className="border-[var(--deep-golden)] text-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/10"
            >
              Add Question
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
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