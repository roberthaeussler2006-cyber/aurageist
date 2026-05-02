import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const revalidate = 60;

type Row = {
  id: string;
  created_at: string;
  winner: { id: string; name: string; wiki_slug: string; image_url: string | null; elo: number; category: string };
  loser: { id: string; name: string; wiki_slug: string; image_url: string | null; elo: number; category: string };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const limit = clamp(parseInt(url.searchParams.get("limit") ?? "30", 10) || 30, 1, 100);

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, created_at, winner:figures!matches_winner_id_fkey(id, name, wiki_slug, image_url, elo, category), loser:figures!matches_loser_id_fkey(id, name, wiki_slug, image_url, elo, category)",
    )
    .order("created_at", { ascending: false })
    .limit(800);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown as Row[])
    .filter((r) => r.winner && r.loser && r.winner.category === category && r.loser.category === category)
    .map((r) => ({
      id: r.id,
      created_at: r.created_at,
      winner: r.winner,
      loser: r.loser,
      gap: Number(r.loser.elo) - Number(r.winner.elo),
    }))
    .filter((r) => r.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, limit);

  return NextResponse.json(
    { upsets: rows },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
