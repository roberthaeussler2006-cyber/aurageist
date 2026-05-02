import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthProvider } from "@/components/AuthProvider";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafaf7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="noise-overlay" aria-hidden />
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="px-5 sm:px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted/70 text-center">
            portraits via wikipedia · elo updates live
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
