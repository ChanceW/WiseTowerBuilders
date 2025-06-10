'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [groupDetails, setGroupDetails] = useState<{
    name: string;
    admin: { name: string | null; email: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      // Redirect to login with callback URL
      const callbackUrl = `/invite/${params.code}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (status === 'authenticated') {
      fetchInviteDetails();
    }
  }, [status, params.code]);

  const fetchInviteDetails = async () => {
    try {
      const response = await fetch(`/api/study-groups/invite/${params.code}`);
      if (!response.ok) {
        if (response.status === 400) {
          // User is already a member, redirect to dashboard
          router.push('/dashboard');
          return;
        }
        throw new Error('Invalid or expired invitation');
      }
      const data = await response.json();
      setGroupDetails(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'Already a member of this group') {
        router.push('/dashboard');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/study-groups/invite/${params.code}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    }
  };

  const handleDecline = () => {
    router.push('/dashboard');
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="bg-[var(--paper)] p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Error</h1>
          <p className="text-[var(--foreground)] mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-[var(--deep-golden)] text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!groupDetails) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="bg-[var(--paper)] p-8 rounded-lg shadow-md max-w-md w-full text-center border-2 border-[var(--deep-golden)]">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Study Group Invitation</h1>
        <p className="text-[var(--foreground)] mb-6">
          You've been invited to join <span className="font-semibold">{groupDetails.name}</span>
          <br />
          by <span className="font-semibold">{groupDetails.admin.name || groupDetails.admin.email}</span>
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleAccept}
            className="bg-[var(--deep-golden)] text-white px-6 py-2 rounded-md hover:bg-opacity-90 transition-colors"
          >
            Accept Invitation
          </button>
          <button
            onClick={handleDecline}
            className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
} 