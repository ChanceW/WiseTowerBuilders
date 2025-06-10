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
      </div>
    </div>
  );
} 