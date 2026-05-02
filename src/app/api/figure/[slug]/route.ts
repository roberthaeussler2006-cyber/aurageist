import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import type { Figure, RecentMatch } from "@/lib/types";

export const revalidate = 15;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getServerSupabase();

  const { data: figure, error: figErr } = await supabase
    .from("figures")
    .select("*")
    .eq("wiki_slug", slug)
    .maybeSingle();

  if (figErr) return NextResponse.json({ error: figErr.message }, { status: 500 });
  if (!figure) return NextResponse.json({ error: "not found" }, { status: 404 });

  const f = figure as Figure;

  const { count: rankCount } = await supabase
    .from("figures")
    .select("id", { count: "exact", head: true })
    .gt("elo", Number(f.elo));
  const rank = (rankCount ?? 0) + 1;

  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select("id, winner_id, loser_id, created_at")
    .or(`winner_id.eq.${f.id},loser_id.eq.${f.id}`)
    .order("created_at", { ascending: false })
    .limit(10);
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 });

  const opponentIds = new Set<string>();
  for (const m of matches ?? []) {
    opponentIds.add(m.winner_id === f.id ? m.loser_id : m.winner_id);
  }

  const opponents = new Map<string, { id: string; name: string; wiki_slug: string; image_url: string | null }>();
  if (opponentIds.size > 0) {
    const { data: opps } = await supabase
      .from("figures")
      .select("id, name, wiki_slug, image_url")
      .in("id", Array.from(opponentIds));
    for (const o of opps ?? []) opponents.set(o.id, o);
  }

  const recent: RecentMatch[] = (matches ?? []).map((m) => {
    const oppId = m.winner_id === f.id ? m.loser_id : m.winner_id;
    const opp = opponents.get(oppId);
    return {
      id: m.id,
      created_at: m.created_at,
      outcome: m.winner_id === f.id ? "win" : "loss",
      opponent: opp ?? { id: oppId, name: "Unknown", wiki_slug: "", image_url: null },
    };
  });

  return NextResponse.json(
    { figure: f, rank, recent },
    { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=60" } },
  );
}
