export const THEMES = [
  "musicians",
  "athletes",
  "scientists",
  "leaders",
  "entertainers",
  "business",
  "controversial",
  "royalty",
  "religious",
  "activists",
  "artists",
  "writers",
] as const;

export type Theme = (typeof THEMES)[number];

const THEME_LABELS: Record<Theme, string> = {
  musicians: "Musicians",
  athletes: "Athletes",
  scientists: "Scientists",
  leaders: "Leaders",
  entertainers: "Entertainers",
  business: "Business",
  controversial: "Controversial",
  royalty: "Royalty",
  religious: "Religious",
  activists: "Activists",
  artists: "Artists",
  writers: "Writers",
};

const THEME_EMOJI: Record<Theme, string> = {
  musicians: "🎤",
  athletes: "🏆",
  scientists: "🔬",
  leaders: "🏛️",
  entertainers: "🎬",
  business: "💼",
  controversial: "🔥",
  royalty: "👑",
  religious: "🙏",
  activists: "✊",
  artists: "🎨",
  writers: "📚",
};

export function isTheme(raw: string | null | undefined): raw is Theme {
  return !!raw && (THEMES as readonly string[]).includes(raw);
}

export function parseTheme(raw: string | null | undefined): Theme | null {
  return isTheme(raw) ? raw : null;
}

export function themeLabel(t: Theme): string {
  return THEME_LABELS[t];
}

export function themeEmoji(t: Theme): string {
  return THEME_EMOJI[t];
}
