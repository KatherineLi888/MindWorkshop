import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { AUTH_ENABLED } from "@/lib/config";

let browserClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!AUTH_ENABLED || !url || !key) {
    return createSupabaseClient(
      url || "https://placeholder.supabase.co",
      key || "placeholder-key"
    );
  }

  if (typeof window === "undefined") {
    return createSupabaseClient(url, key);
  }
  if (!browserClient) {
    browserClient = createSupabaseClient(url, key);
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
