import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 5 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.MATCHUP_SECRET;
  if (!secret) throw new Error("MATCHUP_SECRET is not set");
  return secret;
}

// Tokens are commutative: signing (a, b) and (b, a) yields the same token, so
// a vote payload can name either figure as winner without re-signing.
function canonicalPair(idA: string, idB: string): string {
  return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
}

export function signMatchup(idA: string, idB: string, ts: number): string {
  const payload = `${canonicalPair(idA, idB)}:${ts}`;
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function verifyMatchup(idA: string, idB: string, ts: number, token: string): boolean {
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts) > TOKEN_TTL_MS) return false;
  const expected = signMatchup(idA, idB, ts);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(token, "hex");
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
