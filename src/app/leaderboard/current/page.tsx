import Link from "next/link";
import { LeaderboardClient } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default function CurrentLeaderboardPage() {
  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">The standings</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Current</span> Leaderboard
          </h1>
          <div className="mt-4 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">
            <Link href="/leaderboard" className="hover:text-accent transition-colors">
              ← see historical figures
            </Link>
          </div>
        </header>
        <LeaderboardClient category="current" />
      </div>
    </div>
  );
}
