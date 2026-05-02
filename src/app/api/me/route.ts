import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = getServerSupabase();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  const [{ count: totalVotes }, topRes, recentRes] = await Promise.all([
    supabase.from("personal_matches").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("personal_elo")
      .select("elo, matches, wins, figure:figures!inner(id, name, wiki_slug, image_url, category)")
      .eq("user_id", userId)
      .order("elo", { ascending: false })
      .limit(5),
    supabase
      .from("personal_matches")
      .select("id, created_at, winner:figures!personal_matches_winner_id_fkey(id, name, wiki_slug, image_url), loser:figures!personal_matches_loser_id_fkey(id, name, wiki_slug, image_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    totalVotes: totalVotes ?? 0,
    top: topRes.data ?? [],
    recent: recentRes.data ?? [],
  });
}
