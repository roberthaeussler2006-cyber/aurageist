"use client";

import { useState } from "react";

export function ShareButton({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ url, text, title: text });
        return;
      } catch {
        // user cancelled or share failed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 border border-accent/60 text-accent uppercase tracking-[0.18em] text-[11px] font-semibold rounded-full hover:bg-accent/10 transition-colors"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
