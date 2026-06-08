import { NextResponse } from "next/server";
import {
  getAuthCookieName,
  sessionToCookieValue,
} from "@/lib/supabase/auth-cookie";
import type { Session } from "@supabase/supabase-js";

export const SESSION_COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 400,
};

/** 将 Supabase 会话写入 httpOnly Cookie（登录、回调、刷新共用） */
export function attachSessionCookies(
  response: NextResponse,
  session: Session
): NextResponse {
  const name = getAuthCookieName();
  const value = sessionToCookieValue(session);

  if (value.length > 3800) {
    const chunkSize = 3800;
    for (let i = 0; i < value.length; i += chunkSize) {
      response.cookies.set(
        `${name}.${i / chunkSize}`,
        value.slice(i, i + chunkSize),
        SESSION_COOKIE_OPTS
      );
    }
  } else {
    response.cookies.set(name, value, SESSION_COOKIE_OPTS);
  }
  return response;
}
