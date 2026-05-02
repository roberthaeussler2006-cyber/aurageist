import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase";
import type { Figure } from "@/lib/types";
import { ShareButton } from "@/components/ShareButton";

export const dynamic = "force-dynamic";

type H2H = {
  a: Figure;
  b: Figure;
  aWins: number;
  bWins: number;
  total: number;
};

async function loadH2H(slugA: string, slugB: string): Promise<H2H | null> {
  const supabase = getServerSupabase();
  const { data: figs } = await supabase
    .from("figures")
    .select("*")
    .in("wiki_slug", [slugA, slugB]);
  if (!figs || figs.length < 2) return null;

  const a = (figs as Figure[]).find((f) => f.wiki_slug === slugA);
  const b = (figs as Figure[]).find((f) => f.wiki_slug === slugB);
  if (!a || !b) return null;

  const [{ count: aWins }, { count: bWins }] = await Promise.all([
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("winner_id", a.id)
      .eq("loser_id", b.id),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("winner_id", b.id)
      .eq("loser_id", a.id),
  ]);

  const aw = aWins ?? 0;
  const bw = bWins ?? 0;
  return { a, b, aWins: aw, bWins: bw, total: aw + bw };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ a: string; b: string }>;
}): Promise<Metadata> {
  const { a, b } = await params;
  const h2h = await loadH2H(a, b);
  if (!h2h) return { title: "Aurageist · vs" };

  const title = `${h2h.a.name} vs ${h2h.b.name} · Aurageist`;
  const description = `Who has more aura? ${h2h.a.name} (${Math.round(Number(h2h.a.elo))}) vs ${h2h.b.name} (${Math.round(Number(h2h.b.elo))}). ${h2h.total} head-to-head votes.`;
  const ogPath = `/api/og/vs/${encodeURIComponent(a)}/${encodeURIComponent(b)}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [ogPath] },
    twitter: { card: "summary_large_image", title, description, images: [ogPath] },
  };
}

export default async function VsPage({
  params,
}: {
  params: Promise<{ a: string; b: string }>;
}) {
  const { a: slugA, b: slugB } = await params;
  const h2h = await loadH2H(slugA, slugB);
  if (!h2h) notFound();

  const { a, b, aWins, bWins, total } = h2h;
  const aPct = total > 0 ? Math.round((aWins / total) * 100) : 0;
  const bPct = total > 0 ? 100 - aPct : 0;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "";
  const shareUrl = `${proto}://${host}/vs/${encodeURIComponent(slugA)}/${encodeURIComponent(slugB)}`;
  const shareText = `${a.name} vs ${b.name} — who has more aura?`;

  return (
    <div className="px-4 sm:px-8 pb-16 pt-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted hover:text-accent transition-colors">
            ← back to voting
          </Link>
          <ShareButton url={shareUrl} text={shareText} />
        </div>

        <h1 className="text-center text-4xl sm:text-6xl font-bold tracking-tight">
          {a.name} <span className="display-italic text-gradient">vs</span> {b.name}
        </h1>
        <p className="text-center text-sm text-foreground/60 mt-3">
          {total > 0
            ? `${total} head-to-head ${total === 1 ? "vote" : "votes"} so far`
            : "No head-to-head votes yet — be the first."}
        </p>

        <div className="grid grid-cols-2 gap-4 sm:gap-8 mt-10">
          <FigureCard figure={a} wins={aWins} losses={bWins} pct={aPct} side="left" />
          <FigureCard figure={b} wins={bWins} losses={aWins} pct={bPct} side="right" />
        </div>

        {total > 0 && (
          <div className="mt-8">
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-line">
              <div
                className="bg-gradient-to-r from-fuchsia-500 to-rose-500"
                style={{ width: `${aPct}%` }}
              />
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 ml-auto"
                style={{ width: `${bPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mt-2">
              <span>{aPct}% {a.name}</span>
              <span>{b.name} {bPct}%</span>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/" className="btn-gradient inline-block px-7 py-3 text-xs uppercase">
            Vote in a new matchup
          </Link>
        </div>
      </div>
    </div>
  );
}

function FigureCard({
  figure,
  wins,
  losses,
  pct,
  side,
}: {
  figure: Figure;
  wins: number;
  losses: number;
  pct: number;
  side: "left" | "right";
}) {
  return (
    <Link
      href={`/figure/${encodeURIComponent(figure.wiki_slug)}`}
      className={`block group ${side === "right" ? "text-right" : ""}`}
    >
      <div className="portrait-bright aspect-[3/4] w-full rounded-3xl overflow-hidden shadow-[var(--shadow)] group-hover:shadow-lg transition-shadow">
        {figure.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={figure.image_url} alt={figure.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[#f4f4f5] grid place-items-center text-muted text-xs uppercase tracking-widest">
            no portrait
          </div>
        )}
      </div>
      <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight">{figure.name}</h2>
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-muted mt-1">
        Elo {Math.round(Number(figure.elo))} · {wins}–{losses} h2h · {pct}%
      </div>
    </Link>
  );
}
