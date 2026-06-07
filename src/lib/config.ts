/**
 * 是否启用登录与 Supabase 云端同步。
 * 在 .env.local 中设置 NEXT_PUBLIC_AUTH_ENABLED=true 并配置 Supabase 变量后生效。
 */
export const AUTH_ENABLED =
  process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
