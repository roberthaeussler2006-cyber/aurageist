import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer the service role key when available (bypasses RLS, lets us upload to
// storage). Falls back to the anon key, which works as long as RLS is off on
// the figures table — fine for the v1 deployment.
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const HAS_SERVICE_KEY = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or a Supabase key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY, {
  auth: { persistSession: false },
});

type Row = { name: string; wiki_slug: string; category?: string };

type WikiSummary = {
  extract?: string;
  description?: string;
  originalimage?: { source: string };
  thumbnail?: { source: string };
  wikibase_item?: string;
};

type WikidataClaim = {
  rank?: "preferred" | "normal" | "deprecated";
  mainsnak?: {
    snaktype?: string;
    datavalue?: { value: unknown; type?: string };
  };
};

type WikidataEntity = {
  claims?: Record<string, WikidataClaim[]>;
};

type SocialKind =
  | "instagram"
  | "x"
  | "tiktok"
  | "youtube"
  | "threads"
  | "facebook"
  | "website";

// Priority order: Instagram first, then short-form video, then video, then text, then official site.
const SOCIAL_PROPS: Array<{
  kind: SocialKind;
  prop: string;
  build: (v: string) => string | null;
}> = [
  { kind: "instagram", prop: "P2003", build: (v) => `https://instagram.com/${stripAt(v)}` },
  { kind: "tiktok", prop: "P7085", build: (v) => `https://tiktok.com/@${stripAt(v)}` },
  { kind: "x", prop: "P2002", build: (v) => `https://x.com/${stripAt(v)}` },
  { kind: "youtube", prop: "P2397", build: (v) => `https://youtube.com/channel/${v}` },
  { kind: "threads", prop: "P10967", build: (v) => `https://threads.net/@${stripAt(v)}` },
  { kind: "facebook", prop: "P2013", build: (v) => `https://facebook.com/${v}` },
  { kind: "website", prop: "P856", build: (v) => (isUrl(v) ? v : null) },
];

function stripAt(v: string): string {
  return v.replace(/^@/, "").trim();
}

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v);
}

const CSV_PATH = join(process.cwd(), "data", "figures.csv");
const CONCURRENCY = 5;
const USER_AGENT = "Aurageist/1.0 (https://github.com; seed script) Node.js";

const summary = { ok: 0, skipped: 0, errored: 0 };
const skippedNames: string[] = [];
const erroredNames: string[] = [];

async function main() {
  const rows = parseCsv();
  console.log(`Loaded ${rows.length} figures from CSV.`);
  console.log(
    HAS_SERVICE_KEY
      ? "Using service role key — will upload portraits to Supabase Storage."
      : "Using anon key — skipping storage upload, using Wikipedia URLs directly.",
  );

  // Skip rows that already have both an image AND a resolved social check.
  // Run with SEED_FORCE=1 to re-fetch all.
  const force = process.env.SEED_FORCE === "1";
  let toProcess = rows;
  const existingByName = new Map<string, { hasImage: boolean; socialChecked: boolean }>();
  if (!force) {
    const { data: existing } = await supabase
      .from("figures")
      .select("name, image_url, social_kind");
    for (const r of existing ?? []) {
      existingByName.set(r.name, {
        hasImage: r.image_url != null,
        socialChecked: r.social_kind != null,
      });
    }
    toProcess = rows.filter((r) => {
      const e = existingByName.get(r.name);
      if (!e) return true;
      return !(e.hasImage && e.socialChecked);
    });
    console.log(`Skipping ${rows.length - toProcess.length} already-seeded figures; will fetch ${toProcess.length}.`);
  }

  await runWithConcurrency(toProcess, CONCURRENCY, (row) =>
    processOne(row, existingByName.get(row.name) ?? { hasImage: false, socialChecked: false }),
  );

  console.log("\n=== Seed summary ===");
  console.log(`  succeeded: ${summary.ok}`);
  console.log(`  skipped (no image): ${summary.skipped}`);
  console.log(`  errored: ${summary.errored}`);
  if (skippedNames.length) {
    console.log("\nSkipped (no image on Wikipedia):");
    for (const n of skippedNames) console.log(`  - ${n}`);
  }
  if (erroredNames.length) {
    console.log("\nErrored (see logs above):");
    for (const n of erroredNames) console.log(`  - ${n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

function parseCsv(): Row[] {
  const csv = readFileSync(CSV_PATH, "utf8");
  const parsed = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.error("CSV parse errors:", parsed.errors);
    process.exit(1);
  }
  return parsed.data.filter((r) => r.name && r.wiki_slug);
}

async function processOne(
  row: Row,
  state: { hasImage: boolean; socialChecked: boolean },
): Promise<void> {
  try {
    const wiki = await fetchWikiSummary(row.wiki_slug);
    if (!wiki) {
      console.warn(`[${row.name}] no wiki summary, skipping`);
      summary.skipped++;
      skippedNames.push(row.name);
      return;
    }

    const social = wiki.wikibase_item
      ? await resolveSocial(wiki.wikibase_item)
      : { url: null, kind: "none" as const };

    // If we already have the image, only update the social columns.
    if (state.hasImage) {
      const { error } = await supabase
        .from("figures")
        .update({ social_url: social.url, social_kind: social.kind })
        .eq("name", row.name);
      if (error) throw error;
      summary.ok++;
      console.log(`[${row.name}] socials: ${social.kind}${social.url ? " " + social.url : ""}`);
      return;
    }

    const wikiImage = wiki.originalimage?.source ?? wiki.thumbnail?.source;
    if (!wikiImage) {
      console.warn(`[${row.name}] no image, skipping`);
      summary.skipped++;
      skippedNames.push(row.name);
      return;
    }

    let imageUrl = wikiImage;
    if (HAS_SERVICE_KEY) {
      imageUrl = await uploadToStorage(row.wiki_slug, wikiImage);
    }

    const blurb = wiki.extract?.slice(0, 200) ?? null;
    const { birth, death } = parseDates(wiki.description ?? "");

    const { error } = await supabase
      .from("figures")
      .upsert(
        {
          name: row.name,
          wiki_slug: row.wiki_slug,
          image_url: imageUrl,
          short_blurb: blurb,
          birth_year: birth,
          death_year: death,
          category: row.category ?? "historical",
          social_url: social.url,
          social_kind: social.kind,
        },
        { onConflict: "name" },
      );
    if (error) throw error;

    summary.ok++;
    console.log(`[${row.name}] ok (${social.kind})`);
  } catch (e) {
    summary.errored++;
    erroredNames.push(row.name);
    console.error(`[${row.name}] error:`, e instanceof Error ? e.message : e);
  }
}

async function resolveSocial(qid: string): Promise<{ url: string | null; kind: SocialKind | "none" }> {
  const entity = await fetchWikidataEntity(qid);
  if (!entity) return { url: null, kind: "none" };
  for (const { kind, prop, build } of SOCIAL_PROPS) {
    const value = firstClaimString(entity, prop);
    if (!value) continue;
    const url = build(value);
    if (url) return { url, kind };
  }
  return { url: null, kind: "none" };
}

async function fetchWikidataEntity(qid: string): Promise<WikidataEntity | null> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) {
    console.warn(`  wikidata fetch ${res.status} for ${qid}`);
    return null;
  }
  const json = (await res.json()) as { entities?: Record<string, WikidataEntity> };
  return json.entities?.[qid] ?? null;
}

function firstClaimString(entity: WikidataEntity, prop: string): string | null {
  const claims = entity.claims?.[prop];
  if (!claims || claims.length === 0) return null;
  // Prefer "preferred" rank, then "normal"; skip "deprecated".
  const ordered = [...claims].sort((a, b) => rankWeight(b.rank) - rankWeight(a.rank));
  for (const c of ordered) {
    if (c.rank === "deprecated") continue;
    if (c.mainsnak?.snaktype !== "value") continue;
    const v = c.mainsnak.datavalue?.value;
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

function rankWeight(rank?: string): number {
  if (rank === "preferred") return 2;
  if (rank === "normal") return 1;
  return 0;
}

async function uploadToStorage(slug: string, sourceUrl: string): Promise<string> {
  const buffer = await downloadImage(sourceUrl);
  const fileName = `${slug}.jpg`;
  const upload = await supabase.storage.from("portraits").upload(fileName, buffer, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (upload.error) throw upload.error;
  const { data } = supabase.storage.from("portraits").getPublicUrl(fileName);
  return data.publicUrl;
}

async function fetchWikiSummary(slug: string): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) {
    console.warn(`  wiki fetch ${res.status} for ${slug}`);
    return null;
  }
  return (await res.json()) as WikiSummary;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`image fetch ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function parseDates(desc: string): { birth: number | null; death: number | null } {
  if (!desc) return { birth: null, death: null };
  const m = desc.match(/(\d{1,4})\s*(BCE?|BC)?\s*[-–]\s*(\d{1,4})?\s*(BCE?|BC|AD|CE)?/i);
  if (!m) return { birth: null, death: null };
  const [, b, bEra, d, dEra] = m;
  const birth = b ? toYear(b, bEra) : null;
  const death = d ? toYear(d, dEra) : null;
  return { birth, death };
}

function toYear(num: string, era?: string): number {
  const n = parseInt(num, 10);
  if (era && /BC/i.test(era)) return -n;
  return n;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const runners: Promise<void>[] = [];
  for (let i = 0; i < limit; i++) {
    runners.push(
      (async () => {
        while (queue.length) {
          const item = queue.shift();
          if (!item) return;
          await worker(item);
        }
      })(),
    );
  }
  await Promise.all(runners);
}
