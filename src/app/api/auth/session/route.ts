import { NextResponse } from "next/server";
import {
  getAuthCookieName,
  sessionToCookieValue,
} from "@/lib/supabase/auth-cookie";
import type { Session } from "@supabase/supabase-js";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 400,
};

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

  const response = NextResponse.json({ ok: true });
  const name = getAuthCookieName();
  const value = sessionToCookieValue(session);

  if (value.length > 3800) {
    const chunkSize = 3800;
    for (let i = 0; i < value.length; i += chunkSize) {
      response.cookies.set(`${name}.${i / chunkSize}`, value.slice(i, i + chunkSize), COOKIE_OPTS);
    }
  } else {
    response.cookies.set(name, value, COOKIE_OPTS);
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  const name = getAuthCookieName();
  response.cookies.set(name, "", { ...COOKIE_OPTS, maxAge: 0 });
  for (let i = 0; i < 10; i++) {
    response.cookies.set(`${name}.${i}`, "", { ...COOKIE_OPTS, maxAge: 0 });
  }
  return response;
}
