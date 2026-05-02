import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { ERAS, parseEra } from "@/lib/era";

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const era = parseEra(url.searchParams.get("era"));
  const limit = clamp(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 1, 200);
  const def = ERAS.find((e) => e.id === era)!;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("figures")
    .select("id, name, wiki_slug, image_url, birth_year, death_year, short_blurb, elo, matches, wins, category")
    .eq("category", "historical")
    .gte("birth_year", def.from)
    .lte("birth_year", def.to)
    .order("elo", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { era, figures: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
