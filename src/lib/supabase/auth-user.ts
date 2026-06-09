import { createClient, isCloudEnabled } from "@/lib/supabase/client";

/** 云端写入前获取当前用户 id；失败时抛出可读错误，不静默返回 null */
export async function requireCloudUserId(): Promise<string> {
  if (!isCloudEnabled()) return "local";

  const supabase = createClient();

  let {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    await supabase.auth.refreshSession();
    ({
      data: { session },
    } = await supabase.auth.getSession());
  }

  if (session?.user?.id) return session.user.id;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`登录状态异常：${error.message}`);
  }
  if (!user) {
    throw new Error("未检测到登录会话，请刷新页面或重新登录后再保存");
  }
  return user.id;
}
