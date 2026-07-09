import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { HeaderNav } from "@/components/HeaderNav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Glade Contract Review",
  description:
    "AI-assisted contract review that checks inbound agreements against your firm's playbook — with grounded citations and human sign-off.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="no-print sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
                <Leaf size={16} strokeWidth={2.5} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                Glade
                <span className="ml-1.5 font-normal text-muted">
                  Contract Review
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <HeaderNav />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
          {children}
        </main>
        <footer className="no-print border-t border-line py-5 text-center text-xs text-faint">
          Glade Contract Review · a portfolio prototype · not legal advice
        </footer>
      </body>
    </html>
  );
}
