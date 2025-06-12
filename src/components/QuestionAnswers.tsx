'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserAvatar } from './UserAvatar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Answer {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface QuestionAnswersProps {
  questionId: string;
}

export function QuestionAnswers({ questionId }: QuestionAnswersProps) {
  const { data: session } = useSession();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnswers();
  }, [questionId]);

  const fetchAnswers = async () => {
    try {
      console.log('Fetching answers for question:', questionId);
      const response = await fetch(`/api/questions/${questionId}/answers`);
      console.log('Answers API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Answers API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch answers: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Answers API response data:', data);
      setAnswers(data);
    } catch (error) {
      console.error('Error fetching answers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load answers');
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newAnswer.trim() }),
      });

      if (!response.ok) throw new Error('Failed to submit answer');
      
      const answer = await response.json();
      setAnswers(prev => [answer, ...prev.filter(a => a.id !== answer.id)]);
      setNewAnswer('');
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Answer Form */}
      {session?.user && (
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              <Textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Share your thoughts..."
                className="min-h-[100px]"
                required
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !newAnswer.trim()}
                className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Answers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h3>
        {answers.map((answer) => (
          <Card key={answer.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <UserAvatar user={answer.user} size={40} />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--foreground)]">
                      {answer.user.name || answer.user.email.split('@')[0]}
                    </span>
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                      {answer.updatedAt !== answer.createdAt && ' (edited)'}
                    </span>
                  </div>
                  <p className="text-[var(--foreground)] whitespace-pre-wrap">
                    {answer.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {answers.length === 0 && (
          <p className="text-[var(--muted-foreground)] text-center py-4">
            No answers yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
} 