"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { UserAvatar } from "./UserAvatar";

export function Navigation() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[var(--paper)] border-b-[4px] border-[var(--deep-golden)]">
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
                  className="flex items-center space-x-2 text-[var(--dark-tan)] hover:text-[var(--accent)] focus:outline-none"
                >
                  <span>{session.user?.name || session.user?.email}</span>
                  <UserAvatar user={session.user} />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[var(--paper)] ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu" style={{ backgroundColor: 'var(--paper)' }}>
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
                  className="text-[var(--golden-yellow)] hover:text-[var(--soft-yellow)] border-b-2 border-[var(--golden-yellow)] hover:border-[var(--soft-yellow)] transition-colors"
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