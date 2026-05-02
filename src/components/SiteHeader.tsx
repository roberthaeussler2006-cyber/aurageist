"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const onCurrent = pathname === "/current" || pathname.startsWith("/leaderboard/current");
  const homeHref = onCurrent ? "/current" : "/";
  const otherMatchupHref = onCurrent ? "/" : "/current";
  const otherLabel = onCurrent ? "historical" : "current";
  const leaderboardHref = onCurrent ? "/leaderboard/current" : "/leaderboard";

  return (
    <header className="px-5 sm:px-8 pt-5 sm:pt-7 pb-2 flex items-center justify-between gap-3">
      <Link href={homeHref} className="wordmark text-2xl sm:text-3xl text-gradient shrink-0">
        aurageist
      </Link>
      <nav className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold text-muted flex items-center gap-3 sm:gap-5">
        <Link href={otherMatchupHref} className="hover:text-accent transition-colors">
          {otherLabel} →
        </Link>
        <Link href={leaderboardHref} className="hover:text-accent transition-colors">
          Leaderboard
        </Link>
      </nav>
    </header>
  );
}
