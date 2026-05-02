"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Category, Figure, MatchupResponse, VoteResponse } from "@/lib/types";
import { FigureBlurb, formatYears } from "./FigureBlurb";
import { formatMoney, moneyBarPct } from "@/lib/money";
import { SocialLink } from "./SocialLink";
import { useAuth } from "./AuthProvider";
import { Comments } from "./Comments";

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
  const { session } = useAuth();

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
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      fetch("/api/vote", {
        method: "POST",
        headers,
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
    [matchup, submitting, session],
  );

  useEffect(() => {
    if (!matchup || submitting) return;
    function onKey(ev: KeyboardEvent) {
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
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
    <div className="flex-1 flex flex-col items-center justify-start px-3 sm:px-6 pb-10 pt-4 sm:pt-6">
      <div className="w-full max-w-6xl text-center mb-6 sm:mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="pill">{subtitle}</span>
          <Link href={otherHref} className="btn-ghost">
            try {otherCategory} →
          </Link>
        </div>
        <h1 className="display text-[clamp(2.75rem,9vw,7rem)]">
          who has more <span className="display-italic text-gradient">aura</span>?
        </h1>
        <p className="mt-3 text-sm sm:text-base text-foreground/60 max-w-md mx-auto">
          Tap a portrait. Trust your gut. The Elo updates in real time.
        </p>
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
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

      <div className="mt-8 text-[10px] uppercase tracking-[0.25em] font-bold text-foreground/40 hidden sm:flex items-center gap-3">
        <kbd className="px-2 py-1 rounded-md bg-white/60 border border-white/70 backdrop-blur text-[9px]">←</kbd> pick left
        <span className="text-foreground/20">·</span>
        <kbd className="px-2 py-1 rounded-md bg-white/60 border border-white/70 backdrop-blur text-[9px]">→</kbd> pick right
        <span className="text-foreground/20">·</span>
        <kbd className="px-2 py-1 rounded-md bg-white/60 border border-white/70 backdrop-blur text-[9px]">space</kbd> skip
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
    <div className="relative grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-12 items-stretch">
      <div className="md:tilt-left flex flex-col">
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
        <Comments figureId={a.id} compact />
      </div>

      <div className="flex md:flex-col items-center justify-center gap-4 py-2 md:py-0 z-10">
        <div className="hidden md:flex flex-col items-center">
          <span className="display-italic text-7xl divider-vs leading-none">vs</span>
        </div>
        <div className="md:hidden display-italic text-5xl divider-vs">vs</div>
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="btn-ghost"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 4l8 8-8 8M13 4l8 8-8 8" />
          </svg>
          Skip
        </button>
        <Link
          href={`/vs/${encodeURIComponent(a.wiki_slug)}/${encodeURIComponent(b.wiki_slug)}`}
          className="btn-ghost"
        >
          Share
        </Link>
      </div>

      <div className="md:tilt-right flex flex-col">
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
        <Comments figureId={b.id} compact />
      </div>
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
  const wonStyle = won
    ? { borderColor: "var(--accent)", boxShadow: "0 0 0 6px var(--accent-soft), 0 60px 140px -30px var(--accent-glow), 0 1px 0 rgba(255,255,255,0.6) inset" }
    : undefined;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Vote ${figure.name} as having more aura`}
        onClick={onClick}
        disabled={disabled}
        className={`glass-card group relative text-left overflow-hidden w-full ${
          disabled ? "cursor-default" : "cursor-pointer active:scale-[0.985]"
        } ${lost ? "opacity-45 saturate-50" : ""}`}
        style={wonStyle}
      >
        <div className="portrait-frame aspect-[3/4] sm:aspect-[4/5] w-full">
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
            <div className="h-full w-full grid place-items-center bg-white/40 text-muted text-xs uppercase tracking-widest">
              no portrait
            </div>
          )}
          <div className={`absolute bottom-3 ${side === "left" ? "left-3" : "right-3"} z-20`}>
            <span className="pill-dark backdrop-blur-md bg-black/55">
              {side === "left" ? "← Left" : "Right →"}
            </span>
          </div>
        </div>

        <div className="px-5 sm:px-7 py-5 sm:py-6">
          <h2 className="display-italic text-3xl sm:text-4xl leading-tight text-foreground">
            {figure.name}
          </h2>
          <div className="text-[11px] uppercase tracking-[0.16em] font-bold text-muted mt-1.5">
            {formatYears(figure.birth_year, figure.death_year) ?? "dates unknown"}
          </div>
          <FigureBlurb text={figure.short_blurb} />
          {figure.category === "current" && (
            <CardRanks
              fame={figure.fame_rank}
              controversy={figure.controversy_rank}
              netWorth={figure.net_worth_usd}
            />
          )}
        </div>

        <AnimatePresence>
          {delta !== null && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.6, rotate: -6 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.55, type: "spring", stiffness: 240, damping: 16 }}
              className={`absolute top-4 ${side === "left" ? "left-4" : "right-4"} z-30`}
            >
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-lg sm:text-2xl font-extrabold tabular-nums shadow-2xl ${
                  delta >= 0
                    ? "bg-gradient text-white"
                    : "bg-black/85 text-white"
                }`}
              >
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <SocialLink
        url={figure.social_url}
        kind={figure.social_kind}
        name={figure.name}
        corner={side === "left" ? "top-right" : "top-left"}
      />
    </div>
  );
}

function CardRanks({
  fame,
  controversy,
  netWorth,
}: {
  fame: number | null;
  controversy: number | null;
  netWorth: number | null;
}) {
  if (fame == null && controversy == null && netWorth == null) return null;
  const items: {
    label: string;
    display: string;
    pct: number;
    tone: string;
  }[] = [
    {
      label: "Famous",
      display: fame == null ? "—" : `${fame}`,
      pct: fame == null ? 0 : Math.max(0, Math.min(100, fame)),
      tone: "from-fuchsia-500 to-rose-500",
    },
    {
      label: "Controversial",
      display: controversy == null ? "—" : `${controversy}`,
      pct: controversy == null ? 0 : Math.max(0, Math.min(100, controversy)),
      tone: "from-amber-500 to-red-600",
    },
    {
      label: "Net worth",
      display: formatMoney(netWorth),
      pct: moneyBarPct(netWorth),
      tone: "from-emerald-500 to-teal-600",
    },
  ];
  return (
    <div className="mt-4 space-y-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted">
              {i.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-foreground/85">
              {i.display}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-line/60 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${i.tone} rounded-full`}
              style={{ width: `${i.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonPair() {
  return (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-12"
    >
      <div className="md:tilt-left">
        <div className="glass-card aspect-[3/4] sm:aspect-[4/5] animate-pulse overflow-hidden">
          <div className="portrait-frame h-full w-full bg-white/40" />
        </div>
      </div>
      <div className="hidden md:flex items-center justify-center display-italic divider-vs text-7xl">
        vs
      </div>
      <div className="md:tilt-right">
        <div className="glass-card aspect-[3/4] sm:aspect-[4/5] animate-pulse overflow-hidden">
          <div className="portrait-frame h-full w-full bg-white/40" />
        </div>
      </div>
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
      <p className="text-foreground/70">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="btn-gradient px-6 py-3 text-xs uppercase"
      >
        Try again
      </button>
    </motion.div>
  );
}
