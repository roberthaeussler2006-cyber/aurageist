import { NextResponse } from "next/server";
import { z } from "zod";
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const username = body.username.toLowerCase();
  const email = usernameToEmail(username);

  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: body.password,
      email_confirm: true,
      user_metadata: { username },
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { msg?: string; message?: string; error?: string };
    const raw = data.msg ?? data.message ?? data.error ?? `signup failed (${res.status})`;
    const msg = /already.*registered|already.*exists|duplicate/i.test(raw)
      ? "username already taken"
      : raw;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
