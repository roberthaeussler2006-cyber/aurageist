import type { Category } from "./types";

const VALID: Category[] = ["historical", "current"];

export function parseCategory(raw: string | null | undefined): Category {
  if (raw && (VALID as string[]).includes(raw)) return raw as Category;
  return "historical";
}

export function categoryLabel(c: Category): string {
  return c === "current" ? "Current figures" : "Historical figures";
}

export function categoryShortLabel(c: Category): string {
  return c === "current" ? "Current" : "Historical";
}

export function otherCategory(c: Category): Category {
  return c === "current" ? "historical" : "current";
}
