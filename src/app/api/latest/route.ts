import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const limit = clamp(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1, 200);

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, created_at, winner:figures!matches_winner_id_fkey(id, name, wiki_slug, image_url, category), loser:figures!matches_loser_id_fkey(id, name, wiki_slug, image_url, category)",
    )
    .order("created_at", { ascending: false })
    .limit(limit * 4);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = { id: string; created_at: string; winner: { category: string } | null; loser: { category: string } | null };
  const rows = ((data ?? []) as unknown as Row[])
    .filter((m) => m.winner && m.loser && m.winner.category === category && m.loser.category === category)
    .slice(0, limit);

  return NextResponse.json({ matches: rows });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
