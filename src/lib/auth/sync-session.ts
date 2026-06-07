import type { Session } from "@supabase/supabase-js";

/** 登录/注册成功后写入 Cookie，供 middleware 识别已登录 */
export async function syncSessionToCookies(session: Session): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      (data as { error?: string }).error ?? "会话同步失败，请重试"
    );
  }
}

export async function clearSessionCookies(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin" });
}
