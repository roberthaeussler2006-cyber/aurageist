"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

type FigRef = { id: string; name: string; wiki_slug: string; image_url: string | null };
type MostVoted = FigRef & { matches: number; wins: number };
type Controversial = {
  a: FigRef;
  b: FigRef;
  aWins: number;
  bWins: number;
  total: number;
  balance: number;
};
type Stats = {
  totalVotes: number;
  mostVoted: MostVoted[];
  controversial: Controversial[];
};

export default function StatsPage() {
  const [category, setCategory] = useState<Category>("historical");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStats(null);
    setError(null);
    fetch(`/api/stats?cat=${category}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        setStats((await res.json()) as Stats);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [category]);

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">By the numbers</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Stats</span>
          </h1>
          <div className="mt-5 inline-flex gap-2">
            {(["historical", "current"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                  category === c
                    ? "bg-gradient text-white shadow-lg"
                    : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        {error && <p className="text-center text-[#e11d48]">{error}</p>}
        {!stats && !error && <p className="text-center text-muted">loading...</p>}

        {stats && (
          <div className="flex flex-col gap-10">
            <section className="text-center bg-panel border border-line rounded-3xl p-8">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">
                Total votes cast
              </div>
              <div className="text-5xl sm:text-6xl font-bold tabular-nums text-gradient mt-2">
                {stats.totalVotes.toLocaleString()}
              </div>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-4">
                Most voted on
              </h2>
              <ol className="flex flex-col gap-2">
                {stats.mostVoted.map((f, i) => (
                  <li key={f.id}>
                    <Link
                      href={`/figure/${f.wiki_slug}`}
                      className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 transition-all group"
                    >
                      <span className="text-xl sm:text-2xl font-bold tabular-nums w-8 text-right text-muted">
                        {i + 1}
                      </span>
                      {f.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.image_url}
                          alt={f.name}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-line group-hover:ring-accent/40 transition-all shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-line shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate group-hover:text-accent transition-colors">
                          {f.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                          {f.matches} votes · {Math.round((f.wins / Math.max(f.matches, 1)) * 100)}% win rate
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-4">
                Most controversial pairs
                <span className="ml-2 normal-case tracking-normal font-normal text-foreground/40">
                  (closest to 50/50)
                </span>
              </h2>
              {stats.controversial.length === 0 ? (
                <p className="text-muted text-sm">not enough head-to-head matchups yet</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stats.controversial.map((p) => {
                    const aPct = Math.round((p.aWins / p.total) * 100);
                    const bPct = 100 - aPct;
                    return (
                      <li key={`${p.a.id}:${p.b.id}`}>
                        <Link
                          href={`/vs/${encodeURIComponent(p.a.wiki_slug)}/${encodeURIComponent(p.b.wiki_slug)}`}
                          className="block px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 transition-all group"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {p.a.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.a.image_url} alt={p.a.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-line shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-line shrink-0" />
                              )}
                              <span className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
                                {p.a.name}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted shrink-0">
                              {p.total} votes
                            </span>
                            <div className="flex items-center gap-2 min-w-0 justify-end">
                              <span className="font-semibold text-sm truncate text-right group-hover:text-accent transition-colors">
                                {p.b.name}
                              </span>
                              {p.b.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.b.image_url} alt={p.b.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-line shrink-0" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-line shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-line">
                            <div className="bg-gradient" style={{ width: `${aPct}%` }} />
                            <div className="bg-foreground/30" style={{ width: `${bPct}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] uppercase tracking-[0.16em] font-semibold text-muted mt-1.5 tabular-nums">
                            <span>{aPct}%</span>
                            <span>{bPct}%</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
