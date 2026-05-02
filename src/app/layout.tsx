import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { AuthProvider } from "@/components/AuthProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { BrainrotPanel } from "@/components/BrainrotPanel";
import { SlotMachine } from "@/components/SlotMachine";
import { KirkClicker } from "@/components/KirkClicker";
import { KirkRain } from "@/components/KirkRain";
import { KirkTicker } from "@/components/KirkTicker";
import { FloatingDebris } from "@/components/FloatingDebris";
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
        <FloatingDebris />
        <AuthProvider>
          <WalletProvider>
            <SiteHeader />
            <main className="flex-1 flex flex-col">{children}</main>
            <footer className="px-5 sm:px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-semibold text-muted/70 text-center flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>portraits via wikipedia</span>
              <span aria-hidden className="text-muted/30">·</span>
              <span>elo updates live</span>
            </footer>
            <BrainrotPanel />
            <SlotMachine />
            <KirkClicker />
            <KirkRain />
            <KirkTicker />
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
