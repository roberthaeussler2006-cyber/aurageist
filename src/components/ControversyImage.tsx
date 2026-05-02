"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, boolean>();

export function controversyImageUrl(wikiSlug: string): string {
  return `/controversy/${encodeURIComponent(wikiSlug)}.jpg`;
}

export function useControversyImage(wikiSlug: string): {
  url: string;
  available: boolean | null;
} {
  const url = controversyImageUrl(wikiSlug);
  const cached = cache.get(url);
  const [available, setAvailable] = useState<boolean | null>(
    cached === undefined ? null : cached,
  );

  useEffect(() => {
    if (cache.has(url)) {
      setAvailable(cache.get(url) ?? false);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      cache.set(url, true);
      if (!cancelled) setAvailable(true);
    };
    img.onerror = () => {
      cache.set(url, false);
      if (!cancelled) setAvailable(false);
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { url, available };
}
