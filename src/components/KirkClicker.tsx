"use client";

import { useEffect, useRef, useState } from "react";

const SCORE_KEY = "kirk-clicker-score";
const UPGRADES_KEY = "kirk-clicker-upgrades";
const FIGURE_SLUG = "Charlie_Kirk";

type Upgrades = {
  power: number;
  auto: number;
};

const UPGRADE_DEFS = [
  {
    id: "power" as const,
    label: "Stronger Click",
    desc: "+1 per click",
    baseCost: 25,
    growth: 1.6,
  },
  {
    id: "auto" as const,
    label: "Auto-Clicker",
    desc: "+1 per second",
    baseCost: 100,
    growth: 1.7,
  },
];

function costFor(base: number, growth: number, owned: number) {
  return Math.floor(base * Math.pow(growth, owned));
}

type FloatNum = { id: number; x: number; y: number; n: number };

export function KirkClicker() {
  const [open, setOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({ power: 0, auto: 0 });
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [bump, setBump] = useState(0);
  const floatId = useRef(0);

  // Load persistent state once.
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

  // Persist score & upgrades.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SCORE_KEY, String(score));
  }, [score]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UPGRADES_KEY, JSON.stringify(upgrades));
  }, [upgrades]);

  // Fetch portrait when opened.
  useEffect(() => {
    if (!open || imgUrl) return;
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
  }, [open, imgUrl]);

  // Auto-click tick.
  useEffect(() => {
    if (upgrades.auto <= 0) return;
    const id = window.setInterval(() => {
      setScore((s) => s + upgrades.auto);
    }, 1000);
    return () => window.clearInterval(id);
  }, [upgrades.auto]);

  // Garbage-collect old floats.
  useEffect(() => {
    if (floats.length === 0) return;
    const id = window.setTimeout(() => {
      setFloats((arr) => arr.slice(-12));
    }, 900);
    return () => window.clearTimeout(id);
  }, [floats]);

  function click(e: React.MouseEvent<HTMLButtonElement>) {
    const gain = 1 + upgrades.power;
    setScore((s) => s + gain);
    setBump((b) => b + 1);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    floatId.current += 1;
    setFloats((arr) => [...arr, { id: floatId.current, x, y, n: gain }]);
  }

  function buy(id: keyof Upgrades) {
    const def = UPGRADE_DEFS.find((d) => d.id === id)!;
    const cost = costFor(def.baseCost, def.growth, upgrades[id]);
    if (score < cost) return;
    setScore((s) => s - cost);
    setUpgrades((u) => ({ ...u, [id]: u[id] + 1 }));
  }

  if (!open) {
    return (
      <button
        type="button"
        aria-label="open kirk clicker"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-50 h-12 w-12 rounded-full bg-white border border-line shadow-lg hover:scale-110 transition-transform grid place-items-center text-xl font-bold"
        title="Kirk Clicker"
      >
        👆
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="close"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white text-black text-lg font-bold grid place-items-center shadow-lg hover:scale-110 transition"
      >
        ×
      </button>

      <div className="text-white text-center mb-4">
        <div className="text-5xl sm:text-6xl font-extrabold tabular-nums">
          {score.toLocaleString()}
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-white/60 mt-1">kirks</div>
      </div>

      <button
        type="button"
        onClick={click}
        className="relative h-56 w-56 sm:h-72 sm:w-72 rounded-full overflow-hidden ring-4 ring-white/20 shadow-2xl select-none"
        style={{
          transform: `scale(${1 + (bump % 2 === 0 ? 0 : -0.06)})`,
          transition: "transform 80ms ease-out",
        }}
      >
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt="click"
            draggable={false}
            className="h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="h-full w-full bg-white/10 grid place-items-center text-white/60 text-sm">
            loading…
          </div>
        )}
        {floats.map((f) => (
          <span
            key={f.id}
            className="pointer-events-none absolute text-2xl font-bold text-white drop-shadow"
            style={{
              left: f.x,
              top: f.y,
              animation: "kirkfloat 800ms ease-out forwards",
            }}
          >
            +{f.n}
          </span>
        ))}
      </button>

      <div className="mt-6 w-full max-w-md grid gap-2">
        {UPGRADE_DEFS.map((def) => {
          const owned = upgrades[def.id];
          const cost = costFor(def.baseCost, def.growth, owned);
          const can = score >= cost;
          return (
            <button
              key={def.id}
              type="button"
              onClick={() => buy(def.id)}
              disabled={!can}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left transition border ${
                can
                  ? "bg-white text-black border-white hover:scale-[1.02]"
                  : "bg-white/10 text-white/50 border-white/10 cursor-not-allowed"
              }`}
            >
              <div>
                <div className="font-semibold">
                  {def.label} <span className="text-xs opacity-60">×{owned}</span>
                </div>
                <div className="text-xs opacity-70">{def.desc}</div>
              </div>
              <div className="text-sm font-mono tabular-nums">{cost.toLocaleString()}</div>
            </button>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes kirkfloat {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-60px);
          }
        }
      `}</style>
    </div>
  );
}
