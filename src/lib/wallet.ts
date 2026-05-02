// Browser-only wallet. Balance lives in localStorage so anonymous users keep
// their stack across sessions. Cross-component updates fan out via a custom
// DOM event the WalletProvider listens for.

const KEY = "aurageist-wallet-v2";
export const STARTING_BALANCE = 1000;
export const TOPUP_AMOUNT = 500;
export const TOPUP_THRESHOLD = 50;
export const BET_TIERS = [10, 50, 100, 500] as const;
export const EVT = "aurageist-wallet-change";

type Wallet = {
  balance: number;
  totalWon: number;
  totalLost: number;
  biggestWin: number;
  lastTopupAt: number | null;
};

const DEFAULT_WALLET: Wallet = {
  balance: STARTING_BALANCE,
  totalWon: 0,
  totalLost: 0,
  biggestWin: 0,
  lastTopupAt: null,
};

export function readWallet(): Wallet {
  if (typeof window === "undefined") return DEFAULT_WALLET;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return DEFAULT_WALLET;
  try {
    const parsed = JSON.parse(raw);
    return {
      balance: Number(parsed.balance ?? STARTING_BALANCE),
      totalWon: Number(parsed.totalWon ?? 0),
      totalLost: Number(parsed.totalLost ?? 0),
      biggestWin: Number(parsed.biggestWin ?? 0),
      lastTopupAt: parsed.lastTopupAt ?? null,
    };
  } catch {
    return DEFAULT_WALLET;
  }
}

export function writeWallet(w: Wallet) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(w));
  window.dispatchEvent(new CustomEvent(EVT));
}

// Resolve a bet. Returns delta to apply to balance (+ payout - stake on win,
// -stake on loss). Picks vs the other figure's Elo decide both odds and the
// coinflip outcome — favorite is safer, underdog pays out heavy on a hit.
export function resolveBet(args: {
  pickElo: number;
  otherElo: number;
  stake: number;
}): { won: boolean; payout: number; delta: number; multiplier: number } {
  const diff = args.otherElo - args.pickElo;
  const p = 1 / (1 + Math.pow(10, diff / 400));
  const multiplier = Math.max(1.05, (1 / Math.max(p, 0.05)) * 0.9);
  const won = Math.random() < p;
  const payout = won ? Math.round(args.stake * multiplier) : 0;
  const delta = won ? payout - args.stake : -args.stake;
  return { won, payout, delta, multiplier };
}

export function settleBet(stake: number, result: { won: boolean; payout: number; delta: number }) {
  const w = readWallet();
  const next: Wallet = {
    balance: Math.max(0, w.balance + result.delta),
    totalWon: w.totalWon + (result.won ? result.payout : 0),
    totalLost: w.totalLost + (result.won ? 0 : stake),
    biggestWin: Math.max(w.biggestWin, result.won ? result.payout : 0),
    lastTopupAt: w.lastTopupAt,
  };
  writeWallet(next);
  return next;
}

export function maybeTopUp(): boolean {
  const w = readWallet();
  if (w.balance > TOPUP_THRESHOLD) return false;
  writeWallet({ ...w, balance: w.balance + TOPUP_AMOUNT, lastTopupAt: Date.now() });
  return true;
}
