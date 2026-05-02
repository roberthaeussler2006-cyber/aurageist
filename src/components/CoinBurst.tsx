"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

type Burst = {
  id: string;
  amount: number;
  origin: "left" | "right" | "center";
  multiplier?: number;
};

const COIN_COUNT = 28;

export function CoinBurst({ burst, onDone }: { burst: Burst | null; onDone: () => void }) {
  return (
    <AnimatePresence onExitComplete={onDone}>
      {burst && <Burst key={burst.id} burst={burst} />}
    </AnimatePresence>
  );
}

function Burst({ burst }: { burst: Burst }) {
  const coins = useMemo(
    () =>
      Array.from({ length: COIN_COUNT }, (_, i) => ({
        i,
        x: (Math.random() - 0.5) * 600,
        y: -160 - Math.random() * 240,
        rot: (Math.random() - 0.5) * 720,
        scale: 0.6 + Math.random() * 1.0,
        delay: Math.random() * 0.18,
      })),
    [],
  );
  const originClass =
    burst.origin === "left"
      ? "left-[25%]"
      : burst.origin === "right"
        ? "left-[75%]"
        : "left-1/2";

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Floating big number */}
      <motion.div
        className={`absolute top-[40%] ${originClass} -translate-x-1/2 select-none`}
        initial={{ opacity: 0, y: 20, scale: 0.6 }}
        animate={{ opacity: 1, y: -40, scale: 1 }}
        exit={{ opacity: 0, y: -120, scale: 1.2 }}
        transition={{ duration: 1.6, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="display text-6xl sm:text-8xl text-yellow-400 drop-shadow-[0_4px_24px_rgba(250,204,21,0.6)]">
          +{burst.amount.toLocaleString()}
        </div>
        {burst.multiplier && burst.multiplier > 1.6 && (
          <div className="text-center display-italic text-xl sm:text-3xl text-yellow-300/95 mt-1 drop-shadow-[0_2px_12px_rgba(250,204,21,0.6)]">
            {burst.multiplier.toFixed(2)}× hit
          </div>
        )}
      </motion.div>

      {/* Coins */}
      {coins.map((c) => (
        <motion.div
          key={c.i}
          className={`absolute top-[55%] ${originClass} -translate-x-1/2`}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, c.scale, c.scale, c.scale * 0.7],
            x: c.x,
            y: c.y,
            rotate: c.rot,
          }}
          transition={{
            duration: 1.4,
            delay: c.delay,
            ease: [0.2, 0.7, 0.3, 1],
            times: [0, 0.15, 0.7, 1],
          }}
        >
          <Coin />
        </motion.div>
      ))}
    </motion.div>
  );
}

function Coin() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 8px rgba(180, 130, 0, 0.45))" }}
    >
      <defs>
        <linearGradient id="coin-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff7c2" />
          <stop offset="40%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="coin-r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#coin-g)" stroke="#7c2d12" strokeWidth="1.2" />
      <circle cx="20" cy="20" r="13" fill="none" stroke="url(#coin-r)" strokeWidth="1.5" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontWeight="700"
        fontSize="16"
        fill="#7c2d12"
      >
        A
      </text>
    </svg>
  );
}

export type { Burst };
