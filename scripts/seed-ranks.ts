import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or a Supabase key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, KEY, { auth: { persistSession: false } });

type Ranks = { fame: number; controversy: number; money: number };

// Editorial ranks for current figures, scored 1-100. These are opinionated
// snapshots, not surveys. Tweak freely.
const RANKS: Record<string, Ranks> = {
  "Donald Trump": { fame: 100, controversy: 100, money: 88 },
  "Joe Biden": { fame: 95, controversy: 78, money: 40 },
  "Barack Obama": { fame: 96, controversy: 55, money: 70 },
  "Hillary Clinton": { fame: 88, controversy: 85, money: 65 },
  "Bernie Sanders": { fame: 75, controversy: 55, money: 30 },
  "Alexandria Ocasio-Cortez": { fame: 78, controversy: 80, money: 25 },
  "Ron DeSantis": { fame: 72, controversy: 78, money: 35 },
  "Marjorie Taylor Greene": { fame: 65, controversy: 90, money: 30 },
  "Mike Pence": { fame: 70, controversy: 50, money: 35 },
  "Sarah Palin": { fame: 60, controversy: 70, money: 30 },
  "Elizabeth Warren": { fame: 62, controversy: 50, money: 40 },
  "Pete Buttigieg": { fame: 55, controversy: 35, money: 25 },
  "Hunter Biden": { fame: 70, controversy: 88, money: 30 },
  "Donald Trump Jr.": { fame: 65, controversy: 75, money: 55 },
  "Ivanka Trump": { fame: 70, controversy: 65, money: 70 },
  "Andrew Cuomo": { fame: 55, controversy: 80, money: 35 },
  "Rudy Giuliani": { fame: 70, controversy: 88, money: 25 },
  "Charlie Kirk": { fame: 50, controversy: 78, money: 30 },
  "Tucker Carlson": { fame: 75, controversy: 88, money: 50 },
  "Ben Shapiro": { fame: 65, controversy: 75, money: 45 },
  "Joe Rogan": { fame: 88, controversy: 70, money: 78 },
  "Andrew Tate": { fame: 75, controversy: 95, money: 60 },
  "Jordan Peterson": { fame: 70, controversy: 75, money: 45 },
  "Robert F. Kennedy Jr.": { fame: 70, controversy: 85, money: 55 },
  "Alex Jones": { fame: 65, controversy: 95, money: 30 },
  "Steve Bannon": { fame: 60, controversy: 88, money: 30 },
  "Anthony Fauci": { fame: 80, controversy: 80, money: 25 },
  "George Soros": { fame: 80, controversy: 90, money: 95 },
  "Kamala Harris": { fame: 88, controversy: 70, money: 35 },
  "Nancy Pelosi": { fame: 80, controversy: 75, money: 70 },
  "Mitch McConnell": { fame: 70, controversy: 70, money: 60 },
  "Xi Jinping": { fame: 92, controversy: 88, money: 80 },
  "Kim Jong Un": { fame: 90, controversy: 95, money: 90 },
  "Narendra Modi": { fame: 88, controversy: 70, money: 50 },
  "Recep Tayyip Erdoğan": { fame: 75, controversy: 80, money: 60 },
  "Benjamin Netanyahu": { fame: 85, controversy: 92, money: 50 },
  "Volodymyr Zelenskyy": { fame: 92, controversy: 50, money: 30 },
  "Emmanuel Macron": { fame: 80, controversy: 65, money: 50 },
  "Angela Merkel": { fame: 78, controversy: 50, money: 35 },
  "Boris Johnson": { fame: 75, controversy: 80, money: 40 },
  "Rishi Sunak": { fame: 60, controversy: 50, money: 88 },
  "Justin Trudeau": { fame: 75, controversy: 70, money: 45 },
  "Jair Bolsonaro": { fame: 70, controversy: 88, money: 30 },
  "Viktor Orbán": { fame: 65, controversy: 82, money: 45 },
  "Marine Le Pen": { fame: 60, controversy: 78, money: 25 },
  "Nigel Farage": { fame: 65, controversy: 78, money: 30 },
  "Mohammed bin Salman": { fame: 78, controversy: 92, money: 99 },
  "Bashar al-Assad": { fame: 75, controversy: 95, money: 60 },
  "Pope Francis": { fame: 90, controversy: 50, money: 30 },
  "Meghan Markle": { fame: 85, controversy: 82, money: 65 },
  "Prince Harry": { fame: 88, controversy: 70, money: 70 },
  "King Charles III": { fame: 92, controversy: 55, money: 95 },
  "Prince William": { fame: 88, controversy: 30, money: 90 },
  "Catherine Princess of Wales": { fame: 85, controversy: 30, money: 75 },
  "Prince Andrew": { fame: 75, controversy: 95, money: 70 },
  "Elon Musk": { fame: 100, controversy: 92, money: 100 },
  "Mark Zuckerberg": { fame: 92, controversy: 80, money: 96 },
  "Jeff Bezos": { fame: 92, controversy: 78, money: 98 },
  "Bill Gates": { fame: 95, controversy: 70, money: 95 },
  "Sam Altman": { fame: 75, controversy: 70, money: 78 },
  "Peter Thiel": { fame: 60, controversy: 80, money: 88 },
  "Tim Cook": { fame: 78, controversy: 35, money: 88 },
  "Jack Dorsey": { fame: 65, controversy: 55, money: 80 },
  "Sam Bankman-Fried": { fame: 70, controversy: 95, money: 25 },
  "LeBron James": { fame: 96, controversy: 50, money: 90 },
  "Cristiano Ronaldo": { fame: 99, controversy: 60, money: 95 },
  "Lionel Messi": { fame: 99, controversy: 25, money: 92 },
  "Tom Brady": { fame: 90, controversy: 45, money: 88 },
  "Conor McGregor": { fame: 82, controversy: 85, money: 80 },
  "Floyd Mayweather Jr.": { fame: 80, controversy: 75, money: 92 },
  "Tiger Woods": { fame: 90, controversy: 70, money: 90 },
  "Serena Williams": { fame: 88, controversy: 40, money: 75 },
  "Stephen Curry": { fame: 85, controversy: 25, money: 85 },
  "Kevin Durant": { fame: 78, controversy: 50, money: 80 },
  "Mike Tyson": { fame: 90, controversy: 80, money: 50 },
  "Lance Armstrong": { fame: 70, controversy: 88, money: 55 },
  "Kanye West": { fame: 95, controversy: 95, money: 70 },
  "Taylor Swift": { fame: 99, controversy: 50, money: 92 },
  "Beyoncé": { fame: 96, controversy: 35, money: 90 },
  "Jay-Z": { fame: 88, controversy: 45, money: 92 },
  "Drake": { fame: 90, controversy: 65, money: 85 },
  "Madonna": { fame: 88, controversy: 60, money: 88 },
  "Oprah Winfrey": { fame: 95, controversy: 35, money: 95 },
  "Ellen DeGeneres": { fame: 85, controversy: 70, money: 88 },
  "Tom Cruise": { fame: 95, controversy: 60, money: 88 },
  "Leonardo DiCaprio": { fame: 92, controversy: 35, money: 78 },
  "Brad Pitt": { fame: 92, controversy: 50, money: 78 },
  "Angelina Jolie": { fame: 90, controversy: 55, money: 75 },
  "Tom Hanks": { fame: 92, controversy: 20, money: 75 },
  "Will Smith": { fame: 92, controversy: 78, money: 80 },
  "Dave Chappelle": { fame: 80, controversy: 70, money: 65 },
  "Chris Rock": { fame: 80, controversy: 55, money: 65 },
  "J.K. Rowling": { fame: 92, controversy: 85, money: 92 },
  "Roman Polanski": { fame: 65, controversy: 95, money: 50 },
  "Woody Allen": { fame: 75, controversy: 88, money: 60 },
  "Russell Brand": { fame: 70, controversy: 88, money: 50 },
  "Kim Kardashian": { fame: 95, controversy: 75, money: 88 },
  "Kylie Jenner": { fame: 88, controversy: 60, money: 85 },
  "Caitlyn Jenner": { fame: 78, controversy: 78, money: 65 },
  "Justin Bieber": { fame: 92, controversy: 65, money: 85 },
  "Rihanna": { fame: 95, controversy: 35, money: 92 },
  "Ariana Grande": { fame: 90, controversy: 40, money: 80 },
  "Eminem": { fame: 92, controversy: 65, money: 85 },
  "Travis Scott": { fame: 80, controversy: 78, money: 75 },
  "Chris Brown": { fame: 78, controversy: 92, money: 60 },
  "Cardi B": { fame: 82, controversy: 70, money: 65 },
  "Nicki Minaj": { fame: 85, controversy: 70, money: 70 },
  "Logan Paul": { fame: 78, controversy: 82, money: 70 },
  "Jake Paul": { fame: 78, controversy: 82, money: 75 },
  "PewDiePie": { fame: 80, controversy: 65, money: 75 },
  "Sean Combs": { fame: 80, controversy: 95, money: 80 },
  "R. Kelly": { fame: 70, controversy: 98, money: 25 },
  "Bill Cosby": { fame: 78, controversy: 95, money: 65 },
  "Harvey Weinstein": { fame: 75, controversy: 99, money: 30 },
  "Jeffrey Epstein": { fame: 90, controversy: 100, money: 80 },
  "Ghislaine Maxwell": { fame: 78, controversy: 98, money: 50 },
  "Larry Nassar": { fame: 60, controversy: 98, money: 5 },
  "O. J. Simpson": { fame: 88, controversy: 95, money: 30 },
  "Greta Thunberg": { fame: 85, controversy: 75, money: 15 },
  "Malala Yousafzai": { fame: 80, controversy: 35, money: 35 },
  "Edward Snowden": { fame: 78, controversy: 85, money: 20 },
  "Julian Assange": { fame: 80, controversy: 90, money: 15 },
};

async function main() {
  const force = process.env.SEED_FORCE === "1";
  const { data: existing, error: fetchErr } = await supabase
    .from("figures")
    .select("name, fame_rank, controversy_rank, money_rank")
    .eq("category", "current");
  if (fetchErr) {
    console.error("Failed to load current figures:", fetchErr.message);
    process.exit(1);
  }

  const byName = new Map(existing?.map((r) => [r.name as string, r]) ?? []);
  let updated = 0;
  let skipped = 0;
  let missingInRanks: string[] = [];
  let missingInDb: string[] = [];

  for (const [name, ranks] of Object.entries(RANKS)) {
    const row = byName.get(name);
    if (!row) {
      missingInDb.push(name);
      continue;
    }
    const alreadyRated = row.fame_rank != null && row.controversy_rank != null && row.money_rank != null;
    if (alreadyRated && !force) {
      skipped++;
      continue;
    }
    const { error } = await supabase
      .from("figures")
      .update({
        fame_rank: ranks.fame,
        controversy_rank: ranks.controversy,
        money_rank: ranks.money,
      })
      .eq("name", name);
    if (error) {
      console.error(`[${name}] update failed:`, error.message);
      continue;
    }
    updated++;
    console.log(`[${name}] fame=${ranks.fame} controversy=${ranks.controversy} money=${ranks.money}`);
  }

  for (const name of byName.keys()) {
    if (!(name in RANKS)) missingInRanks.push(name);
  }

  console.log("\n=== Rank seed summary ===");
  console.log(`  updated: ${updated}`);
  console.log(`  skipped (already rated): ${skipped}`);
  if (missingInDb.length) {
    console.log(`\n  in RANKS map but missing from DB (${missingInDb.length}):`);
    for (const n of missingInDb) console.log(`    - ${n}`);
  }
  if (missingInRanks.length) {
    console.log(`\n  in DB but missing from RANKS map (${missingInRanks.length}):`);
    for (const n of missingInRanks) console.log(`    - ${n}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
