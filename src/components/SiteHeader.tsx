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
  const username = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? undefined;

  return (
    <header className="sticky top-3 sm:top-5 z-40 px-3 sm:px-6 mb-2">
      <div className="mx-auto max-w-6xl glass flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <Link
          href={homeHref}
          className="wordmark text-2xl sm:text-3xl text-gradient shrink-0 leading-none translate-y-[-1px]"
        >
          aurageist
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-bold">
          <Link
            href={otherMatchupHref}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-muted hover:text-accent hover:bg-white/60 transition-all"
          >
            <span className="hidden sm:inline">try </span>{otherLabel}
            <span className="hidden sm:inline"> →</span>
          </Link>
          <Link
            href={leaderboardHref}
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-muted hover:text-accent hover:bg-white/60 transition-all"
          >
            Ranks
          </Link>
          <Link
            href="/upsets"
            className="px-2.5 sm:px-3 py-1.5 rounded-full text-muted hover:text-accent hover:bg-white/60 transition-all"
          >
            Upsets
          </Link>
          {!loading && user && (
            <Link
              href="/leaderboard/personal"
              className="px-2.5 sm:px-3 py-1.5 rounded-full text-muted hover:text-accent hover:bg-white/60 transition-all"
            >
              Mine
            </Link>
          )}
          {!loading && (user ? (
            <button
              type="button"
              onClick={() => signOut()}
              title={username}
              className="px-3 py-1.5 rounded-full bg-foreground/85 text-background hover:bg-foreground transition-all"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/auth"
              className="btn-gradient !px-4 !py-2 !text-[10px]"
            >
              Sign in
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
