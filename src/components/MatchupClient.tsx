"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Figure, MatchupResponse, VoteResponse } from "@/lib/types";
import { FigureBlurb, formatYears } from "./FigureBlurb";

type VoteResult = {
  winnerId: string;
  loserId: string;
  winnerDelta: number;
  loserDelta: number;
};

type Status = "loading" | "ready" | "error";

export function MatchupClient({ category = "historical" }: { category?: Category }) {
  const [matchup, setMatchup] = useState<MatchupResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/matchup?cat=${category}`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as MatchupResponse;
        setMatchup(json);
        setVoteResult(null);
        setSubmitting(false);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load matchup");
        setStatus("error");
      });
    return () => controller.abort();
  }, [reloadKey, category]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const reload = useCallback(() => {
    setStatus("loading");
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  const skip = useCallback(() => {
    if (submitting || status !== "ready") return;
    setVoteResult(null);
    setStatus("loading");
    setReloadKey((k) => k + 1);
  }, [submitting, status]);

  const submitVote = useCallback(
    (winner: Figure, loser: Figure) => {
      if (!matchup || submitting) return;
      setSubmitting(true);
      fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId: winner.id,
          loserId: loser.id,
          token: matchup.token,
          ts: matchup.ts,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body?.error ?? `vote failed (${res.status})`);
          }
          const json = (await res.json()) as VoteResponse;
          const winnerDelta = json.winnerNewElo - Number(winner.elo);
          const loserDelta = json.loserNewElo - Number(loser.elo);
          setVoteResult({ winnerId: winner.id, loserId: loser.id, winnerDelta, loserDelta });
          advanceTimer.current = setTimeout(() => {
            setStatus("loading");
            setReloadKey((k) => k + 1);
          }, 1200);
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "vote failed");
          setSubmitting(false);
        });
    },
    [matchup, submitting],
  );

  useEffect(() => {
    if (!matchup || submitting) return;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        submitVote(matchup!.a, matchup!.b);
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        submitVote(matchup!.b, matchup!.a);
      } else if (ev.key === " " || ev.key.toLowerCase() === "s") {
        ev.preventDefault();
        skip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [matchup, submitting, submitVote, skip]);

  const otherCategory = category === "current" ? "historical" : "current";
  const otherHref = category === "current" ? "/" : "/current";
  const subtitle = category === "current" ? "Current figures" : "Historical figures";

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 pb-10 pt-2">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted mb-6 sm:mb-8 flex items-center gap-3">
        <span className="text-accent">{subtitle}</span>
        <span className="text-muted/40">·</span>
        <Link href={otherHref} className="hover:text-accent transition-colors">
          try {otherCategory} →
        </Link>
      </div>

      <div className="w-full max-w-6xl flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {status === "loading" ? (
            <SkeletonPair key="skeleton" />
          ) : status === "error" ? (
            <ErrorBlock key="error" message={error ?? "unknown error"} onRetry={reload} />
          ) : matchup ? (
            <motion.div
              key={matchup.token}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="flex-1 flex flex-col"
            >
              <PairLayout
                a={matchup.a}
                b={matchup.b}
                onVote={submitVote}
                onSkip={skip}
                disabled={submitting}
                voteResult={voteResult}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted/70 hidden sm:block">
        ← left · right → · space to skip
      </div>
    </div>
  );
}

function PairLayout({
  a,
  b,
  onVote,
  onSkip,
  disabled,
  voteResult,
}: {
  a: Figure;
  b: Figure;
  onVote: (winner: Figure, loser: Figure) => void;
  onSkip: () => void;
  disabled: boolean;
  voteResult: VoteResult | null;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10 items-stretch">
      <FigureChoice
        figure={a}
        onClick={() => onVote(a, b)}
        disabled={disabled}
        delta={
          voteResult?.winnerId === a.id
            ? voteResult.winnerDelta
            : voteResult?.loserId === a.id
              ? voteResult.loserDelta
              : null
        }
        won={voteResult?.winnerId === a.id}
        lost={voteResult?.loserId === a.id}
        side="left"
      />

      <div className="flex md:flex-col items-center justify-center gap-3 md:gap-4 py-2 md:py-0">
        <span className="hidden md:block h-20 w-px bg-line" />
        <div className="text-center">
          <div className="serif text-2xl md:text-3xl italic text-foreground/90">who has more</div>
          <div className="serif text-3xl md:text-5xl italic divider-vs mt-1">aura</div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted mt-2">tap to vote</div>
        </div>
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="px-4 py-2 border border-line text-[10px] uppercase tracking-[0.25em] text-muted hover:text-accent hover:border-accent/50 transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          I don&apos;t know
        </button>
        <span className="hidden md:block h-20 w-px bg-line" />
      </div>

      <FigureChoice
        figure={b}
        onClick={() => onVote(b, a)}
        disabled={disabled}
        delta={
          voteResult?.winnerId === b.id
            ? voteResult.winnerDelta
            : voteResult?.loserId === b.id
              ? voteResult.loserDelta
              : null
        }
        won={voteResult?.winnerId === b.id}
        lost={voteResult?.loserId === b.id}
        side="right"
      />
    </div>
  );
}

function FigureChoice({
  figure,
  onClick,
  disabled,
  delta,
  won,
  lost,
  side,
}: {
  figure: Figure;
  onClick: () => void;
  disabled: boolean;
  delta: number | null;
  won: boolean;
  lost: boolean;
  side: "left" | "right";
}) {
  return (
    <button
      type="button"
      aria-label={`Vote ${figure.name} as having more aura`}
      onClick={onClick}
      disabled={disabled}
      className={`group relative text-left bg-panel/40 rounded-[2px] border border-line transition-all duration-300 overflow-hidden ${
        disabled ? "cursor-default" : "cursor-pointer hover:border-accent/40 active:scale-[0.99]"
      } ${won ? "ring-2 ring-accent/80" : ""} ${lost ? "opacity-50" : ""}`}
    >
      <div className="portrait-vignette aspect-[3/4] sm:aspect-[4/5] w-full">
        <span className="portrait-glow" />
        {figure.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={figure.image_url}
            alt={figure.name}
            className="h-full w-full object-cover"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="h-full w-full grid place-items-center bg-[#1a1815] text-muted text-xs uppercase tracking-widest">
            no portrait
          </div>
        )}
      </div>

      <div className="relative z-10 px-4 sm:px-5 py-4 -mt-12">
        <h2 className="serif text-2xl sm:text-3xl leading-tight text-foreground drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
          {figure.name}
        </h2>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted mt-1">
          {formatYears(figure.birth_year, figure.death_year) ?? "—"}
        </div>
        <FigureBlurb text={figure.short_blurb} />
      </div>

      <AnimatePresence>
        {delta !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className={`absolute top-3 ${side === "left" ? "left-3" : "right-3"} z-20`}
          >
            <span
              className={`serif text-3xl sm:text-4xl italic ${
                delta >= 0 ? "text-accent" : "text-foreground/50"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {Math.round(delta)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function SkeletonPair() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-10"
    >
      <div className="aspect-[3/4] sm:aspect-[4/5] bg-panel/60 rounded-[2px] border border-line animate-pulse" />
      <div className="hidden md:flex items-center justify-center serif italic divider-vs text-3xl">
        ...
      </div>
      <div className="aspect-[3/4] sm:aspect-[4/5] bg-panel/60 rounded-[2px] border border-line animate-pulse" />
    </motion.div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4 py-16"
    >
      <p className="text-foreground/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 border border-accent/60 text-accent uppercase tracking-[0.2em] text-xs hover:bg-accent/10"
      >
        Try again
      </button>
    </motion.div>
  );
}
