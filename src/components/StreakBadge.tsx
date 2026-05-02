"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

const STREAK_REFRESH_EVENT = "streak:refresh";

export function dispatchStreakRefresh() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STREAK_REFRESH_EVENT));
  }
}

export function StreakBadge() {
  const { session, loading } = useAuth();
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (loading || !session) {
      setCurrent(null);
      return;
    }
    let aborted = false;
    const fetchStreak = async () => {
      try {
        const res = await fetch("/api/streak", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        });
        if (!res.ok) return;
        const j = (await res.json()) as { current: number };
        if (!aborted) setCurrent(j.current ?? 0);
      } catch {
        // swallow
      }
    };
    fetchStreak();
    const onRefresh = () => fetchStreak();
    window.addEventListener(STREAK_REFRESH_EVENT, onRefresh);
    return () => {
      aborted = true;
      window.removeEventListener(STREAK_REFRESH_EVENT, onRefresh);
    };
  }, [session, loading]);

  if (loading || !session || current == null || current === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] shadow-md"
      title={`${current}-day voting streak`}
    >
      <Flame />
      {current}
    </span>
  );
}

function Flame() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13.5 1.5c0 3-3 4.5-3 7.5a3 3 0 006 0c0-1 .5-2 1-2.5C19 9 21 11.5 21 14.5A9 9 0 013 14.5C3 9 7.5 6 9 1.5c1 1 4.5 0 4.5 0z" />
    </svg>
  );
}
