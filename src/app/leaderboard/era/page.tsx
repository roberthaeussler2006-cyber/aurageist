"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ERAS, type Era } from "@/lib/era";

type Fig = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  birth_year: number | null;
  death_year: number | null;
  short_blurb: string | null;
  elo: number;
  matches: number;
  wins: number;
};

export default function EraLeaderboardPage() {
  const [era, setEra] = useState<Era>("modern");
  const [rows, setRows] = useState<Fig[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setRows(null);
    setError(null);
    fetch(`/api/leaderboard/era?era=${era}&limit=100`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { figures: Fig[] };
        setRows(json.figures);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [era]);

  const def = ERAS.find((e) => e.id === era)!;

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <span className="pill">By era</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">{def.label}</span> Leaderboard
          </h1>
          <p className="mt-3 text-sm text-foreground/60">
            Born between {fmtYear(def.from)} and {fmtYear(def.to)}.
          </p>
        </header>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {ERAS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEra(e.id)}
              className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                era === e.id
                  ? "bg-gradient text-white shadow-lg"
                  : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        {error && <p className="text-center text-[#e11d48]">{error}</p>}
        {!rows && !error && <p className="text-center text-muted">loading...</p>}
        {rows && rows.length === 0 && (
          <p className="text-center text-muted">no figures in this era yet</p>
        )}

        {rows && rows.length > 0 && (
          <ol className="flex flex-col gap-2">
            {rows.map((f, i) => {
              const podium = i < 3;
              return (
                <li key={f.id}>
                  <Link
                    href={`/figure/${f.wiki_slug}`}
                    className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all group"
                  >
                    <span
                      className={`text-2xl sm:text-3xl tabular-nums w-10 sm:w-14 text-right ${
                        podium ? "text-gradient font-bold" : "text-muted font-semibold"
                      }`}
                    >
                      {i + 1}
                    </span>
                    {f.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.image_url}
                        alt={f.name}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-line group-hover:ring-accent/40 transition-all shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-line shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base sm:text-lg truncate group-hover:text-accent transition-colors">
                        {f.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                        {fmtYear(f.birth_year)}{f.death_year != null ? `–${fmtYear(f.death_year)}` : ""}
                        {" · "}
                        {f.matches} votes
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-xl sm:text-2xl font-bold tabular-nums ${podium ? "text-gradient" : "text-foreground"}`}>
                        {Math.round(f.elo)}
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

function fmtYear(y: number | null | undefined): string {
  if (y == null) return "?";
  return y < 0 ? `${-y} BC` : String(y);
}
