import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AUTH_ENABLED } from "@/lib/config";

let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-key";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 本地模式（AUTH 关闭）一律用占位客户端，避免误连云端
  if (!AUTH_ENABLED) {
    return createSupabaseClient(PLACEHOLDER_URL, PLACEHOLDER_KEY);
  }

  if (!url || !key) {
    return createSupabaseClient(PLACEHOLDER_URL, PLACEHOLDER_KEY);
  }

  if (typeof window === "undefined") {
    return createSupabaseClient(url, key);
  }
  if (!browserClient) {
    browserClient = createSupabaseClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

export function isCloudEnabled() {
  return (
    AUTH_ENABLED &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
