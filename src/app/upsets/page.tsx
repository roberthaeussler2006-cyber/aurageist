"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

type Upset = {
  id: string;
  created_at: string;
  gap: number;
  winner: { id: string; name: string; wiki_slug: string; image_url: string | null; elo: number };
  loser: { id: string; name: string; wiki_slug: string; image_url: string | null; elo: number };
};

export default function UpsetsPage() {
  const [category, setCategory] = useState<Category>("historical");
  const [rows, setRows] = useState<Upset[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setRows(null);
    setError(null);
    fetch(`/api/upsets?cat=${category}&limit=50`, { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(b?.error ?? `failed (${res.status})`);
        }
        const json = (await res.json()) as { upsets: Upset[] };
        setRows(json.upsets);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : "failed to load");
      });
    return () => controller.abort();
  }, [category]);

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">Against the odds</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            Biggest <span className="text-gradient">Upsets</span>
          </h1>
          <p className="mt-3 text-sm text-foreground/60 max-w-md mx-auto">
            Underdogs that took down higher-rated rivals. Sorted by Elo gap at vote time.
          </p>
          <div className="mt-5 inline-flex gap-2">
            {(["historical", "current"] as Category[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold transition-all ${
                  category === c
                    ? "bg-gradient text-white shadow-lg"
                    : "bg-panel border border-line text-muted hover:text-foreground hover:border-accent/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </header>

        {error && <p className="text-center text-[#e11d48]">{error}</p>}
        {!rows && !error && <p className="text-center text-muted">loading...</p>}
        {rows && rows.length === 0 && (
          <p className="text-center text-muted">no upsets yet — keep voting</p>
        )}
        {rows && rows.length > 0 && (
          <ul className="flex flex-col gap-2">
            {rows.map((u) => (
              <li
                key={u.id}
                className="rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all px-3 sm:px-5 py-3 sm:py-4"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                  <Link href={`/figure/${u.winner.wiki_slug}`} className="flex items-center gap-3 min-w-0 group">
                    {u.winner.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.winner.image_url}
                        alt={u.winner.name}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-accent/60 shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-line shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-sm sm:text-base truncate group-hover:text-accent transition-colors">
                        {u.winner.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted tabular-nums">
                        {Math.round(u.winner.elo)}
                      </div>
                    </div>
                  </Link>

                  <div className="text-center shrink-0">
                    <div className="text-gradient font-bold text-lg sm:text-xl tabular-nums">
                      +{Math.round(u.gap)}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.18em] text-muted">gap</div>
                  </div>

                  <Link
                    href={`/figure/${u.loser.wiki_slug}`}
                    className="flex items-center gap-3 min-w-0 group justify-end text-right opacity-70"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-sm sm:text-base truncate group-hover:text-foreground transition-colors line-through decoration-muted">
                        {u.loser.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.16em] text-muted tabular-nums">
                        {Math.round(u.loser.elo)}
                      </div>
                    </div>
                    {u.loser.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.loser.image_url}
                        alt={u.loser.name}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-line shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-line shrink-0" />
                    )}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
