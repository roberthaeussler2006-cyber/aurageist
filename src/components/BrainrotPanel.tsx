"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "brainrot-dismissed";
// Swap this for whatever YouTube video ID you want looping.
const YT_ID = "9q6eL3iSATM";

export function BrainrotPanel() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  const src = `https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&controls=1&modestbranding=1&playsinline=1&rel=0`;

  return (
    <div className="fixed bottom-3 right-3 z-50 w-[120px] sm:w-[140px] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/20 bg-black group">
      <iframe
        src={src}
        title="brainrot"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen={false}
        className="w-full h-full"
      />
      <button
        type="button"
        aria-label="dismiss"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
      >
        ×
      </button>
    </div>
  );
}
