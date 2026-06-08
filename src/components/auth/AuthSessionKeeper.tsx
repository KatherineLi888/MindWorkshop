"use client";

import { useEffect } from "react";
import { AUTH_ENABLED } from "@/lib/config";
import { syncSessionToCookies } from "@/lib/auth/sync-session";
import { createClient } from "@/lib/supabase/client";

/**
 * 保持登录态：浏览器端自动刷新 Token，并同步到 httpOnly Cookie。
 * 同一设备再次打开应用时，只要 Cookie/刷新令牌有效即可保持登录。
 */
export function AuthSessionKeeper() {
  useEffect(() => {
    if (!AUTH_ENABLED) return;
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) void syncSessionToCookies(session).catch(() => {});
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session &&
        (event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "INITIAL_SESSION")
      ) {
        void syncSessionToCookies(session).catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
