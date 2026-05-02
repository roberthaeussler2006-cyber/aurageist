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
    if (!session) {
      setRows([]);
      return;
    }
    setRows(null);
    setError(null);
    fetch(`/api/leaderboard/personal?cat=${category}&limit=200`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { rows: Row[] };
        setRows(json.rows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "failed to load"));
  }, [session, loading, category]);

  if (!loading && !session) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <p className="serif text-2xl italic mb-3">sign in to see your personal aura ranking</p>
          <Link href="/auth" className="text-accent uppercase text-xs tracking-[0.25em]">
            sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted">Your taste</div>
          <h1 className="serif text-4xl sm:text-5xl mt-2 italic">Personal Ranking</h1>
          {user?.email && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted">{user.email}</div>
          )}
          <div className="mt-4 inline-flex border border-line text-[10px] uppercase tracking-[0.25em]">
            {(["historical", "current"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 ${category === c ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        {error && <p className="text-center text-red-400">{error}</p>}
        {!rows && !error && <p className="text-center text-muted">loading...</p>}
        {rows && rows.length === 0 && (
          <p className="text-center text-muted">vote on some matchups to build your ranking</p>
        )}
        {rows && rows.length > 0 && (
          <ol className="flex flex-col">
            {rows.map((r, i) => (
              <li
                key={r.figure.id}
                className="flex items-center gap-4 py-3 border-b border-line/60"
              >
                <span className="serif text-2xl italic text-muted w-8 text-right">{i + 1}</span>
                {r.figure.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.figure.image_url}
                    alt={r.figure.name}
                    className="h-12 w-12 object-cover rounded-[2px] border border-line"
                  />
                ) : (
                  <div className="h-12 w-12 bg-panel/60 border border-line" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/figure/${r.figure.wiki_slug}`}
                    className="serif text-lg hover:text-accent transition-colors truncate block"
                  >
                    {r.figure.name}
                  </Link>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {r.matches} {r.matches === 1 ? "vote" : "votes"} · {r.wins}W / {r.matches - r.wins}L
                  </div>
                </div>
                <div className="text-right">
                  <div className="serif text-xl">{Math.round(r.elo)}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-muted">aura</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
