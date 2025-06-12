"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      
      if (session?.user) {
        const callbackUrl = searchParams.get('callbackUrl');
        router.push(callbackUrl || '/dashboard');
      }
    };
    
    checkAuth();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
      }

      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Redirect to callback URL or dashboard
      const callbackUrl = searchParams.get('callbackUrl');
      router.push(callbackUrl || '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const callbackUrl = searchParams.get('callbackUrl');
    await signIn('google', { callbackUrl: callbackUrl || '/dashboard' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--background)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            src="/wtb_logo.png"
            alt="Wise Tower Builders logo"
            width={300}
            height={100}
            priority
            className="mx-auto object-contain rounded-[25px]"
          />
          <h2 className="mt-6 text-3xl font-bold text-[var(--foreground)]">
            Create an Account
          </h2>
          <p className="mt-2 text-[var(--foreground)]/80">
            Join a study group to start your journey
          </p>
        </div>

        <Card className="w-full bg-[var(--paper)] border-[var(--muted)]">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full border-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--background)]"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--muted)]"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[var(--paper)] text-[var(--foreground)]">
                    Or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-[var(--foreground)]">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[var(--background)] border-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--deep-golden)] focus:border-[var(--deep-golden)]"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[var(--foreground)]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[var(--background)] border-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--deep-golden)] focus:border-[var(--deep-golden)]"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--foreground)]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[var(--background)] border-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--deep-golden)] focus:border-[var(--deep-golden)]"
                  placeholder="Create a password"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-white" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--foreground)]/80">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-[var(--deep-golden)] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
} 