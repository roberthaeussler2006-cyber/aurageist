// In-memory IP rate limiter. Fine for a single-instance deploy at small scale;
// swap to Redis/Upstash if we ever run multiple instances or care about
// surviving restarts.

type Bucket = { times: number[]; hourCount: number; hourStart: number };

const buckets = new Map<string, Bucket>();

const SECOND_WINDOW_MS = 1000;
const HOUR_WINDOW_MS = 60 * 60 * 1000;

export function checkRateLimit(ip: string, perSecond = 3, perHour = 200): { ok: true } | { ok: false; reason: string } {
  const now = Date.now();
  const b = buckets.get(ip) ?? { times: [], hourCount: 0, hourStart: now };

  b.times = b.times.filter((t) => now - t < SECOND_WINDOW_MS);
  if (b.times.length >= perSecond) {
    return { ok: false, reason: "too many votes per second" };
  }

  if (now - b.hourStart > HOUR_WINDOW_MS) {
    b.hourStart = now;
    b.hourCount = 0;
  }
  if (b.hourCount >= perHour) {
    return { ok: false, reason: "too many votes per hour" };
  }

  b.times.push(now);
  b.hourCount += 1;
  buckets.set(ip, b);
  return { ok: true };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
