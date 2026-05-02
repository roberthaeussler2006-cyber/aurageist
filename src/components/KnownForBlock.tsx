"use client";

import { useControversyImage } from "./ControversyImage";

export function KnownForBlock({ wikiSlug, name }: { wikiSlug: string; name: string }) {
  const { url, available } = useControversyImage(wikiSlug);
  if (!available) return null;
  return (
    <div className="mt-4 w-full md:w-[280px]">
      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted mb-2">
        Known for
      </div>
      <div className="portrait-bright aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-[var(--shadow)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`${name} — iconic moment`} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
