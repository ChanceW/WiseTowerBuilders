'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import Link from 'next/link';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [groupDetails, setGroupDetails] = useState<{
    name: string;
    admin: { 
      name: string | null; 
      email: string;
      image: string | null;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Invite page mounted with code:', params.code);
    console.log('Current session status:', status);
    
    if (status !== 'loading') {
      console.log('Session loaded, fetching invite details...');
      fetchInviteDetails();
    }
  }, [status, params.code]);

  const fetchInviteDetails = async () => {
    console.log('Starting to fetch invite details for code:', params.code);
    try {
      if (!params.code || typeof params.code !== 'string') {
        console.error('Invalid code format:', params.code);
        throw new Error('Invalid invite code format');
      }

      console.log('Making fetch request to:', `/api/study-groups/invite/${params.code}`);
      const response = await fetch(`/api/study-groups/invite/${params.code}`);
      console.log('Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      let data;
      try {
        data = await response.json();
        console.log('Response data parsed successfully:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      if (!response.ok) {
        console.error('Response not OK:', {
          status: response.status,
          data: data
        });
        if (response.status === 400) {
          console.log('User is already a member, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        if (response.status === 404) {
          throw new Error('This invitation link is invalid or has expired');
        }
        if (response.status === 401) {
          console.log('User is not authenticated, showing sign-in options');
          setGroupDetails(null);
          setIsLoading(false);
          return;
        }
        throw new Error(data?.error || `Failed to load invitation (${response.status})`);
      }
      
      if (!data) {
        console.error('No data received from server');
        throw new Error('Failed to load invitation details');
      }

      if (!data.name || !data.admin) {
        console.error('Invalid data structure received:', data);
        throw new Error('Invalid invitation data received');
      }
      
      console.log('Setting group details:', data);
      setGroupDetails(data);
    } catch (err) {
      console.error('Error in fetchInviteDetails:', err);
      if (err instanceof Error && err.message === 'Already a member of this group') {
        router.push('/dashboard');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      console.log('Fetch invite details completed, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (status !== 'authenticated') {
      handleSignIn();
      return;
    }

    try {
      console.log('Accepting invitation...');
      const response = await fetch(`/api/study-groups/invite/${params.code}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    }
  };

  const handleSignIn = () => {
    console.log('Initiating sign in...');
    const callbackUrl = `/invite/${params.code}`;
    signIn(undefined, { callbackUrl });
  };

  // Show loading state only when we're actually loading the session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] text-xl">Loading session...</div>
      </div>
    );
  }

  // Show loading state for invite details
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] text-xl">Loading invitation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-[var(--foreground)]">{error}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!groupDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card className="max-w-md w-full border-2 border-[var(--deep-golden)]">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-[var(--foreground)]">
              Study Group Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-[var(--foreground)]">
                Sign in to view and join this study group
              </p>
              <div className="space-y-3">
                <Button
                  onClick={handleSignIn}
                  className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
                >
                  Sign In
                </Button>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Don't have an account?{' '}
                  <Link 
                    href={`/register?callbackUrl=${encodeURIComponent(`/invite/${params.code}`)}`}
                    className="text-[var(--deep-golden)] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card className="max-w-md w-full border-2 border-[var(--deep-golden)]">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-[var(--foreground)]">
            Study Group Invitation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Details */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-[var(--foreground)]">
              {groupDetails.name}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <UserAvatar 
                user={{ 
                  id: groupDetails.admin.email,
                  name: groupDetails.admin.name, 
                  email: groupDetails.admin.email,
                  image: groupDetails.admin.image 
                }} 
                size={24} 
              />
              <span className="text-[var(--foreground)]">
                Invited by {groupDetails.admin.name || groupDetails.admin.email}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          {status === 'authenticated' ? (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
              >
                Accept Invitation
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="w-full border-[var(--deep-golden)] text-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/10"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-[var(--foreground)]">
                <p className="mb-2">Sign in to join this study group</p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Don't have an account?{' '}
                  <Link 
                    href={`/register?callbackUrl=${encodeURIComponent(`/invite/${params.code}`)}`}
                    className="text-[var(--deep-golden)] hover:underline"
                  >
                    Create one
                  </Link>
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={handleSignIn}
                  className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-[var(--paper)]"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full border-[var(--deep-golden)] text-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/10"
                >
                  Learn More
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 