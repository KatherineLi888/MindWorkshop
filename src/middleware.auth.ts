import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import {
  parseAuthCookieValue,
  readAuthCookieFromList,
} from "@/lib/supabase/auth-cookie";

const PUBLIC = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/auth",
];

async function getUserFromRequest(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const raw = readAuthCookieFromList(request.cookies.getAll());
  if (!raw) return null;

  const tokens = parseAuthCookieValue(raw);
  if (!tokens) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.setSession(tokens);
  if (error || !data.user) return null;
  return data.user;
}

export default async function authMiddleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublic =
    PUBLIC.some((p) => path.startsWith(p)) || path.startsWith("/api/auth");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!isPublic && path !== "/") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const user = await getUserFromRequest(request);

  if (!user && !isPublic && path !== "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (path === "/login" || path === "/register")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/decisions";
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}
