/* eslint-disable @next/next/no-img-element */
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
  title: "Yarutso Car Rental",
  description: "Car rental management system",
  icons: {
    icon: "/yarutso-logo.png",
  },
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
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur-sm">
            <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
              <Link href="/" className="flex items-center gap-3">
                <img
                  src="/yarutso-logo.png"
                  alt="Yarutso Car Rental"
                  className="h-10 w-auto"
                />
                <span className="text-lg font-bold text-[var(--brand-red)]">
                  Yarutso Car Rental
                </span>
              </Link>
              <div className="flex items-center gap-4 text-sm">
                <Link href="/cars">Cars</Link>
                {userId ? (
                  <>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/dashboard/customers">Customers</Link>
                  <Link href="/dashboard/quotes">Quotes</Link>
                  <Link href="/dashboard/payments">Payments</Link>
                  <Link href="/dashboard/reports">Reports</Link>
                  <Link href="/dashboard/service">Service</Link>
                  <Link href="/my-bookings">My Bookings</Link>
                  <UserButton />
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button className="rounded-md bg-[var(--brand-red)] px-3 py-1.5 text-white">
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
