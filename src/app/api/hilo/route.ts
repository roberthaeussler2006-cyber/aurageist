import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));
  const exclude = url.searchParams.getAll("not");

  const supabase = getServerSupabase();
  const { count } = await supabase
    .from("figures")
    .select("id", { count: "exact", head: true })
    .eq("category", category)
    .gte("matches", 5);

  const total = count ?? 0;
  if (total === 0) {
    return NextResponse.json({ error: "no figures" }, { status: 400 });
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const offset = Math.floor(Math.random() * total);
    const { data } = await supabase
      .from("figures")
      .select("id, name, wiki_slug, image_url, birth_year, death_year, elo")
      .eq("category", category)
      .gte("matches", 5)
      .order("name", { ascending: true })
      .range(offset, offset)
      .single();
    if (data && !exclude.includes(data.id)) {
      return NextResponse.json({ figure: data });
    }
  }

  return NextResponse.json({ error: "could not pick figure" }, { status: 500 });
}
