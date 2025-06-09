"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navigation() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[var(--paper)] border-b border-[#E5D5C0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/wtb_text.png"
                alt="Wise Tower Builders"
                width={180}
                height={45}
                priority
                className="object-contain rounded-lg"
              />
            </Link>
          </div>

          <div className="flex items-center">
            {status === "loading" ? (
              <div className="text-[var(--foreground)]">Loading...</div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-[var(--foreground)] hover:text-[var(--accent)] focus:outline-none"
                >
                  <span>{session.user?.name || session.user?.email}</span>
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--background)]">
                      {(session.user?.name?.[0] || session.user?.email?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[var(--background)] ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-[var(--foreground)] hover:text-[var(--accent)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-[var(--accent)] text-[var(--background)] px-4 py-2 rounded-md hover:bg-[var(--accent-hover)]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 