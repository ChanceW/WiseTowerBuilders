"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";

export default function Home() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--foreground)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-[var(--background)]">
      <main className="flex flex-col items-center gap-[32px] max-w-4xl w-full text-center">
        <Image
          src="/wtb_logo.png"
          alt="Wise Tower Builders logo"
          width={300}
          height={100}
          priority
          className="object-contain rounded-[25px] border-4 border-[var(--dark-tan)]"
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Welcome to Wise Tower Builders</h1>
          <p className="text-xl text-[var(--accent)] font-medium">Building excellence in construction</p>
        </div>
      </main>
    </div>
  );
}
