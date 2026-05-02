# Aurageist

Vote between two historical figures. Whoever has more aura wins. The leaderboard updates with Elo.

Stack: Next.js (App Router, TypeScript), Tailwind, Supabase, Framer Motion. Deploys on Vercel.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) and grab the project URL, anon key, and service role key from the API settings.

2. **Run the schema.** Open the Supabase SQL editor and paste the contents of `supabase/schema.sql`. Execute it. This creates the `figures` and `matches` tables, indexes, and the public `portraits` storage bucket.

3. **Configure env.** Copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (server-side only, never exposed to the client)
   - `MATCHUP_SECRET` — any random string used to sign matchup tokens (e.g. `openssl rand -hex 32`)

4. **Install and seed.**

   ```bash
   npm install
   npm run seed
   ```

   The seed script reads `data/figures.csv`, fetches each figure's Wikipedia summary and image, uploads images to the `portraits` bucket, and inserts rows into `figures`. Takes a few minutes. Idempotent (upserts on `name`).

5. **Run dev.**

   ```bash
   npm run dev
   ```

## Deploy

Push to GitHub, import on Vercel, and add the same env vars in the Vercel dashboard.

## Notes

- Rate limiting on `/api/vote` is in-memory (fine for a single-instance deploy at small scale; swap to Redis/Upstash for production scale).
- Matchup tokens are HMAC-signed and expire in 5 minutes, so clients can't vote on arbitrary pairs.
- Portrait images are sourced from Wikipedia and uploaded to Supabase Storage on seed. Wikipedia attribution applies; see `data/figures.csv` for the source slugs.
