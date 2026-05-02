"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Figure } from "@/lib/types";
import { formatYears } from "./FigureBlurb";

type Sort = "elo" | "matches" | "winrate";
type Status = "loading" | "ready" | "error";

const TABS: { id: Sort; label: string }[] = [
  { id: "elo", label: "Elo" },
  { id: "matches", label: "Most matches" },
  { id: "winrate", label: "Highest win rate" },
];

export function LeaderboardClient() {
  const [sort, setSort] = useState<Sort>("elo");
  const [figures, setFigures] = useState<Figure[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/leaderboard?limit=50&sort=${sort}`, { signal: controller.signal })
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
  }, [sort]);

  function pickSort(next: Sort) {
    if (next === sort) return;
    setStatus("loading");
    setError(null);
    setSort(next);
  }

  return (
    <>
      <div className="flex justify-center gap-1 mb-8 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pickSort(t.id)}
            className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-colors ${
              sort === t.id
                ? "text-accent border-b border-accent -mb-px"
                : "text-muted hover:text-foreground"
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
        <ol className="space-y-1">
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

  const rankClass =
    rank === 1
      ? "text-accent"
      : rank === 2
        ? "text-[#c9c5b8]"
        : rank === 3
          ? "text-[#b08658]"
          : "text-muted";

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(rank, 20) * 0.015 }}
    >
      <Link
        href={`/figure/${encodeURIComponent(figure.wiki_slug)}`}
        className="flex items-center gap-3 sm:gap-5 px-2 sm:px-4 py-3 border-b border-line hover:bg-panel/50 transition-colors group"
      >
        <div
          className={`serif italic text-2xl sm:text-3xl tabular-nums w-10 sm:w-14 text-right ${rankClass} ${
            podium ? "font-semibold" : ""
          }`}
        >
          {rank}
        </div>

        <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full overflow-hidden border border-line">
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
          <div className="serif text-base sm:text-lg truncate group-hover:text-accent transition-colors">
            {figure.name}
          </div>
          <div className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted truncate">
            {formatYears(figure.birth_year, figure.death_year) ?? "dates unknown"}
          </div>
        </div>

        <div className="text-right shrink-0">
          {sort === "winrate" ? (
            <>
              <div className="serif text-xl sm:text-2xl tabular-nums text-foreground">{winRate}%</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {wins}/{matches}
              </div>
            </>
          ) : sort === "matches" ? (
            <>
              <div className="serif text-xl sm:text-2xl tabular-nums text-foreground">{matches}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {Math.round(Number(figure.elo))} elo
              </div>
            </>
          ) : (
            <>
              <div className="serif text-xl sm:text-2xl tabular-nums text-foreground">
                {Math.round(Number(figure.elo))}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted">
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
    <ol className="space-y-1">
      {Array.from({ length: 12 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-4 px-2 py-3 border-b border-line animate-pulse"
        >
          <div className="w-10 h-6 bg-panel/60 rounded" />
          <div className="h-12 w-12 rounded-full bg-panel/60" />
          <div className="flex-1 h-5 bg-panel/60 rounded" />
          <div className="w-12 h-6 bg-panel/60 rounded" />
        </li>
      ))}
    </ol>
  );
}
