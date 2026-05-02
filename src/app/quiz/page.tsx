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
  short_blurb: string | null;
};

const BEST_KEY = "aurageist-quiz-best";

export default function QuizPage() {
  const [category, setCategory] = useState<Category>("historical");
  const [figs, setFigs] = useState<Fig[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const v = Number(window.localStorage.getItem(BEST_KEY));
    if (Number.isFinite(v)) setBest(v);
  }, []);

  const load = useCallback(() => {
    setFigs(null);
    setError(null);
    setPicked(null);
    fetch(`/api/quiz?cat=${category}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { figures: Fig[] };
        setFigs(json.figures);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "failed"));
  }, [category]);

  useEffect(() => {
    setScore(0);
    setStreak(0);
    setRound(0);
    load();
  }, [category, load]);

  const correctId = figs ? [...figs].sort((a, b) => Number(b.elo) - Number(a.elo))[0].id : null;
  const isCorrect = picked != null && picked === correctId;

  const onPick = (id: string) => {
    if (picked || !figs) return;
    setPicked(id);
    if (id === correctId) {
      const nextStreak = streak + 1;
      const gained = 100 + nextStreak * 25;
      setScore((s) => s + gained);
      setStreak(nextStreak);
      const nextBest = Math.max(best, nextStreak);
      if (nextBest > best) {
        setBest(nextBest);
        try { window.localStorage.setItem(BEST_KEY, String(nextBest)); } catch {}
      }
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setRound((r) => r + 1);
    load();
  };

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <span className="pill">Game</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            Highest <span className="text-gradient">aura</span>?
          </h1>
          <p className="mt-3 text-sm text-foreground/60 max-w-md mx-auto">
            Pick the figure with the highest Elo. Streak bonuses stack.
          </p>
        </header>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
          <div className="flex gap-2">
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
          </div>
          <span className="w-px h-5 bg-line" />
          <Stat label="Score" value={score.toLocaleString()} />
          <Stat label="Streak" value={String(streak)} highlight={streak > 0} />
          <Stat label="Best" value={String(best)} />
        </div>

        {error && (
          <div className="text-center">
            <p className="text-[#e11d48] mb-3">{error}</p>
            <button onClick={load} className="btn-gradient inline-block px-5 py-2 text-xs uppercase">
              try again
            </button>
          </div>
        )}

        {!figs && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-panel border border-line animate-pulse" />
            ))}
          </div>
        )}

        {figs && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {figs.map((f) => {
                const isPicked = picked === f.id;
                const isThisCorrect = picked != null && f.id === correctId;
                const dim = picked != null && !isPicked && !isThisCorrect;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onPick(f.id)}
                    disabled={picked != null}
                    className={`group relative text-left rounded-2xl bg-panel border overflow-hidden transition-all ${
                      isThisCorrect
                        ? "border-accent ring-4 ring-accent/30 shadow-lg"
                        : isPicked
                          ? "border-[#e11d48] ring-4 ring-[#e11d48]/20"
                          : "border-line hover:border-accent/40"
                    } ${dim ? "opacity-50" : ""} ${picked == null ? "cursor-pointer hover:shadow-md" : "cursor-default"}`}
                  >
                    <div className="aspect-[3/4] overflow-hidden">
                      {f.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.image_url}
                          alt={f.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="eager"
                        />
                      ) : (
                        <div className="h-full w-full bg-line" />
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm sm:text-base truncate">{f.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted mt-0.5 tabular-nums h-3">
                        {picked != null ? `${Math.round(Number(f.elo))} aura` : ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {picked != null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center mt-8"
                >
                  <p className={`text-2xl font-bold ${isCorrect ? "text-gradient" : "text-foreground/60"}`}>
                    {isCorrect ? `correct +${100 + streak * 25}` : "nope"}
                  </p>
                  <button
                    type="button"
                    onClick={next}
                    className="btn-gradient mt-4 inline-block px-6 py-3 text-xs uppercase"
                  >
                    next round →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <div className="mt-12 text-center text-[10px] uppercase tracking-[0.2em] font-semibold text-muted/70">
          round {round + 1}
          <span className="mx-2">·</span>
          <Link href="/" className="hover:text-accent transition-colors">
            back to voting
          </Link>
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
