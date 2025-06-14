import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { Navigation } from "@/components/Navigation";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wise Tower Builders",
  description: "Building excellence in construction",
  icons: {
    icon: [
      {
        url: '/wtb_icon.png',
        type: 'image/png',
      }
    ],
    shortcut: '/wtb_icon.png',
    apple: '/wtb_icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${inter.variable} antialiased min-h-screen bg-[var(--background)]`}
        suppressHydrationWarning
      >
        <NextAuthProvider>
          <div className="flex flex-col min-h-screen">
            <Navigation />
            <main className="flex-grow">
              {children}
            </main>
          </div>
        </NextAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
