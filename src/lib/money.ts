// Format a USD amount as a short, readable string.
// 250000000000 → "$250B", 1500000 → "$1.5M", 100000 → "$100K", 0 → "$0".
export function formatMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${trim(abs / 1e12)}T`;
  if (abs >= 1e9) return `${sign}$${trim(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}$${trim(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}$${trim(abs / 1e3)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function trim(n: number): string {
  // Show one decimal for small magnitudes (e.g., $1.5B), drop it once >=100.
  if (n >= 100) return n.toFixed(0);
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, "");
  return n.toFixed(2).replace(/\.?0+$/, "");
}

// Width 0-100 for a money bar. Log-scaled against ~$300B (Musk-tier ceiling)
// so a $5M figure still registers visually next to a billionaire.
export function moneyBarPct(n: number | null | undefined): number {
  if (n == null || n <= 0) return 0;
  const max = Math.log10(3e11);
  const min = Math.log10(1e3);
  const v = (Math.log10(n) - min) / (max - min);
  return Math.max(2, Math.min(100, v * 100));
}
