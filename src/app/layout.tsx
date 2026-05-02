import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthProvider } from "@/components/AuthProvider";
import { BrainrotPanel } from "@/components/BrainrotPanel";
import { SlotMachine } from "@/components/SlotMachine";
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
          <footer className="px-5 sm:px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted/70 text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>portraits via wikipedia</span>
            <span aria-hidden className="text-muted/30">·</span>
            <span>elo updates live</span>
            <span aria-hidden className="text-muted/30">·</span>
            <span title="for marc — yes the 67 is on purpose" className="tracking-[0.3em]">67</span>
          </footer>
          <BrainrotPanel />
          <SlotMachine />
        </AuthProvider>
      </body>
    </html>
  );
}
