import { createClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

type Row = { name: string; wiki_slug: string };

type WikiSummary = {
  extract?: string;
  description?: string;
  originalimage?: { source: string };
  thumbnail?: { source: string };
};

const CSV_PATH = join(process.cwd(), "data", "figures.csv");
const CONCURRENCY = 5;
const USER_AGENT = "Aurageist/1.0 (https://github.com; seed script) Node.js";

const rows = parseCsv();
console.log(`Loaded ${rows.length} figures from CSV.`);

const summary = { ok: 0, skipped: 0, errored: 0 };
const skippedNames: string[] = [];
const erroredNames: string[] = [];

await runWithConcurrency(rows, CONCURRENCY, processOne);

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

    const imageSrc = wiki.originalimage?.source ?? wiki.thumbnail?.source;
    if (!imageSrc) {
      console.warn(`[${row.name}] no image, skipping`);
      summary.skipped++;
      skippedNames.push(row.name);
      return;
    }

    const buffer = await downloadImage(imageSrc);
    const fileName = `${row.wiki_slug}.jpg`;
    const upload = await supabase.storage.from("portraits").upload(fileName, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (upload.error) throw upload.error;

    const { data: urlData } = supabase.storage.from("portraits").getPublicUrl(fileName);
    const blurb = wiki.extract?.slice(0, 200) ?? null;
    const { birth, death } = parseDates(wiki.description ?? "");

    const { error } = await supabase
      .from("figures")
      .upsert(
        {
          name: row.name,
          wiki_slug: row.wiki_slug,
          image_url: urlData.publicUrl,
          short_blurb: blurb,
          birth_year: birth,
          death_year: death,
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

// Pulls leading/trailing year ranges out of Wikipedia's short description text,
// e.g. "Roman emperor (63 BC - AD 14)" -> { birth: -63, death: 14 }. Best effort
// only — leaves nulls when the description doesn't contain a parseable range.
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
