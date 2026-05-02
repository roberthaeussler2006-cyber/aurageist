"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useWallet } from "./WalletProvider";

export function CoinBalance() {
  const { balance } = useWallet();
  const prev = useRef(balance);
  const [pulse, setPulse] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (balance === prev.current) return;
    setPulse(balance > prev.current ? "up" : "down");
    prev.current = balance;
    const t = setTimeout(() => setPulse(null), 700);
    return () => clearTimeout(t);
  }, [balance]);

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-50 border transition-colors ${
        pulse === "up"
          ? "border-amber-400 shadow-[0_0_0_3px_rgba(250,204,21,0.35)]"
          : pulse === "down"
            ? "border-rose-300"
            : "border-amber-200"
      }`}
      title={`${balance.toLocaleString()} aura coins`}
    >
      <svg width="16" height="16" viewBox="0 0 40 40" fill="none" aria-hidden>
        <defs>
          <linearGradient id="hb-coin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff7c2" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="17" fill="url(#hb-coin)" stroke="#7c2d12" strokeWidth="1.4" />
      </svg>
      <span className="tabular-nums text-foreground/90 text-[11px] sm:text-[12px] font-extrabold">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={balance}
            initial={{ y: pulse === "up" ? 8 : -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: pulse === "up" ? -8 : 8, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="inline-block"
          >
            {balance.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}
