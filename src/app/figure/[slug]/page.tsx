import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import type { FigureDetailResponse } from "@/lib/types";
import { formatYears } from "@/components/FigureBlurb";
import { SocialLink } from "@/components/SocialLink";
import { Comments } from "@/components/Comments";
import { formatMoney, moneyBarPct } from "@/lib/money";
import { KnownForBlock } from "@/components/KnownForBlock";

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

  const leaderboardHref = figure.category === "current" ? "/leaderboard/current" : "/leaderboard";
  const matchupHref = figure.category === "current" ? "/current" : "/";

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-4xl mx-auto">
        <Link href={leaderboardHref} className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-accent transition-colors">
          ← back to leaderboard
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 sm:gap-10 mt-6">
          <div className="md:w-[280px]">
            <div className="portrait-bright aspect-[3/4] w-full md:w-[280px] rounded-3xl overflow-hidden shadow-[var(--shadow)] relative">
              {figure.image_url ? (
                <Image
                  src={figure.image_url}
                  alt={figure.name}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 280px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[#f4f4f5] grid place-items-center text-muted text-xs uppercase tracking-widest">
                  no portrait
                </div>
              )}
            </div>
            {figure.category === "current" && (
              <KnownForBlock wikiSlug={figure.wiki_slug} name={figure.name} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="pill">{figure.category === "current" ? "Current" : "Historical"}</span>
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted">rank #{rank}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">{figure.name}</h1>
            <div className="text-xs uppercase tracking-[0.18em] font-semibold text-muted mt-2">
              {formatYears(figure.birth_year, figure.death_year) ?? "dates unknown"}
            </div>
            {figure.social_url && figure.social_kind && figure.social_kind !== "none" && (
              <div className="mt-4">
                <SocialLink
                  url={figure.social_url}
                  kind={figure.social_kind}
                  name={figure.name}
                  variant="inline"
                />
              </div>
            )}
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

            {figure.category === "current" && (
              <RankPanel
                fame={figure.fame_rank}
                controversy={figure.controversy_rank}
                netWorth={figure.net_worth_usd}
              />
            )}
          </div>
        </div>

        <section className="mt-10 sm:mt-14">
          <h2 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mb-4">Recent matchups</h2>
          {recent.length === 0 ? (
            <p className="text-foreground/60 text-sm">No matches yet.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((m) => (
                <li key={m.id}>
                  <Link
                    href={m.opponent.wiki_slug ? `/figure/${encodeURIComponent(m.opponent.wiki_slug)}` : "#"}
                    className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all"
                  >
                    <span
                      className={`text-[10px] uppercase tracking-[0.18em] font-bold w-14 ${
                        m.outcome === "win" ? "text-gradient" : "text-muted"
                      }`}
                    >
                      {m.outcome === "win" ? "Beat" : "Lost to"}
                    </span>
                    <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-line shrink-0 relative">
                      {m.opponent.image_url ? (
                        <Image
                          src={m.opponent.image_url}
                          alt={m.opponent.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-line" />
                      )}
                    </div>
                    <span className="font-semibold flex-1 truncate">{m.opponent.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Comments figureId={figure.id} />

        <div className="mt-12 text-center">
          <Link
            href={matchupHref}
            className="btn-gradient inline-block px-7 py-3 text-xs uppercase"
          >
            Vote in a new matchup
          </Link>
        </div>
      </div>
    </div>
  );
}

function RankPanel({
  fame,
  controversy,
  netWorth,
}: {
  fame: number | null;
  controversy: number | null;
  netWorth: number | null;
}) {
  const items: {
    label: string;
    display: string;
    suffix?: string;
    pct: number;
    tone: string;
  }[] = [
    {
      label: "Famous",
      display: fame == null ? "—" : `${fame}`,
      suffix: fame == null ? undefined : "/ 100",
      pct: fame == null ? 0 : Math.max(0, Math.min(100, fame)),
      tone: "from-fuchsia-500 to-rose-500",
    },
    {
      label: "Controversial",
      display: controversy == null ? "—" : `${controversy}`,
      suffix: controversy == null ? undefined : "/ 100",
      pct: controversy == null ? 0 : Math.max(0, Math.min(100, controversy)),
      tone: "from-amber-500 to-red-600",
    },
    {
      label: "Net worth",
      display: formatMoney(netWorth),
      pct: moneyBarPct(netWorth),
      tone: "from-emerald-500 to-teal-600",
    },
  ];
  const anyRated = fame != null || controversy != null || netWorth != null;
  return (
    <div className="mt-6 rounded-2xl border border-line bg-panel px-4 sm:px-5 py-4 sm:py-5 shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted mb-3">
        Editorial ranks
      </div>
      {anyRated ? (
        <div className="space-y-3">
          {items.map((i) => (
            <RankBar
              key={i.label}
              label={i.label}
              display={i.display}
              suffix={i.suffix}
              pct={i.pct}
              tone={i.tone}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">Not yet rated.</p>
      )}
    </div>
  );
}

function RankBar({
  label,
  display,
  suffix,
  pct,
  tone,
}: {
  label: string;
  display: string;
  suffix?: string;
  pct: number;
  tone: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs sm:text-sm font-semibold text-foreground/80">{label}</span>
        <span className="text-sm font-bold tabular-nums text-foreground/90">
          {display}
          {suffix && (
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted ml-1">{suffix}</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-line/60 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tone} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-3 py-4 text-center shadow-sm">
      <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">{label}</div>
      <div className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${accent ? "text-gradient" : ""}`}>
        {value}
      </div>
    </div>
  );
}
