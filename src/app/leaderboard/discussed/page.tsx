import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  wiki_slug: string;
  image_url: string | null;
  category: string;
  elo: number;
  comment_count: number;
};

async function loadTop(): Promise<Row[]> {
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("figure_comment_counts")
    .select("id,name,wiki_slug,image_url,category,elo,comment_count")
    .order("comment_count", { ascending: false })
    .order("elo", { ascending: false })
    .limit(50);
  return (data as Row[]) ?? [];
}

export default async function DiscussedPage() {
  const rows = (await loadTop()).filter((r) => r.comment_count > 0);

  return (
    <div className="px-4 sm:px-8 pb-16 pt-2">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <span className="pill">What people are talking about</span>
          <h1 className="text-4xl sm:text-5xl mt-3 font-bold tracking-tight">
            <span className="text-gradient">Most discussed</span>
          </h1>
          <div className="mt-4 text-[11px] uppercase tracking-[0.18em] font-semibold text-muted flex items-center justify-center gap-3">
            <Link href="/leaderboard" className="hover:text-accent transition-colors">
              ← historical
            </Link>
            <span className="text-muted/40">·</span>
            <Link href="/leaderboard/current" className="hover:text-accent transition-colors">
              current →
            </Link>
          </div>
        </header>

        {rows.length === 0 ? (
          <p className="text-center text-muted text-sm">
            No comments yet. Be the first to start a thread on any figure.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={`/figure/${encodeURIComponent(r.wiki_slug)}`}
                  className="flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl bg-panel border border-line hover:border-accent/40 hover:shadow-md transition-all"
                >
                  <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted w-8 text-right tabular-nums">
                    #{i + 1}
                  </span>
                  <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-line shrink-0">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-line" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-muted">
                      {r.category} · Elo {Math.round(Number(r.elo))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient tabular-nums">
                      {r.comment_count}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.18em] font-semibold text-muted">
                      {r.comment_count === 1 ? "comment" : "comments"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
