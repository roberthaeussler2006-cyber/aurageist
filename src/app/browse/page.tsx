"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

type Fig = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  birth_year: number | null;
  death_year: number | null;
  elo: number;
  matches: number;
};

type SortKey = "name" | "elo" | "matches";

export default function BrowsePage() {
  const [category, setCategory] = useState<Category>("historical");
  const [sort, setSort] = useState<SortKey>("name");
  const [q, setQ] = useState("");
  const [figs, setFigs] = useState<Fig[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setFigs(null);
    setError(null);
    fetch(`/api/browse?cat=${category}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { figures: Fig[] };
        setFigs(json.figures);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [category]);

  const filtered = useMemo(() => {
    if (!figs) return [];
    const needle = q.trim().toLowerCase();
    let arr = needle ? figs.filter((f) => f.name.toLowerCase().includes(needle)) : figs;
    arr = [...arr];
    if (sort === "elo") arr.sort((a, b) => Number(b.elo) - Number(a.elo));
    else if (sort === "matches") arr.sort((a, b) => b.matches - a.matches);
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [figs, q, sort]);

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <span className="pill">All figures</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Browse</span>
          </h1>
        </header>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
          <input
            type="search"
            placeholder="Search by name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="bg-panel border border-line rounded-full px-5 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 transition-all flex-1"
          />
          <div className="flex gap-2 items-center">
            {(["historical", "current"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                  category === c
                    ? "bg-gradient text-white shadow"
                    : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
            <span className="w-px h-5 bg-line mx-1" />
            {(["name", "elo", "matches"] as SortKey[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                  sort === s
                    ? "bg-foreground text-background"
                    : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-center text-[#e11d48]">{error}</p>}
        {!figs && !error && <p className="text-center text-muted">loading...</p>}
        {figs && filtered.length === 0 && (
          <p className="text-center text-muted">no figures match</p>
        )}

        {figs && filtered.length > 0 && (
          <>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted text-center mb-4">
              {filtered.length} {filtered.length === 1 ? "figure" : "figures"}
            </p>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/figure/${f.wiki_slug}`}
                    className="group block rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="aspect-square overflow-hidden">
                      {f.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.image_url}
                          alt={f.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-line" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm truncate group-hover:text-accent transition-colors">
                        {f.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted tabular-nums mt-0.5">
                        {Math.round(f.elo)} · {f.matches}v
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
