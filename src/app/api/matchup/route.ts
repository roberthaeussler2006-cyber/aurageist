import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";
import { signMatchup } from "@/lib/matchup-token";
import { ensureSessionId } from "@/lib/session";
import { parseCategory } from "@/lib/category";
import { parseTheme } from "@/lib/theme";
import type { Figure, MatchupResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const ELO_BAND = 200;
const A_POOL = 20;

export async function GET(req: Request): Promise<NextResponse<MatchupResponse | { error: string }>> {
  await ensureSessionId();
  const supabase = getServerSupabase();
  const url = new URL(req.url);
  const theme = parseTheme(url.searchParams.get("theme"));
  // When a theme is requested, ignore the category so people can mix eras within
  // a theme (e.g. musicians includes both Mozart and Drake).
  const category = theme ? null : parseCategory(url.searchParams.get("cat"));

  const baseFilter = (q: ReturnType<typeof supabase.from>) => {
    let next = q;
    if (theme) next = next.eq("theme", theme);
    if (category) next = next.eq("category", category);
    return next;
  };

  const poolQ = baseFilter(supabase.from("figures").select("*"))
    .order("matches", { ascending: true })
    .limit(A_POOL);
  const { data: pool, error: poolErr } = await poolQ;
  if (poolErr || !pool || pool.length === 0) {
    return NextResponse.json(
      { error: poolErr?.message ?? "no figures for this filter" },
      { status: 500 },
    );
  }
  const a = pool[Math.floor(Math.random() * pool.length)] as Figure;

  const nearbyQ = baseFilter(supabase.from("figures").select("*"))
    .gte("elo", Number(a.elo) - ELO_BAND)
    .lte("elo", Number(a.elo) + ELO_BAND)
    .neq("id", a.id)
    .limit(50);
  const { data: nearby, error: nearbyErr } = await nearbyQ;
  if (nearbyErr) {
    return NextResponse.json({ error: nearbyErr.message }, { status: 500 });
  }

  let b: Figure | null = null;
  if (nearby && nearby.length > 0) {
    b = nearby[Math.floor(Math.random() * nearby.length)] as Figure;
  } else {
    const { data: anyOther } = await baseFilter(supabase.from("figures").select("*"))
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
