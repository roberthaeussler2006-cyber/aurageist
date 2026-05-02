import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const revalidate = 60;

type FigRef = { id: string; name: string; wiki_slug: string; image_url: string | null; category: string };
type PairKey = string;
type Pair = { a: FigRef; b: FigRef; aWins: number; bWins: number; total: number; balance: number };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const supabase = getServerSupabase();

  const [{ count: totalVotes }, mostVotedRes, recentMatchesRes] = await Promise.all([
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase
      .from("figures")
      .select("id, name, wiki_slug, image_url, matches, wins")
      .eq("category", category)
      .order("matches", { ascending: false })
      .limit(5),
    supabase
      .from("matches")
      .select("winner_id, loser_id, winner:figures!matches_winner_id_fkey(id, name, wiki_slug, image_url, category), loser:figures!matches_loser_id_fkey(id, name, wiki_slug, image_url, category)")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const pairCounts = new Map<PairKey, Pair>();
  type RawMatch = { winner_id: string; loser_id: string; winner: FigRef | null; loser: FigRef | null };
  for (const m of (recentMatchesRes.data ?? []) as unknown as RawMatch[]) {
    if (!m.winner || !m.loser) continue;
    if (m.winner.category !== category || m.loser.category !== category) continue;
    const [first, second] = [m.winner, m.loser].sort((x, y) => x.id.localeCompare(y.id));
    const key = `${first.id}:${second.id}`;
    const winnerIsFirst = m.winner.id === first.id;
    let p = pairCounts.get(key);
    if (!p) {
      p = { a: first, b: second, aWins: 0, bWins: 0, total: 0, balance: 0 };
      pairCounts.set(key, p);
    }
    if (winnerIsFirst) p.aWins += 1;
    else p.bWins += 1;
    p.total += 1;
  }
  for (const p of pairCounts.values()) {
    p.balance = Math.abs(p.aWins - p.bWins) / p.total;
  }
  const controversial = [...pairCounts.values()]
    .filter((p) => p.total >= 4)
    .sort((a, b) => a.balance - b.balance || b.total - a.total)
    .slice(0, 8);

  return NextResponse.json(
    {
      totalVotes: totalVotes ?? 0,
      mostVoted: mostVotedRes.data ?? [],
      controversial,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
