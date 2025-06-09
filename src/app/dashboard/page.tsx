"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-[var(--background)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">
          Welcome to your Dashboard
        </h1>
        
        <div className="bg-[var(--muted)] p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
            Your Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Name
              </label>
              <p className="mt-1 text-[var(--foreground)]">
                {session?.user?.name || "Not provided"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <p className="mt-1 text-[var(--foreground)]">
                {session?.user?.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                Account Created
              </label>
              <p className="mt-1 text-[var(--foreground)]">
                {session?.user?.createdAt
                  ? new Date(session.user.createdAt).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 