import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aurageist — who has more aura?",
  description: "Vote between two historical figures. Whoever has more aura wins.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between">
          <Link href="/" className="wordmark text-base text-foreground/90 hover:text-foreground">
            aurageist
          </Link>
          <nav className="text-xs uppercase tracking-[0.2em] text-muted">
            <Link href="/leaderboard" className="hover:text-accent transition-colors">
              Leaderboard
            </Link>
          </nav>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="px-5 sm:px-8 py-4 text-[10px] uppercase tracking-[0.25em] text-muted/60 text-center">
          portraits via wikipedia · elo updates live
        </footer>
      </body>
    </html>
  );
}
