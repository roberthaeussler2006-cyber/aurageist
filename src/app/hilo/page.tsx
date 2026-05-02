"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { Category } from "@/lib/types";

type Fig = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  birth_year: number | null;
  death_year: number | null;
  elo: number;
};

const BEST_KEY = "aurageist-hilo-best";

type Phase = "loading" | "ready" | "reveal" | "gameover";

export default function HiloPage() {
  const [category, setCategory] = useState<Category>("historical");
  const [left, setLeft] = useState<Fig | null>(null);
  const [right, setRight] = useState<Fig | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastGuess, setLastGuess] = useState<"higher" | "lower" | null>(null);

  useEffect(() => {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    if (Number.isFinite(v)) setBest(v);
  }, []);

  const fetchFig = useCallback(
    async (exclude: string[]): Promise<Fig | null> => {
      const params = new URLSearchParams({ cat: category });
      for (const id of exclude) params.append("not", id);
      const res = await fetch(`/api/hilo?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b?.error ?? "failed");
      }
      const json = (await res.json()) as { figure: Fig };
      return json.figure;
    },
    [category],
  );

  const reset = useCallback(async () => {
    setPhase("loading");
    setError(null);
    setStreak(0);
    setLastGuess(null);
    try {
      const a = await fetchFig([]);
      if (!a) throw new Error("no figure");
      const b = await fetchFig([a.id]);
      if (!b) throw new Error("no figure");
      setLeft(a);
      setRight(b);
      setPhase("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    }
  }, [fetchFig]);

  useEffect(() => {
    reset();
  }, [reset]);

  const guess = useCallback(
    (dir: "higher" | "lower") => {
      if (!left || !right || phase !== "ready") return;
      const correct =
        (dir === "higher" && Number(right.elo) >= Number(left.elo)) ||
        (dir === "lower" && Number(right.elo) <= Number(left.elo));
      setLastGuess(dir);
      setPhase("reveal");

      setTimeout(async () => {
        if (correct) {
          const next = streak + 1;
          setStreak(next);
          if (next > best) {
            setBest(next);
            try { window.localStorage.setItem(BEST_KEY, String(next)); } catch {}
          }
          try {
            const newRight = await fetchFig([right.id]);
            if (!newRight) throw new Error("no figure");
            setLeft(right);
            setRight(newRight);
            setLastGuess(null);
            setPhase("ready");
          } catch (e) {
            setError(e instanceof Error ? e.message : "failed");
          }
        } else {
          setPhase("gameover");
        }
      }, 1400);
    },
    [left, right, phase, streak, best, fetchFig],
  );

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <span className="pill">Game</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            Higher or <span className="text-gradient">lower</span>?
          </h1>
          <p className="mt-3 text-sm text-foreground/60 max-w-md mx-auto">
            Does the right figure have higher or lower aura than the left?
          </p>
        </header>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
          <div className="flex gap-2">
            {(["historical", "current"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                }}
                className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                  category === c
                    ? "bg-gradient text-white shadow"
                    : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <span className="w-px h-5 bg-line" />
          <Stat label="Streak" value={String(streak)} highlight={streak > 0} />
          <Stat label="Best" value={String(best)} />
        </div>

        {error && (
          <div className="text-center">
            <p className="text-[#e11d48] mb-3">{error}</p>
            <button onClick={reset} className="btn-gradient inline-block px-5 py-2 text-xs uppercase">
              try again
            </button>
          </div>
        )}

        {(phase === "ready" || phase === "reveal" || phase === "gameover") && left && right && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 items-stretch">
            <Card figure={left} reveal showElo />
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={right.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card figure={right} reveal={phase !== "ready"} showElo={phase !== "ready"} />
                </motion.div>
              </AnimatePresence>
              {phase === "ready" && (
                <div className="absolute inset-x-0 -bottom-4 sm:-bottom-6 flex justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => guess("higher")}
                    className="btn-gradient px-5 sm:px-7 py-3 text-xs uppercase"
                  >
                    ↑ Higher
                  </button>
                  <button
                    type="button"
                    onClick={() => guess("lower")}
                    className="px-5 sm:px-7 py-3 text-xs uppercase rounded-full bg-foreground text-background hover:bg-foreground/85 transition-all font-bold"
                  >
                    ↓ Lower
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <AnimatePresence>
          {phase === "reveal" && lastGuess && left && right && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mt-12"
            >
              <p className="text-2xl font-bold">
                {(lastGuess === "higher" && Number(right.elo) >= Number(left.elo)) ||
                (lastGuess === "lower" && Number(right.elo) <= Number(left.elo))
                  ? <span className="text-gradient">correct</span>
                  : <span className="text-foreground/60">wrong</span>}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "gameover" && (
          <div className="text-center mt-12">
            <p className="text-3xl font-bold mb-2">
              Final streak: <span className="text-gradient">{streak}</span>
            </p>
            <p className="text-sm text-muted mb-5">
              {streak >= best && streak > 0 ? "new best!" : `best is ${best}`}
            </p>
            <button onClick={reset} className="btn-gradient inline-block px-6 py-3 text-xs uppercase">
              play again
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-[10px] uppercase tracking-[0.2em] font-semibold text-muted/70">
          <Link href="/quiz" className="hover:text-accent transition-colors">
            try the quiz →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ figure, reveal, showElo }: { figure: Fig; reveal: boolean; showElo: boolean }) {
  return (
    <div className="rounded-2xl bg-panel border border-line overflow-hidden shadow-[var(--shadow)]">
      <div className="aspect-[3/4] overflow-hidden">
        {figure.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={figure.image_url} alt={figure.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-line" />
        )}
      </div>
      <div className="p-4 text-center">
        <div className="font-bold text-lg sm:text-xl">{figure.name}</div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-muted mt-1">
          {fmtYear(figure.birth_year)}{figure.death_year != null ? `–${fmtYear(figure.death_year)}` : ""}
        </div>
        <div className={`mt-2 text-2xl sm:text-3xl font-bold tabular-nums transition-opacity ${showElo ? "text-gradient opacity-100" : "opacity-0"}`}>
          {reveal ? Math.round(Number(figure.elo)) : "???"}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-xl font-bold tabular-nums ${highlight ? "text-gradient" : ""}`}>
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted">
        {label}
      </div>
    </div>
  );
}

function fmtYear(y: number | null | undefined): string {
  if (y == null) return "?";
  return y < 0 ? `${-y} BC` : String(y);
}
