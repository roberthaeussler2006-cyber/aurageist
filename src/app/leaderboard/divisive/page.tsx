import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  category: string;
  theme: string | null;
  elo: number;
  matches: number;
  wins: number;
  win_rate: number;
  distance_from_even: number;
};

async function loadTop(): Promise<Row[]> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("divisive_figures")
    .select("*")
    .order("distance_from_even", { ascending: true })
    .order("matches", { ascending: false })
    .limit(50);
  return (data as Row[]) ?? [];
}

export default async function DivisivePage() {
  const rows = await loadTop();

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">The 50/50 figures</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Most divisive</span>
          </h1>
          <p className="mt-3 text-sm text-muted max-w-md mx-auto">
            People genuinely can&apos;t decide. Win rates closest to 50% — minimum 3 matches.
          </p>
          <div className="mt-4 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted flex items-center justify-center gap-3">
            <Link href="/leaderboard" className="hover:text-accent transition-colors">
              ← historical
            </Link>
            <span className="text-muted/40">·</span>
            <Link href="/leaderboard/discussed" className="hover:text-accent transition-colors">
              most discussed →
            </Link>
          </div>
        </header>

        {rows.length === 0 ? (
          <p className="text-center text-muted text-sm">
            Not enough matches yet — every figure needs at least 3 votes.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => {
              const pct = Math.round(r.win_rate * 100);
              const distance = Math.round(r.distance_from_even * 200); // 0–100 scale
              return (
                <li key={r.id}>
                  <Link
                    href={`/figure/${encodeURIComponent(r.wiki_slug)}`}
                    className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all"
                  >
                    <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted w-8 text-right tabular-nums">
                      #{i + 1}
                    </span>
                    <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-line shrink-0">
                      {r.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-line" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
                        {r.theme ?? r.category} · {r.matches} matches
                      </div>
                    </div>
                    <div className="text-right min-w-[88px]">
                      <div className="text-2xl font-bold text-gradient tabular-nums">
                        {pct}%
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted">
                        {distance === 0 ? "perfect 50/50" : `${distance}pt off`}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
