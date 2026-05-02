"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const onCurrent = pathname === "/current" || pathname.startsWith("/leaderboard/current");
  const homeHref = onCurrent ? "/current" : "/";
  const otherMatchupHref = onCurrent ? "/" : "/current";
  const otherLabel = onCurrent ? "historical" : "current";
  const leaderboardHref = onCurrent ? "/leaderboard/current" : "/leaderboard";
  const { user, signOut, loading } = useAuth();

  return (
    <header className="px-5 sm:px-8 pt-6 pb-2 flex items-center justify-between gap-3">
      <Link href={homeHref} className="wordmark text-base text-foreground/90 hover:text-foreground shrink-0">
        aurageist
      </Link>
      <nav className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted flex items-center gap-3 sm:gap-5">
        <Link href={otherMatchupHref} className="hover:text-accent transition-colors">
          {otherLabel} →
        </Link>
        <Link href={leaderboardHref} className="hover:text-accent transition-colors">
          Leaderboard
        </Link>
        {!loading && user && (
          <Link href="/leaderboard/personal" className="hover:text-accent transition-colors">
            Mine
          </Link>
        )}
        {!loading && (user ? (
          <button
            type="button"
            onClick={() => signOut()}
            className="hover:text-accent transition-colors uppercase tracking-[0.2em]"
            title={user.email ?? undefined}
          >
            Sign out
          </button>
        ) : (
          <Link href="/auth" className="hover:text-accent transition-colors">
            Sign in
          </Link>
        ))}
      </nav>
    </header>
  );
}
