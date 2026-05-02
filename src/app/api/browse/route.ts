import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const revalidate = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("figures")
    .select("id, name, wiki_slug, image_url, birth_year, death_year, elo, matches")
    .eq("category", category)
    .order("name", { ascending: true })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { figures: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
