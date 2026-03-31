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
                <span className="bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-indigo)] bg-clip-text text-lg font-bold text-transparent">
                  Yarutso Car Rental
                </span>
              </Link>
              <div className="flex items-center gap-4 text-sm">
                {userId ? (
                  <>
                    <UserButton />
                  </>
                ) : (
                  <SignInButton mode="modal">
                    <button className="btn-primary px-4 py-1.5">
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
