import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const token = auth.slice("Bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const supabase = getServerSupabase();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id;
  if (userErr || !userId) {
    return NextResponse.json({ error: "invalid token" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("get_user_streak", { p_user_id: userId });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    current: row?.current_streak ?? 0,
    longest: row?.longest_streak ?? 0,
    lastVoteDate: row?.last_vote_date ?? null,
  });
}
