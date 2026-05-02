import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { parseCategory } from "@/lib/category";

export const revalidate = 30;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = clamp(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1, 200);
  const offset = clamp(parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0, 10_000);
  const sort = url.searchParams.get("sort") ?? "elo";
  const category = parseCategory(url.searchParams.get("cat"));

  const supabase = getServerSupabase();
  let query = supabase.from("figures").select("*").eq("category", category);

  if (sort === "matches") {
    query = query.order("matches", { ascending: false }).order("elo", { ascending: false });
  } else if (sort === "winrate") {
    query = query.gte("matches", 20).order("wins", { ascending: false });
  } else {
    query = query.order("elo", { ascending: false });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { figures: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
