import type { Session } from "@supabase/supabase-js";

export function getSupabaseProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? "project";
}

export function getAuthCookieName(): string {
  return `sb-${getSupabaseProjectRef()}-auth-token`;
}

/** 与 Supabase 默认 localStorage 结构一致，供中间件读取 */
export function sessionToCookieValue(session: Session): string {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });
}

export function parseAuthCookieValue(
  value: string
): { access_token: string; refresh_token: string } | null {
  try {
    const decoded = value.startsWith("%") ? decodeURIComponent(value) : value;
    const parsed = JSON.parse(decoded) as {
      access_token?: string;
      refresh_token?: string;
    };
    if (parsed.access_token && parsed.refresh_token) {
      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** 从请求 Cookie 列表读取（支持分块 sb-xxx-auth-token.0） */
export function readAuthCookieFromList(
  cookies: { name: string; value: string }[]
): string | null {
  const name = getAuthCookieName();
  const single = cookies.find((c) => c.name === name);
  if (single?.value) return single.value;

  const chunks = cookies
    .filter((c) => c.name.startsWith(`${name}.`))
    .sort((a, b) => {
      const ai = Number(a.name.split(".").pop() ?? 0);
      const bi = Number(b.name.split(".").pop() ?? 0);
      return ai - bi;
    });
  if (chunks.length === 0) return null;
  return chunks.map((c) => c.value).join("");
}
