"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import type { Category } from "@/lib/types";

type Row = {
  elo: number;
  matches: number;
  wins: number;
  figure: {
    id: string;
    name: string;
    wiki_slug: string;
    image_url: string | null;
    birth_year: number | null;
    death_year: number | null;
    short_blurb: string | null;
    category: Category;
  };
};

export default function PersonalLeaderboardPage() {
  const { session, user, loading } = useAuth();
  const [category, setCategory] = useState<Category>("historical");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    if (!session) {
      // Defer the empty-state setRows to a microtask so it doesn't fire
      // synchronously inside the effect body (lint: react-hooks/set-state-in-effect).
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) setRows([]);
      });
      return () => controller.abort();
    }
    fetch(`/api/leaderboard/personal?cat=${category}&limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { rows: Row[] };
        setRows(json.rows);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [session, loading, category]);

  if (!loading && !session) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-2xl font-semibold mb-4">Sign in to see your personal aura ranking.</p>
          <Link href="/auth" className="btn-gradient inline-block px-6 py-3 text-xs uppercase">
            Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">Your taste</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Personal</span> Ranking
          </h1>
          {user && (
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">
              {(user.user_metadata?.username as string | undefined) ?? user.email}
            </div>
          )}
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
        {!rows && !error && <p className="text-center text-muted">loading...</p>}
        {rows && rows.length === 0 && (
          <p className="text-center text-muted">vote on some matchups to build your ranking</p>
        )}
        {rows && rows.length > 0 && (
          <ol>
            {rows.map((r, i) => {
              const podium = i < 3;
              return (
                <li key={r.figure.id}>
                  <Link
                    href={`/figure/${r.figure.wiki_slug}`}
                    className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 mb-2 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all group"
                  >
                    <span
                      className={`text-2xl sm:text-3xl tabular-nums w-10 sm:w-14 text-right ${
                        podium ? "text-gradient font-bold" : "text-muted font-semibold"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {r.figure.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.figure.image_url}
                        alt={r.figure.name}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-line group-hover:ring-accent/40 transition-all shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-line shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base sm:text-lg truncate group-hover:text-accent transition-colors">
                        {r.figure.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                        {r.matches} {r.matches === 1 ? "vote" : "votes"} · {r.wins}W / {r.matches - r.wins}L
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl sm:text-2xl font-bold tabular-nums ${podium ? "text-gradient" : "text-foreground"}`}>
                        {Math.round(r.elo)}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">aura</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
