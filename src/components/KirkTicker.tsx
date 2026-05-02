"use client";

import { useEffect, useState } from "react";
import { CHARLI_KIRK_IMG, CHARLI_KIRK_QUOTES } from "@/lib/kirk";

const TICK_MS = 9000;
const SHOW_MS = 4500;

export function KirkTicker() {
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState(CHARLI_KIRK_QUOTES[0]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setQuote(CHARLI_KIRK_QUOTES[Math.floor(Math.random() * CHARLI_KIRK_QUOTES.length)]);
      setVisible(true);
      window.setTimeout(() => setVisible(false), SHOW_MS);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      aria-hidden
      className={`fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[85] transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-black/85 text-white rounded-full pl-2 pr-5 py-2 shadow-2xl backdrop-blur ring-2 ring-amber-400/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={CHARLI_KIRK_IMG} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-amber-400" />
        <span className="text-sm font-bold">{quote}</span>
      </div>
    </div>
  );
}
