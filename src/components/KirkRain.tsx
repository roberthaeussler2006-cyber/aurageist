"use client";

import { useEffect, useRef, useState } from "react";
import { CHARLI_KIRK_IMG } from "@/lib/kirk";

type Drop = { id: number; x: number; size: number; duration: number; delay: number };

const SPAWN_EVERY_MS = 6000;
const MAX_VISIBLE = 8;

export function KirkRain() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      idRef.current += 1;
      const d: Drop = {
        id: idRef.current,
        x: Math.random() * 90 + 2,
        size: 56 + Math.random() * 64,
        duration: 6 + Math.random() * 4,
        delay: 0,
      };
      setDrops((prev) => {
        const next = [...prev, d];
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
      window.setTimeout(() => {
        setDrops((prev) => prev.filter((x) => x.id !== d.id));
      }, (d.duration + 1) * 1000);
    }, SPAWN_EVERY_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-[80] pointer-events-none overflow-hidden">
        {drops.map((d) => (
          <span
            key={d.id}
            className="absolute"
            style={{
              left: `${d.x}vw`,
              top: `-${d.size}px`,
              width: d.size,
              height: d.size,
              animation: `kirkfall ${d.duration}s linear forwards`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={CHARLI_KIRK_IMG}
              alt=""
              draggable={false}
              className="w-full h-full rounded-full object-cover ring-2 ring-white/30 shadow-lg opacity-80"
            />
          </span>
        ))}
      </div>
      <style jsx global>{`
        @keyframes kirkfall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.85; }
          100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </>
  );
}
