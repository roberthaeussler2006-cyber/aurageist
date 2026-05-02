export function FigureBlurb({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="text-sm text-foreground/70 mt-2 line-clamp-2 leading-relaxed">
      {text}
    </p>
  );
}

export function formatYears(birth: number | null, death: number | null): string | null {
  if (birth == null && death == null) return null;
  const fmt = (y: number) => (y < 0 ? `${Math.abs(y)} BCE` : `${y}`);
  if (birth != null && death != null) return `${fmt(birth)} – ${fmt(death)}`;
  if (birth != null) return `b. ${fmt(birth)}`;
  return `d. ${fmt(death!)}`;
}
