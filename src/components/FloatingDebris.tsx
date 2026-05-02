"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

const EMOJI = [
  "🪙", "💰", "💎", "✨", "🔥", "👑", "⭐", "💸", "🎰", "🍀",
  "♠️", "♥️", "♣️", "♦️", "🤑", "🤯", "🚀", "⚡", "🌈", "🎉",
  "🎊", "🍾", "🍒", "🍋", "🍇", "🎯", "🎲", "💫", "🌟", "🦄",
  "💜", "💖", "🪩", "🎁", "🍕", "🍩", "🦖", "🐉", "🛸", "👽",
  "🥂", "🍷", "🤡", "👻", "💀", "🌹", "🪐", "☀️", "🌙", "⛓️",
];

const BUTTERFLY_COLORS = [
  ["#ff7854", "#ffd166"],
  ["#ff3d8b", "#ffb4d8"],
  ["#b14bff", "#ffd6ff"],
  ["#4ec1ff", "#a0f0ff"],
  ["#facc15", "#fff7c2"],
  ["#22d3ee", "#a7f3d0"],
  ["#ef4444", "#fca5a5"],
  ["#a855f7", "#e9d5ff"],
];

const COUNT = 90;
const BUTTERFLY_RATIO = 0.35;

type Drop = {
  id: number;
  kind: "emoji" | "butterfly";
  glyph: string;
  colorA: string;
  colorB: string;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  rotate: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
  flapMs: number;
};

function makeDrop(id: number): Drop {
  const startEdge = Math.floor(Math.random() * 4);
  let startX = Math.random() * 100;
  let startY = Math.random() * 100;
  switch (startEdge) {
    case 0: startY = -10; startX = Math.random() * 110 - 5; break;
    case 1: startX = 110; startY = Math.random() * 110 - 5; break;
    case 2: startY = 110; startX = Math.random() * 110 - 5; break;
    case 3: startX = -10; startY = Math.random() * 110 - 5; break;
  }
  const driftX = startX < 50 ? 50 + Math.random() * 80 : -(50 + Math.random() * 80);
  const driftY = startY < 50 ? 40 + Math.random() * 80 : -(40 + Math.random() * 80);
  const isButterfly = Math.random() < BUTTERFLY_RATIO;
  const palette = BUTTERFLY_COLORS[Math.floor(Math.random() * BUTTERFLY_COLORS.length)];
  return {
    id,
    kind: isButterfly ? "butterfly" : "emoji",
    glyph: EMOJI[Math.floor(Math.random() * EMOJI.length)],
    colorA: palette[0],
    colorB: palette[1],
    startX,
    startY,
    driftX,
    driftY,
    rotate: (Math.random() - 0.5) * 720,
    duration: 14 + Math.random() * 26,
    delay: Math.random() * 18,
    size: isButterfly ? 26 + Math.random() * 32 : 16 + Math.random() * 36,
    opacity: 0.3 + Math.random() * 0.5,
    flapMs: 240 + Math.random() * 320,
  };
}

export function FloatingDebris() {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);
    const t = setInterval(() => setSeed((s) => s + 1), 45_000);
    return () => {
      mq.removeEventListener?.("change", onChange);
      clearInterval(t);
    };
  }, []);

  const drops = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => makeDrop(i + seed * COUNT)),
    [seed],
  );

  if (!mounted || reduce) return null;

  return (
    <div className="floating-debris pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {drops.map((d) => (
        <motion.span
          key={d.id}
          className="absolute select-none will-change-transform"
          style={{
            left: `${d.startX}vw`,
            top: `${d.startY}vh`,
            fontSize: `${d.size}px`,
          }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.4, opacity: 0 }}
          animate={{
            x: [`0vw`, `${d.driftX * 0.3}vw`, `${d.driftX * 0.7}vw`, `${d.driftX}vw`],
            y: [`0vh`, `${d.driftY * 0.4 + (Math.random() - 0.5) * 8}vh`, `${d.driftY * 0.7 - (Math.random() - 0.5) * 8}vh`, `${d.driftY}vh`],
            rotate: [0, d.rotate * 0.3, d.rotate * 0.7, d.rotate],
            scale: [0.4, 1, 1.05, 0.9],
            opacity: [0, d.opacity, d.opacity, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            ease: "linear",
            times: [0, 0.25, 0.75, 1],
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          {d.kind === "butterfly" ? (
            <Butterfly size={d.size} colorA={d.colorA} colorB={d.colorB} flapMs={d.flapMs} />
          ) : (
            <span style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.18))" }}>{d.glyph}</span>
          )}
        </motion.span>
      ))}
    </div>
  );
}

function Butterfly({ size, colorA, colorB, flapMs }: { size: number; colorA: string; colorB: string; flapMs: number }) {
  return (
    <span
      className="butterfly inline-block"
      style={{
        width: size,
        height: size,
        // The CSS keyframe pulls from --flap-ms.
        ["--flap-ms" as string]: `${flapMs}ms`,
      } as React.CSSProperties}
    >
      <svg viewBox="-50 -50 100 100" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={`wg-${colorA}-${colorB}`} cx="0.3" cy="0.3" r="0.9">
            <stop offset="0%" stopColor={colorB} />
            <stop offset="100%" stopColor={colorA} />
          </radialGradient>
        </defs>
        {/* Body */}
        <ellipse cx="0" cy="0" rx="2.4" ry="22" fill="#1f1f1f" />
        <circle cx="0" cy="-22" r="3.2" fill="#1f1f1f" />
        <line x1="0" y1="-24" x2="-7" y2="-34" stroke="#1f1f1f" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="0" y1="-24" x2="7" y2="-34" stroke="#1f1f1f" strokeWidth="1.2" strokeLinecap="round" />
        {/* Left wing */}
        <g className="bf-wing bf-wing-l" style={{ transformOrigin: "0 0" }}>
          <path
            d="M0,-18 C-30,-44 -50,-30 -42,-2 C-46,18 -22,28 -8,16 C-4,8 -2,0 0,-4 Z"
            fill={`url(#wg-${colorA}-${colorB})`}
            stroke={colorA}
            strokeWidth="1"
            opacity="0.95"
          />
          <circle cx="-30" cy="-18" r="3" fill={colorA} opacity="0.6" />
          <circle cx="-22" cy="6" r="2" fill={colorA} opacity="0.6" />
        </g>
        {/* Right wing */}
        <g className="bf-wing bf-wing-r" style={{ transformOrigin: "0 0" }}>
          <path
            d="M0,-18 C30,-44 50,-30 42,-2 C46,18 22,28 8,16 C4,8 2,0 0,-4 Z"
            fill={`url(#wg-${colorA}-${colorB})`}
            stroke={colorA}
            strokeWidth="1"
            opacity="0.95"
          />
          <circle cx="30" cy="-18" r="3" fill={colorA} opacity="0.6" />
          <circle cx="22" cy="6" r="2" fill={colorA} opacity="0.6" />
        </g>
      </svg>
    </span>
  );
}
