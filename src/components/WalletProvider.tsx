"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { readWallet, EVT, BET_TIERS, maybeTopUp } from "@/lib/wallet";

type State = {
  balance: number;
  totalWon: number;
  totalLost: number;
  biggestWin: number;
  bet: number;
  setBet: (n: number) => void;
  refresh: () => void;
  topUpIfBroke: () => boolean;
};

const Ctx = createContext<State | null>(null);

const BET_KEY = "aurageist-bet-v1";

function readBet(balance: number): number {
  if (typeof window === "undefined") return BET_TIERS[1];
  const raw = window.localStorage.getItem(BET_KEY);
  const n = raw ? Number(raw) : BET_TIERS[1];
  if (!Number.isFinite(n) || n < 1) return Math.min(BET_TIERS[1], balance);
  return Math.min(n, balance || BET_TIERS[0]);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => readWallet());
  const [bet, setBetInternal] = useState<number>(() => BET_TIERS[1]);

  useEffect(() => {
    const w = readWallet();
    setState(w);
    setBetInternal(readBet(w.balance));
    const onChange = () => setState(readWallet());
    window.addEventListener(EVT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setBet = (n: number) => {
    setBetInternal(n);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BET_KEY, String(n));
    }
  };

  const refresh = () => setState(readWallet());

  const topUpIfBroke = () => {
    const did = maybeTopUp();
    if (did) refresh();
    return did;
  };

  return (
    <Ctx.Provider
      value={{
        balance: state.balance,
        totalWon: state.totalWon,
        totalLost: state.totalLost,
        biggestWin: state.biggestWin,
        bet: Math.min(bet, Math.max(state.balance, BET_TIERS[0])),
        setBet,
        refresh,
        topUpIfBroke,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWallet(): State {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Render-safe fallback during SSR / before mount.
    return {
      balance: 0,
      totalWon: 0,
      totalLost: 0,
      biggestWin: 0,
      bet: BET_TIERS[1],
      setBet: () => {},
      refresh: () => {},
      topUpIfBroke: () => false,
    };
  }
  return ctx;
}
