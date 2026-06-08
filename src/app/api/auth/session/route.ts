import { NextResponse } from "next/server";
import {
  attachSessionCookies,
  SESSION_COOKIE_OPTS,
} from "@/lib/auth/session-cookies-server";
import { getAuthCookieName } from "@/lib/supabase/auth-cookie";
import type { Session } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = await request.json();
  const access_token = body.access_token as string | undefined;
  const refresh_token = body.refresh_token as string | undefined;

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "缺少 token" }, { status: 400 });
  }

  const session = {
    access_token,
    refresh_token,
    expires_at: body.expires_at ?? null,
    expires_in: body.expires_in ?? 3600,
    token_type: "bearer",
    user: null,
  } as Session;

  return attachSessionCookies(NextResponse.json({ ok: true }), session);
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const name = getAuthCookieName();
  response.cookies.set(name, "", { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`${name}.${i}`, "", { ...SESSION_COOKIE_OPTS, maxAge: 0 });
  }
  return response;
}
