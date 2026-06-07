import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  parseAuthCookieValue,
  readAuthCookieFromList,
} from "@/lib/supabase/auth-cookie";

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("请配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { url, key };
}

export async function createClient() {
  const { url, key } = getEnv();
  const cookieStore = await cookies();
  const supabase = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const raw = readAuthCookieFromList(cookieStore.getAll());
  if (raw) {
    const tokens = parseAuthCookieValue(raw);
    if (tokens) {
      await supabase.auth.setSession(tokens);
    }
  }
  return supabase;
}
