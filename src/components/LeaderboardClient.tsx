"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Category, Figure } from "@/lib/types";
import { formatYears } from "./FigureBlurb";

type Sort = "elo" | "matches" | "winrate";
type Status = "loading" | "ready" | "error";

const TABS: { id: Sort; label: string }[] = [
  { id: "elo", label: "Elo" },
  { id: "matches", label: "Most matches" },
  { id: "winrate", label: "Highest win rate" },
];

export function LeaderboardClient({ category = "historical" }: { category?: Category }) {
  const [sort, setSort] = useState<Sort>("elo");
  const [figures, setFigures] = useState<Figure[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?limit=50&sort=${sort}&cat=${category}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        const j = (await r.json()) as { figures: Figure[] };
        setFigures(j.figures);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
        setStatus("error");
      });
    return () => controller.abort();
  }, [sort, category]);

  function pickSort(next: Sort) {
    if (next === sort) return;
    setStatus("loading");
    setError(null);
    setSort(next);
  }

  return (
    <>
      <div className="flex justify-center gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pickSort(t.id)}
            className={`px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-xs uppercase tracking-[0.18em] font-semibold transition-all ${
              sort === t.id
                ? "bg-gradient text-white shadow-lg"
                : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status === "loading" ? (
        <SkeletonRows />
      ) : status === "error" ? (
        <p className="text-foreground/70 text-center py-12">{error ?? "failed to load"}</p>
      ) : figures.length > 0 ? (
        <ol>
          {figures.map((f, i) => (
            <Row key={f.id} figure={f} rank={i + 1} sort={sort} />
          ))}
        </ol>
      ) : (
        <p className="text-foreground/70 text-center py-12">No figures yet — run the seed script.</p>
      )}
    </>
  );
}

function Row({ figure, rank, sort }: { figure: Figure; rank: number; sort: Sort }) {
  const wins = figure.wins;
  const matches = figure.matches;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const podium = rank <= 3;

  const rankClass = podium
    ? "text-gradient font-bold"
    : "text-muted font-semibold";

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank, 20) * 0.015 }}
    >
      <Link
        href={`/figure/${encodeURIComponent(figure.wiki_slug)}`}
        className="flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 mb-2 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all group"
      >
        <div
          className={`text-2xl sm:text-3xl tabular-nums w-10 sm:w-14 text-right ${rankClass}`}
        >
          {rank}
        </div>

        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full overflow-hidden ring-2 ring-line group-hover:ring-accent/40 transition-all">
          {figure.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={figure.image_url}
              alt={figure.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full bg-panel" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-base sm:text-lg font-semibold truncate group-hover:text-accent transition-colors">
            {figure.name}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.16em] text-muted truncate">
            {formatYears(figure.birth_year, figure.death_year) ?? "dates unknown"}
          </div>
        </div>

        <div className="text-right shrink-0">
          {sort === "winrate" ? (
            <>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{winRate}%</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {wins}/{matches}
              </div>
            </>
          ) : sort === "matches" ? (
            <>
              <div className="text-xl sm:text-2xl font-bold tabular-nums text-foreground">{matches}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {Math.round(Number(figure.elo))} elo
              </div>
            </>
          ) : (
            <>
              <div className={`text-xl sm:text-2xl font-bold tabular-nums ${podium ? "text-gradient" : "text-foreground"}`}>
                {Math.round(Number(figure.elo))}
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {matches} match{matches === 1 ? "" : "es"}
              </div>
            </>
          )}
        </div>
      </Link>
    </motion.li>
  );
}

function SkeletonRows() {
  return (
    <ol>
      {Array.from({ length: 12 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-4 px-3 sm:px-5 py-3 sm:py-4 mb-2 rounded-2xl bg-panel border border-line animate-pulse"
        >
          <div className="w-10 sm:w-14 h-6 bg-line rounded" />
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-line" />
          <div className="flex-1 h-5 bg-line rounded" />
          <div className="w-14 h-6 bg-line rounded" />
        </li>
      ))}
    </ol>
  );
}
