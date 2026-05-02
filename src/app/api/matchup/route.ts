import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { signMatchup } from "@/lib/matchup-token";
import { ensureSessionId } from "@/lib/session";
import { parseCategory } from "@/lib/category";
import type { Figure, MatchupResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const ELO_BAND = 200;
const A_POOL = 20;

export async function GET(req: Request): Promise<NextResponse<MatchupResponse | { error: string }>> {
  await ensureSessionId();
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const category = parseCategory(url.searchParams.get("cat"));

  const { data: pool, error: poolErr } = await supabase
    .from("figures")
    .select("*")
    .eq("category", category)
    .order("matches", { ascending: true })
    .limit(A_POOL);
  if (poolErr || !pool || pool.length === 0) {
    return NextResponse.json({ error: poolErr?.message ?? "no figures" }, { status: 500 });
  }
  const a = pool[Math.floor(Math.random() * pool.length)] as Figure;

  const { data: nearby, error: nearbyErr } = await supabase
    .from("figures")
    .select("*")
    .eq("category", category)
    .gte("elo", Number(a.elo) - ELO_BAND)
    .lte("elo", Number(a.elo) + ELO_BAND)
    .neq("id", a.id)
    .limit(50);
  if (nearbyErr) {
    return NextResponse.json({ error: nearbyErr.message }, { status: 500 });
  }

  let b: Figure | null = null;
  if (nearby && nearby.length > 0) {
    b = nearby[Math.floor(Math.random() * nearby.length)] as Figure;
  } else {
    const { data: anyOther } = await supabase
      .from("figures")
      .select("*")
      .eq("category", category)
      .neq("id", a.id)
      .limit(100);
    if (anyOther && anyOther.length > 0) {
      b = anyOther[Math.floor(Math.random() * anyOther.length)] as Figure;
    }
  }

  if (!b) {
    return NextResponse.json({ error: "could not find a second figure" }, { status: 500 });
  }

  const ts = Date.now();
  const token = signMatchup(a.id, b.id, ts);

  return NextResponse.json(
    { a, b, token, ts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
