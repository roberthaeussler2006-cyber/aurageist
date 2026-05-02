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

  // Defence-in-depth: in addition to token signing, verify both figures share
  // a category. The matchup endpoint only ever pairs figures within the same
  // category, but this stops any future bug or replayed token from leaking
  // votes across the historical/current divide.
  const { data: figs, error: figErr } = await supabase
    .from("figures")
    .select("id, category")
    .in("id", [body.winnerId, body.loserId]);
  if (figErr) {
    return NextResponse.json({ error: figErr.message }, { status: 500 });
  }
  if (!figs || figs.length !== 2) {
    return NextResponse.json({ error: "figure not found" }, { status: 400 });
  }
  if (figs[0].category !== figs[1].category) {
    return NextResponse.json({ error: "figures must share a category" }, { status: 400 });
  }

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

  let personalWinnerNewElo: number | null = null;
  let personalLoserNewElo: number | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const { data: userData } = await supabase.auth.getUser(token);
      const userId = userData?.user?.id;
      if (userId) {
        const { data: pData, error: pErr } = await supabase.rpc("record_personal_vote", {
          p_user_id: userId,
          p_winner_id: body.winnerId,
          p_loser_id: body.loserId,
        });
        if (!pErr) {
          const pRow = Array.isArray(pData) ? pData[0] : pData;
          if (pRow) {
            personalWinnerNewElo = Number(pRow.winner_new_elo);
            personalLoserNewElo = Number(pRow.loser_new_elo);
          }
        }
      }
    }
  }

  return NextResponse.json({
    winnerNewElo: Number(row.winner_new_elo),
    loserNewElo: Number(row.loser_new_elo),
    personalWinnerNewElo,
    personalLoserNewElo,
  });
}
