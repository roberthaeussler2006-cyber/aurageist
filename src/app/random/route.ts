import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = getServerSupabase();
  const { count } = await supabase.from("figures").select("id", { count: "exact", head: true });
  const total = count ?? 0;
  const base = new URL(req.url);
  if (total === 0) {
    return NextResponse.redirect(new URL("/", base));
  }
  const offset = Math.floor(Math.random() * total);
  const { data } = await supabase
    .from("figures")
    .select("wiki_slug")
    .order("name", { ascending: true })
    .range(offset, offset)
    .single();
  if (!data) {
    return NextResponse.redirect(new URL("/", base));
  }
  return NextResponse.redirect(new URL(`/figure/${data.wiki_slug}`, base));
}
