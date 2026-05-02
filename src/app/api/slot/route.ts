import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("figures")
    .select("name, image_url")
    .not("image_url", "is", null)
    .limit(80);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    { figures: data ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
