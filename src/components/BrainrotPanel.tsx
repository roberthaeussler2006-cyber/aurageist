"use client";

import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "brainrot-dismissed";
const SRC = "/brainrot.mp4";

export function BrainrotPanel() {
  const [visible, setVisible] = useState(false);
  const [available, setAvailable] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible || !available) return null;

  return (
    <div className="fixed bottom-3 right-3 z-50 w-[120px] sm:w-[140px] aspect-[9/16] rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/20 bg-black group">
      <video
        ref={videoRef}
        src={SRC}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setAvailable(false)}
        className="w-full h-full object-cover"
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
