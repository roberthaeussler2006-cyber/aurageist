import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

// Server-side client. Prefers SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), but
// falls back to the anon key when only that is configured. Both work today
// because the figures/matches tables ship without RLS; switch to the service
// role key the moment you turn RLS on.
export function getServerSupabase(): SupabaseClient {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }
  serverClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  return serverClient;
}

let publicClient: SupabaseClient | null = null;

export function getPublicSupabase(): SupabaseClient {
  if (publicClient) return publicClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Missing Supabase public env vars");
  }
  publicClient = createClient(url, anon, { auth: { persistSession: false } });
  return publicClient;
}
