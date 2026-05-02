import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import type { FigureDetailResponse } from "@/lib/types";
import { formatYears } from "@/components/FigureBlurb";

export const dynamic = "force-dynamic";

async function fetchDetail(slug: string): Promise<FigureDetailResponse | null> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  if (!host) return null;
  const res = await fetch(`${proto}://${host}/api/figure/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as FigureDetailResponse;
}

export default async function FigurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await fetchDetail(slug);
  if (!detail) notFound();

  const { figure, rank, recent } = detail;
  const wins = figure.wins;
  const matches = figure.matches;
  const losses = matches - wins;
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const elo = Math.round(Number(figure.elo));

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-4xl mx-auto">
        <Link href="/leaderboard" className="text-[10px] uppercase tracking-[0.25em] text-muted hover:text-accent">
          ← back to leaderboard
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 sm:gap-10 mt-6">
          <div className="portrait-vignette aspect-[3/4] w-full md:w-[280px] border border-line">
            {figure.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={figure.image_url} alt={figure.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-panel grid place-items-center text-muted text-xs uppercase tracking-widest">
                no portrait
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted">
              rank #{rank}
            </div>
            <h1 className="serif text-4xl sm:text-5xl italic mt-1">{figure.name}</h1>
            <div className="text-xs uppercase tracking-[0.2em] text-muted mt-2">
              {formatYears(figure.birth_year, figure.death_year) ?? "dates unknown"}
            </div>
            {figure.short_blurb && (
              <p className="text-foreground/80 mt-4 leading-relaxed text-sm sm:text-base">
                {figure.short_blurb}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
              <Stat label="Elo" value={elo.toString()} accent />
              <Stat label="Wins" value={wins.toString()} />
              <Stat label="Losses" value={losses.toString()} />
              <Stat label="Win rate" value={`${winRate}%`} />
            </div>
          </div>
        </div>

        <section className="mt-10 sm:mt-14">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-muted mb-4">Recent matchups</h2>
          {recent.length === 0 ? (
            <p className="text-foreground/60 text-sm">No matches yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((m) => (
                <li key={m.id}>
                  <Link
                    href={m.opponent.wiki_slug ? `/figure/${encodeURIComponent(m.opponent.wiki_slug)}` : "#"}
                    className="flex items-center gap-3 sm:gap-4 px-3 py-3 border border-line bg-panel/30 hover:border-accent/40 transition-colors"
                  >
                    <span
                      className={`text-[10px] uppercase tracking-[0.2em] w-12 ${
                        m.outcome === "win" ? "text-accent" : "text-muted"
                      }`}
                    >
                      {m.outcome === "win" ? "Beat" : "Lost to"}
                    </span>
                    <div className="h-10 w-10 rounded-full overflow-hidden border border-line shrink-0">
                      {m.opponent.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.opponent.image_url} alt={m.opponent.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-panel" />
                      )}
                    </div>
                    <span className="serif flex-1 truncate">{m.opponent.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted/70">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 border border-accent/60 text-accent uppercase tracking-[0.25em] text-xs hover:bg-accent/10 transition-colors"
          >
            Vote in a new matchup
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-line bg-panel/30 px-3 py-3 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={`serif text-2xl sm:text-3xl tabular-nums mt-1 ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}
