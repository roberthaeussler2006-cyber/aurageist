import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  const url = new URL(req.url);
  const limit = clamp(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 1, 500);
  const category = parseCategory(url.searchParams.get("cat"));

  const { data, error } = await supabase
    .from("personal_elo")
    .select("elo, matches, wins, figure:figures!inner(id, name, wiki_slug, image_url, birth_year, death_year, short_blurb, category)")
    .eq("user_id", userId)
    .eq("figure.category", category)
    .order("elo", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
