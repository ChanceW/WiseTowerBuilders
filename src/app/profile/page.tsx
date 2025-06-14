'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await update({ name });
      toast.success('Profile updated successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        <Card className="border-[var(--deep-golden)] bg-[var(--paper)]">
          <CardHeader className="border-b border-[var(--deep-golden)]">
            <div className="flex items-center gap-4 mb-4">
              <UserAvatar user={session?.user} size={64} />
              <div>
                <CardTitle className="text-[var(--foreground)] text-2xl">
                  Profile Settings
                </CardTitle>
                <CardDescription className="text-[var(--foreground)]/70">
                  Update your profile information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-[var(--foreground)]">
                  Display Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  className="bg-[var(--background)] border-[var(--deep-golden)] text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)]"
                />
                <p className="text-sm text-[var(--foreground)]/70">
                  This name will be displayed to other users in study groups.
                </p>
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 