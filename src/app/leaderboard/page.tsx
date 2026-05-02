import { LeaderboardClient } from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted">The standings</div>
          <h1 className="serif text-4xl sm:text-5xl mt-2 italic">Leaderboard</h1>
        </header>
        <LeaderboardClient />
      </div>
    </div>
  );
}
