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
};

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

  // Skip rows that already exist with an image — avoids re-hammering Wikipedia
  // on retries after a rate-limit. Run with SEED_FORCE=1 to re-fetch all.
  const force = process.env.SEED_FORCE === "1";
  let toProcess = rows;
  if (!force) {
    const { data: existing } = await supabase.from("figures").select("name").not("image_url", "is", null);
    const have = new Set((existing ?? []).map((r) => r.name));
    toProcess = rows.filter((r) => !have.has(r.name));
    console.log(`Skipping ${rows.length - toProcess.length} already-seeded figures; will fetch ${toProcess.length}.`);
  }

  await runWithConcurrency(toProcess, CONCURRENCY, processOne);

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

async function processOne(row: Row): Promise<void> {
  try {
    const wiki = await fetchWikiSummary(row.wiki_slug);
    if (!wiki) {
      console.warn(`[${row.name}] no wiki summary, skipping`);
      summary.skipped++;
      skippedNames.push(row.name);
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
        },
        { onConflict: "name" },
      );
    if (error) throw error;

    summary.ok++;
    console.log(`[${row.name}] ok`);
  } catch (e) {
    summary.errored++;
    erroredNames.push(row.name);
    console.error(`[${row.name}] error:`, e instanceof Error ? e.message : e);
  }
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
