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
    <div className="min-h-screen flex flex-col items-center bg-[var(--background)]">
      {/* Hero Section */}
      <section className="w-full flex flex-col items-center justify-center p-8 pb-12 gap-8 sm:p-12 text-center">
        <Image
          src="/wtb_logo.png"
          alt="Wise Tower Builders logo"
          width={300}
          height={100}
          priority
          className="object-contain rounded-[25px] border-4 border-[var(--dark-tan)] mb-8"
        />
        <div className="max-w-4xl space-y-6">
          <p className="text-xl sm:text-2xl text-[var(--accent)] font-medium">
            Bringing Scripture to Life with AI and Sound Hermeneutics
          </p>
          <p className="text-lg text-[var(--foreground)] opacity-90">
            Whether you're leading a group or studying solo, WiseTowerBuilders helps you dig deeper by generating thoughtful, 
            theologically grounded discussion questions based on any passage of Scripture.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full bg-[var(--background-alt)] py-12 px-8 sm:px-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-[var(--foreground)]">
            Powerful Features for Deeper Bible Study
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                AI-Generated Questions
              </h3>
              <p className="text-[var(--foreground)] opacity-90">
                Our AI analyzes Scripture using principles of biblical interpretation—context, genre, 
                original language, and historical background—to create insightful, open-ended questions.
              </p>
            </div>
            <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Flexible Study Options
              </h3>
              <p className="text-[var(--foreground)] opacity-90">
                Perfect for both individual study and small group sessions, with customizable 
                difficulty and depth settings to match your needs.
              </p>
            </div>
            <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Multiple Bible Translations
              </h3>
              <p className="text-[var(--foreground)] opacity-90">
                Access and compare multiple Bible translations to gain deeper insights into 
                Scripture's meaning and context.
              </p>
            </div>
            <div className="bg-[var(--background)] p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-4 text-[var(--foreground)]">
                Theologically Grounded
              </h3>
              <p className="text-[var(--foreground)] opacity-90">
                Every feature is designed to honor Scripture's integrity while helping you 
                explore God's Word with clarity and confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-12 px-8 sm:px-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-[var(--foreground)]">
            Start Your Journey Today
          </h2>
          <p className="text-xl text-[var(--foreground)] opacity-90">
            Begin exploring the Bible with clarity, depth, and confidence—powered by tools 
            that honor Scripture's integrity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            {status === "authenticated" ? (
              <a
                href="/dashboard"
                className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Dashboard
              </a>
            ) : (
              <>
                <a
                  href="/register"
                  className="px-8 py-3 bg-[var(--accent)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Get Started
                </a>
                <a
                  href="/login"
                  className="px-8 py-3 border-2 border-[var(--accent)] text-[var(--accent)] rounded-lg font-semibold hover:bg-[var(--accent)] hover:text-white transition-colors"
                >
                  Sign In
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
