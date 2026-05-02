import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { verifyMatchup } from "@/lib/matchup-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ensureSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

const Body = z.object({
  winnerId: z.string().uuid(),
  loserId: z.string().uuid(),
  token: z.string().min(1),
  ts: z.number(),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json({ error: limit.reason }, { status: 429 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (body.winnerId === body.loserId) {
    return NextResponse.json({ error: "winner and loser must differ" }, { status: 400 });
  }

  if (!verifyMatchup(body.winnerId, body.loserId, body.ts, body.token)) {
    return NextResponse.json({ error: "invalid or expired matchup token" }, { status: 400 });
  }

  const sessionId = await ensureSessionId();
  const supabase = getServerSupabase();

  const { data, error } = await supabase.rpc("record_vote", {
    p_winner_id: body.winnerId,
    p_loser_id: body.loserId,
    p_session_id: sessionId,
    p_client_ip: ip,
    p_matchup_token: body.token,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return NextResponse.json({ error: "vote recorded but no result returned" }, { status: 500 });
  }

  return NextResponse.json({
    winnerNewElo: Number(row.winner_new_elo),
    loserNewElo: Number(row.loser_new_elo),
  });
}
