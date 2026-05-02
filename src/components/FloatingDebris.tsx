"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

const ITEMS = [
  "🪙",
  "💰",
  "💎",
  "✨",
  "🔥",
  "👑",
  "⭐",
  "💸",
  "🎰",
  "🍀",
  "♠️",
  "♥️",
  "♣️",
  "♦️",
];

const COUNT = 14;

type Drop = {
  id: number;
  glyph: string;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  rotate: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
};

function makeDrop(id: number): Drop {
  const startEdge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  let startX = Math.random() * 100;
  let startY = Math.random() * 100;
  switch (startEdge) {
    case 0: startY = -10; startX = Math.random() * 110 - 5; break;
    case 1: startX = 110; startY = Math.random() * 110 - 5; break;
    case 2: startY = 110; startX = Math.random() * 110 - 5; break;
    case 3: startX = -10; startY = Math.random() * 110 - 5; break;
  }
  // Drift across to the rough opposite side, with some jitter.
  const driftX = startX < 50 ? 40 + Math.random() * 60 : -(40 + Math.random() * 60);
  const driftY = startY < 50 ? 30 + Math.random() * 60 : -(30 + Math.random() * 60);
  return {
    id,
    glyph: ITEMS[Math.floor(Math.random() * ITEMS.length)],
    startX,
    startY,
    driftX,
    driftY,
    rotate: (Math.random() - 0.5) * 540,
    duration: 18 + Math.random() * 22,
    delay: Math.random() * 12,
    size: 18 + Math.random() * 28,
    opacity: 0.35 + Math.random() * 0.4,
  };
}

export function FloatingDebris() {
  const [mounted, setMounted] = useState(false);
  const [reduce, setReduce] = useState(false);
  // Re-roll periodically so the cast of items rotates across a session.
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener?.("change", onChange);
    const t = setInterval(() => setSeed((s) => s + 1), 60_000);
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
            opacity: d.opacity,
          }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0.6 }}
          animate={{
            x: [`0vw`, `${d.driftX}vw`],
            y: [`0vh`, `${d.driftY}vh`],
            rotate: [0, d.rotate],
            scale: [0.6, 1, 0.9],
            opacity: [0, d.opacity, d.opacity, 0],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            ease: "linear",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          {d.glyph}
        </motion.span>
      ))}
    </div>
  );
}
