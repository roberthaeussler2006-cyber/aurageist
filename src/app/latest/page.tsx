"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

type FigRef = { id: string; name: string; wiki_slug: string; image_url: string | null };
type Match = { id: string; created_at: string; winner: FigRef; loser: FigRef };

export default function LatestPage() {
  const [category, setCategory] = useState<Category>("historical");
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setMatches(null);
    setError(null);

    function load() {
      fetch(`/api/latest?cat=${category}&limit=50`, { cache: "no-store", signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) {
            const b = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(b?.error ?? `failed (${res.status})`);
          }
          const json = (await res.json()) as { matches: Match[] };
          if (!cancelled) setMatches(json.matches);
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted || cancelled) return;
          setError(e instanceof Error ? e.message : "failed to load");
        });
    }

    load();
    const interval = setInterval(load, 8000);
    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [category]);

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <span className="pill">Live</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Latest</span> votes
          </h1>
          <p className="mt-3 text-sm text-foreground/60">
            Updates every 8 seconds.
          </p>
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
        {!matches && !error && <p className="text-center text-muted">loading...</p>}
        {matches && matches.length === 0 && (
          <p className="text-center text-muted">no votes yet</p>
        )}

        {matches && matches.length > 0 && (
          <ul className="flex flex-col gap-2">
            {matches.map((m) => (
              <li
                key={m.id}
                className="px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 transition-all"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <Link href={`/figure/${m.winner.wiki_slug}`} className="flex items-center gap-2 min-w-0 group">
                    {m.winner.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.winner.image_url} alt={m.winner.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-accent/60 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-line shrink-0" />
                    )}
                    <span className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                      {m.winner.name}
                    </span>
                  </Link>
                  <div className="text-center shrink-0">
                    <div className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">
                      beat
                    </div>
                    <div className="text-[9px] text-muted mt-0.5 tabular-nums">
                      {timeAgo(m.created_at)}
                    </div>
                  </div>
                  <Link
                    href={`/figure/${m.loser.wiki_slug}`}
                    className="flex items-center gap-2 min-w-0 group justify-end opacity-70"
                  >
                    <span className="text-sm font-medium truncate text-right line-through decoration-muted group-hover:text-foreground transition-colors">
                      {m.loser.name}
                    </span>
                    {m.loser.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.loser.image_url} alt={m.loser.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-line shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-line shrink-0" />
                    )}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
