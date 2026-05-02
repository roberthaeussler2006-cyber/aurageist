import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase";
import { usernameToEmail } from "@/lib/username";

export const dynamic = "force-dynamic";

const Body = z.object({
  username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const username = body.username.toLowerCase();
  const email = usernameToEmail(username);
  const supabase = getServerSupabase();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: body.password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (error) {
    const msg = /already.*registered|exists/i.test(error.message)
      ? "username already taken"
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
