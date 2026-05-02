"use client";

import Link from "next/link";
import { CHARLI_KIRK_IMG, CHARLI_KIRK_QUOTES } from "@/lib/kirk";

export default function KirkShrinePage() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-fuchsia-100 to-rose-100" />
      <div
        aria-hidden
        className="absolute inset-0 grid grid-cols-6 sm:grid-cols-10 gap-2 p-2 opacity-20"
      >
        {Array.from({ length: 60 }).map((_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={CHARLI_KIRK_IMG}
            alt=""
            className="w-full aspect-square rounded-full object-cover"
            style={{ transform: `rotate(${(i * 17) % 360}deg)` }}
          />
        ))}
      </div>

      <div className="relative px-4 sm:px-8 py-16 max-w-3xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-fuchsia-700">welcome to</p>
        <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-gradient mt-3 mb-6 animate-pulse">
          THE SHRINE
        </h1>

        <div className="relative inline-block mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CHARLI_KIRK_IMG}
            alt="CHARLI"
            className="h-64 w-64 sm:h-80 sm:w-80 rounded-full object-cover ring-8 ring-amber-400 shadow-[0_0_80px_rgba(244,114,182,0.6)] mx-auto"
          />
          <div className="absolute -inset-3 rounded-full border-4 border-fuchsia-500 animate-ping opacity-30" />
        </div>

        <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          CHARLI <span className="text-gradient">KIRK</span>
        </p>
        <p className="text-sm uppercase tracking-[0.25em] font-bold text-muted mb-8">
          the prophet of aura
        </p>

        <ul className="flex flex-col gap-2 max-w-md mx-auto mb-10">
          {CHARLI_KIRK_QUOTES.map((q, i) => (
            <li
              key={i}
              className="rounded-2xl bg-white/80 backdrop-blur border border-amber-300 px-5 py-3 text-sm font-semibold shadow"
            >
              &ldquo;{q}&rdquo;
            </li>
          ))}
        </ul>

        <Link
          href="/figure/Charlie_Kirk"
          className="btn-gradient inline-block px-7 py-3 text-xs uppercase"
        >
          vote for him →
        </Link>
        <p className="mt-8 text-[10px] uppercase tracking-[0.25em] font-bold text-muted/70">
          house wins: 0 · kirk wins: ∞
        </p>
      </div>
    </div>
  );
}
