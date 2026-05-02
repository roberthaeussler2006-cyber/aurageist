"use client";

import { useEffect, useRef, useState } from "react";

const SCORE_KEY = "kirk-clicker-score";
const UPGRADES_KEY = "kirk-clicker-upgrades";
const FIGURE_SLUG = "Charlie_Kirk";
const MAX_KIRKS_ON_SCREEN = 250;

type Upgrades = {
  power: number;
  auto: number;
};

const UPGRADE_DEFS = [
  { id: "power" as const, label: "Stronger Click", desc: "+1 per click", baseCost: 25, growth: 1.6 },
  { id: "auto" as const, label: "Auto-Clicker", desc: "+1 per second", baseCost: 100, growth: 1.7 },
];

function costFor(base: number, growth: number, owned: number) {
  return Math.floor(base * Math.pow(growth, owned));
}

type Kirk = { id: number; x: number; y: number; rot: number; size: number };

export function KirkClicker() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({ power: 0, auto: 0 });
  const [kirks, setKirks] = useState<Kirk[]>([]);
  const kirkId = useRef(0);

  // Load persistent state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = Number(window.localStorage.getItem(SCORE_KEY) ?? "0");
    if (Number.isFinite(s)) setScore(s);
    try {
      const u = JSON.parse(window.localStorage.getItem(UPGRADES_KEY) ?? "{}");
      setUpgrades({ power: Number(u.power) || 0, auto: Number(u.auto) || 0 });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCORE_KEY, String(score));
  }, [score]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UPGRADES_KEY, JSON.stringify(upgrades));
  }, [upgrades]);

  // Fetch portrait once.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/figure/${FIGURE_SLUG}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j?.figure?.image_url) setImgUrl(j.figure.image_url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-clicker tick.
  useEffect(() => {
    if (upgrades.auto <= 0) return;
    const id = window.setInterval(() => {
      setScore((s) => s + upgrades.auto);
    }, 1000);
    return () => window.clearInterval(id);
  }, [upgrades.auto]);

  // Global click listener — every click anywhere spawns a kirk + score.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Ignore clicks on the upgrades panel itself (so buying doesn't double-count).
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("[data-kirk-ui]")) return;
      const gain = 1 + upgrades.power;
      setScore((s) => s + gain);
      kirkId.current += 1;
      const size = 48 + Math.random() * 40;
      const rot = (Math.random() - 0.5) * 60;
      setKirks((arr) => {
        const next = [...arr, { id: kirkId.current, x: e.clientX, y: e.clientY, rot, size }];
        return next.length > MAX_KIRKS_ON_SCREEN ? next.slice(-MAX_KIRKS_ON_SCREEN) : next;
      });
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [upgrades.power]);

  function buy(id: keyof Upgrades) {
    const def = UPGRADE_DEFS.find((d) => d.id === id)!;
    const cost = costFor(def.baseCost, def.growth, upgrades[id]);
    if (score < cost) return;
    setScore((s) => s - cost);
    setUpgrades((u) => ({ ...u, [id]: u[id] + 1 }));
  }

  return (
    <>
      {/* Spawned kirks — pointer-events none so clicks pass through to underlying UI */}
      <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
        {kirks.map((k) => (
          <span
            key={k.id}
            className="absolute"
            style={{
              left: k.x,
              top: k.y,
              width: k.size,
              height: k.size,
              transform: `translate(-50%, -50%) rotate(${k.rot}deg)`,
              animation: "kirkpop 220ms ease-out",
            }}
          >
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt=""
                draggable={false}
                className="w-full h-full rounded-full object-cover ring-2 ring-white/40 shadow"
              />
            ) : null}
          </span>
        ))}
      </div>

      {/* Score corner — top-left */}
      <div
        data-kirk-ui
        className="fixed top-20 sm:top-24 left-4 sm:left-6 z-[95] pointer-events-none select-none"
      >
        <div className="bg-black/80 text-white rounded-2xl px-4 py-2 shadow-lg backdrop-blur-sm">
          <div className="text-2xl font-extrabold tabular-nums leading-none">
            {score.toLocaleString()}
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/60 mt-0.5">
            kirks
          </div>
        </div>
      </div>

      {/* Upgrades — bottom-right corner, interactive */}
      <div
        data-kirk-ui
        className="fixed bottom-3 right-3 z-[95] grid gap-1.5 w-[200px]"
      >
        {UPGRADE_DEFS.map((def) => {
          const owned = upgrades[def.id];
          const cost = costFor(def.baseCost, def.growth, owned);
          const can = score >= cost;
          return (
            <button
              key={def.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                buy(def.id);
              }}
              disabled={!can}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition border shadow ${
                can
                  ? "bg-white text-black border-white hover:scale-[1.03]"
                  : "bg-black/70 text-white/60 border-white/10 cursor-not-allowed"
              }`}
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {def.label} <span className="opacity-60">×{owned}</span>
                </div>
                <div className="opacity-70 truncate">{def.desc}</div>
              </div>
              <div className="font-mono tabular-nums shrink-0">{cost.toLocaleString()}</div>
            </button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes kirkpop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(0deg) scale(0.3);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </>
  );
}
