import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SwiftRide Rentals",
  description: "Full-stack car rental system built with Next.js",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();

  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full bg-slate-100 text-slate-900">
          <header className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
              <Link href="/" className="text-lg font-bold text-blue-700">
                SwiftRide Rentals
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/">Cars</Link>
                {userId ? (
                  <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/my-bookings">My Bookings</Link>
                  <UserButton />
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button className="rounded-md bg-blue-700 px-3 py-1.5 text-white">
                      Sign in
                    </button>
                  </SignInButton>
                )}
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl p-4">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
