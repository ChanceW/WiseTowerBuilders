"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Create a client component for the login form
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      const callbackUrl = searchParams.get('callbackUrl');
      router.push(callbackUrl || '/dashboard');
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const callbackUrl = searchParams.get('callbackUrl');

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        return;
      }

      // Redirect to the callback URL if it exists, otherwise to dashboard
      router.push(callbackUrl || "/dashboard");
      router.refresh();
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const callbackUrl = searchParams.get('callbackUrl');
      await signIn('google', { callbackUrl: callbackUrl || '/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Google');
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] text-xl">Loading...</div>
      </div>
    );
  }

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
            Sign in to your account
          </h2>
          <p className="mt-2 text-[var(--foreground)]/80">
            Welcome back! Please enter your details
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
                Sign in with Google
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
                <Label htmlFor="email" className="text-[var(--foreground)]">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="bg-[var(--background)] border-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--deep-golden)] focus:border-[var(--deep-golden)]"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--foreground)]">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="bg-[var(--background)] border-[var(--muted)] text-[var(--foreground)] focus:ring-[var(--deep-golden)] focus:border-[var(--deep-golden)]"
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[var(--deep-golden)] hover:bg-[var(--deep-golden)]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with email"}
              </Button>

              <div className="mt-6 text-center text-sm text-[var(--foreground)]/80">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-[var(--deep-golden)] hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] text-xl">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 