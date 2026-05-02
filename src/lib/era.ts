export type Era = "ancient" | "medieval" | "early-modern" | "modern" | "contemporary";

export const ERAS: { id: Era; label: string; from: number; to: number }[] = [
  { id: "ancient", label: "Ancient", from: -3000, to: 499 },
  { id: "medieval", label: "Medieval", from: 500, to: 1499 },
  { id: "early-modern", label: "Early Modern", from: 1500, to: 1799 },
  { id: "modern", label: "Modern", from: 1800, to: 1949 },
  { id: "contemporary", label: "Contemporary", from: 1950, to: 3000 },
];

export function parseEra(input: string | null | undefined): Era {
  const found = ERAS.find((e) => e.id === input);
  return found?.id ?? "modern";
}

export function eraOf(birthYear: number | null | undefined): Era | null {
  if (birthYear == null) return null;
  for (const e of ERAS) {
    if (birthYear >= e.from && birthYear <= e.to) return e.id;
  }
  return null;
}
