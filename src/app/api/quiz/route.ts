import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const supabase = getServerSupabase();

  const { count } = await supabase
    .from("figures")
    .select("id", { count: "exact", head: true })
    .eq("category", category)
    .gte("matches", 5);

  const total = count ?? 0;
  if (total < 4) {
    return NextResponse.json({ error: "not enough figures" }, { status: 400 });
  }

  const picked = new Set<number>();
  while (picked.size < 4) picked.add(Math.floor(Math.random() * total));
  const offsets = [...picked].sort((a, b) => a - b);

  const results = await Promise.all(
    offsets.map((offset) =>
      supabase
        .from("figures")
        .select("id, name, wiki_slug, image_url, birth_year, death_year, elo, short_blurb")
        .eq("category", category)
        .gte("matches", 5)
        .order("name", { ascending: true })
        .range(offset, offset)
        .limit(1)
        .single(),
    ),
  );

  const figures = results
    .map((r) => r.data)
    .filter((d): d is NonNullable<typeof d> => d != null);

  if (figures.length < 4) {
    return NextResponse.json({ error: "could not load figures" }, { status: 500 });
  }

  for (let i = figures.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [figures[i], figures[j]] = [figures[j], figures[i]];
  }

  return NextResponse.json({ figures });
}
