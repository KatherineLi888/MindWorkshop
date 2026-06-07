import { createClient, isCloudEnabled } from "./client";

/** 云端模式下获取当前登录用户 ID；本地模式返回 "local" */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isCloudEnabled()) return "local";
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
