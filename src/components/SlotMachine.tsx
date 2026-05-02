"use client";

import { useEffect, useRef, useState } from "react";

type SlotFig = { name: string; image_url: string | null };

const CHARLI: SlotFig = {
  name: "CHARLI",
  image_url: null,
};

const SPIN_MS = 1800;
const TICK_MS = 80;
const STAGGER_MS = 350;

export function SlotMachine() {
  const [open, setOpen] = useState(false);
  const [pool, setPool] = useState<SlotFig[]>([]);
  const [reels, setReels] = useState<SlotFig[]>([CHARLI, CHARLI, CHARLI]);
  const [spinning, setSpinning] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [jackpot, setJackpot] = useState(false);
  const [spins, setSpins] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => {
    fetch("/api/slot", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : { figures: [] }))
      .then((j: { figures: SlotFig[] }) => setPool(j.figures.filter((f) => f.image_url)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  function spin() {
    if (spinning.some(Boolean) || pool.length === 0) return;
    setJackpot(false);
    setSpinning([true, true, true]);
    setSpins((s) => s + 1);

    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    for (let i = 0; i < 3; i++) {
      const interval = setInterval(() => {
        setReels((prev) => {
          const next = [...prev];
          next[i] = pool[Math.floor(Math.random() * pool.length)];
          return next as SlotFig[];
        });
      }, TICK_MS);
      intervalsRef.current.push(interval);

      const stopAt = SPIN_MS + i * STAGGER_MS;
      timersRef.current.push(
        setTimeout(() => {
          clearInterval(interval);
          setReels((prev) => {
            const next = [...prev];
            next[i] = CHARLI;
            return next as SlotFig[];
          });
          setSpinning((prev) => {
            const next = [...prev] as [boolean, boolean, boolean];
            next[i] = false;
            return next;
          });
          if (i === 2) {
            setJackpot(true);
          }
        }, stopAt),
      );
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-amber-400 shadow-lg hover:scale-110 transition-transform grid place-items-center text-3xl"
        aria-label="Open slot machine"
        title="Slot machine"
      >
        🎰
      </button>
    );
  }

  return (
    <div className="fixed top-20 sm:top-24 right-4 sm:right-6 z-50 w-[min(92vw,460px)] rounded-3xl bg-white border border-line shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 px-5 py-3.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🎰</span>
          <span className="text-sm uppercase tracking-[0.2em] font-bold">aura slots</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 w-8 rounded-full hover:bg-white/20 grid place-items-center text-base"
          aria-label="Close slot machine"
        >
          ✕
        </button>
      </div>

      <div className="p-5 sm:p-6 bg-gradient-to-b from-amber-50 to-rose-50">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {reels.map((r, i) => (
            <Reel key={i} fig={r} spinning={spinning[i]} />
          ))}
        </div>

        <div className="text-center min-h-[36px] mb-3">
          {jackpot ? (
            <p className="text-lg font-bold text-gradient animate-pulse">
              ✨ JACKPOT — 3× CHARLI ✨
            </p>
          ) : spinning.some(Boolean) ? (
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted">spinning...</p>
          ) : (
            <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted">pull to spin</p>
          )}
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={spinning.some(Boolean) || pool.length === 0}
          className="w-full px-6 py-3.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white text-sm uppercase tracking-[0.2em] font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
        >
          {spinning.some(Boolean) ? "..." : "spin"}
        </button>

        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.18em] font-semibold text-muted/70">
          spins: {spins} · house wins: 0
        </p>
      </div>
    </div>
  );
}

function Reel({ fig, spinning }: { fig: SlotFig; spinning: boolean }) {
  const isCharli = fig.name === "CHARLI";
  return (
    <div
      className={`aspect-square rounded-2xl overflow-hidden border-2 grid place-items-center transition-all ${
        isCharli && !spinning
          ? "border-amber-400 bg-gradient-to-br from-fuchsia-100 to-amber-100 shadow-[0_0_24px_rgba(244,114,182,0.6)]"
          : "border-line bg-white"
      } ${spinning ? "animate-pulse" : ""}`}
    >
      {isCharli ? (
        <div className="text-center px-1">
          <div className="text-4xl sm:text-5xl">✨</div>
          <div className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-fuchsia-600 to-amber-500 bg-clip-text text-transparent">
            CHARLI
          </div>
        </div>
      ) : fig.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fig.image_url} alt={fig.name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs text-muted">?</span>
      )}
    </div>
  );
}
