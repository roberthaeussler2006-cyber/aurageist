"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

type FigRef = { id: string; name: string; wiki_slug: string; image_url: string | null };
type TopFig = { elo: number; matches: number; wins: number; figure: FigRef & { category: string } };
type RecentMatch = { id: string; created_at: string; winner: FigRef; loser: FigRef };
type MeData = { totalVotes: number; top: TopFig[]; recent: RecentMatch[] };

export default function MePage() {
  const { session, user, loading } = useAuth();
  const [data, setData] = useState<MeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setData(null);
      return;
    }
    const controller = new AbortController();
    setData(null);
    setError(null);
    fetch("/api/me", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        setData((await res.json()) as MeData);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [session, loading]);

  if (!loading && !session) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-2xl font-semibold mb-4">Sign in to see your profile.</p>
          <Link href="/auth" className="btn-gradient inline-block px-6 py-3 text-xs uppercase">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  const username = (user?.user_metadata?.username as string | undefined) ?? user?.email ?? "you";

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">Your profile</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">{username}</span>
          </h1>
        </header>

        {error && <p className="text-center text-[#e11d48]">{error}</p>}
        {!data && !error && <p className="text-center text-muted">loading...</p>}

        {data && (
          <div className="flex flex-col gap-10">
            <section className="text-center bg-panel border border-line rounded-3xl p-8">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">
                Votes cast
              </div>
              <div className="text-5xl sm:text-6xl font-bold tabular-nums text-gradient mt-2">
                {data.totalVotes.toLocaleString()}
              </div>
              <Link
                href="/leaderboard/personal"
                className="mt-4 inline-block text-[11px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-accent transition-colors"
              >
                See full personal ranking →
              </Link>
            </section>

            {data.top.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-4">
                  Your top picks
                </h2>
                <ol className="flex flex-col gap-2">
                  {data.top.map((t, i) => (
                    <li key={t.figure.id}>
                      <Link
                        href={`/figure/${t.figure.wiki_slug}`}
                        className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 transition-all group"
                      >
                        <span className="text-xl font-bold tabular-nums w-8 text-right text-muted">
                          {i + 1}
                        </span>
                        {t.figure.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.figure.image_url}
                            alt={t.figure.name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-line group-hover:ring-accent/40 transition-all shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-line shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate group-hover:text-accent transition-colors">
                            {t.figure.name}
                          </div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                            {t.matches} votes · {t.wins}W / {t.matches - t.wins}L
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold tabular-nums">{Math.round(t.elo)}</div>
                          <div className="text-[9px] uppercase tracking-[0.18em] text-muted">aura</div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {data.recent.length > 0 && (
              <section>
                <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-4">
                  Recent votes
                </h2>
                <ul className="flex flex-col gap-2">
                  {data.recent.map((m) => (
                    <li
                      key={m.id}
                      className="px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line"
                    >
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <Link href={`/figure/${m.winner.wiki_slug}`} className="flex items-center gap-2 min-w-0 group">
                          {m.winner.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.winner.image_url} alt={m.winner.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-accent/60 shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-line shrink-0" />
                          )}
                          <span className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                            {m.winner.name}
                          </span>
                        </Link>
                        <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">
                          beat
                        </span>
                        <Link
                          href={`/figure/${m.loser.wiki_slug}`}
                          className="flex items-center gap-2 min-w-0 group justify-end opacity-70"
                        >
                          <span className="text-sm font-medium truncate text-right line-through decoration-muted group-hover:text-foreground transition-colors">
                            {m.loser.name}
                          </span>
                          {m.loser.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.loser.image_url} alt={m.loser.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-line shrink-0" />
                          ) : (
                            <div className="h-9 w-9 rounded-full bg-line shrink-0" />
                          )}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.totalVotes === 0 && (
              <p className="text-center text-muted">vote on some matchups to fill this in</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
