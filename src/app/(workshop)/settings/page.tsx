"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/app/canvas/ConfirmDialog";
import { AUTH_ENABLED } from "@/lib/config";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { restoreThoughtSession } from "@/lib/thinking/storage";
import {
  getTrashRetentionDays,
  loadRecentlyDeleted,
  permanentlyDeleteFromTrash,
  type TrashItem,
} from "@/lib/trash/storage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeSettingsPreview } from "@/components/theme/ThemeSettingsPreview";
import { TreeSettingsPreview } from "@/components/thinking/TreeSettingsPreview";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null);

  const refreshTrash = () => setTrash(loadRecentlyDeleted());

  useEffect(() => {
    refreshTrash();
    if (!isCloudEnabled()) {
      const local = loadLocal<{ openai_api_key?: string }>(LOCAL_KEYS.settings, {});
      if (local.openai_api_key) setApiKey(local.openai_api_key);
      return;
    }
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? "");
        const { data } = await supabase
          .from("user_settings")
          .select("openai_api_key")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.openai_api_key) setApiKey(data.openai_api_key);
      }
    })();
  }, []);

  const save = async () => {
    if (!isCloudEnabled()) {
      saveLocal(LOCAL_KEYS.settings, { openai_api_key: apiKey });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      openai_api_key: apiKey,
      updated_at: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    if (!AUTH_ENABLED) return;
    const { clearSessionCookies } = await import("@/lib/auth/sync-session");
    const supabase = createClient();
    await supabase.auth.signOut();
    await clearSessionCookies();
    router.push("/login");
    router.refresh();
  };

  const handleRestore = (item: TrashItem) => {
    if (item.kind === "thinking_session") {
      restoreThoughtSession(item.data);
    }
    permanentlyDeleteFromTrash(item.id);
    refreshTrash();
  };

  const handlePurge = () => {
    if (!purgeTarget) return;
    permanentlyDeleteFromTrash(purgeTarget.id);
    setPurgeTarget(null);
    refreshTrash();
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 lg:p-6">
      <h1 className="text-lg font-semibold">设置</h1>

      <ThemeSettingsPreview />
      <TreeSettingsPreview />

      <Card className="bg-[var(--background)]">
        <h2 className="text-sm font-medium text-slate-800">账号管理</h2>
        {!AUTH_ENABLED ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-500">
              当前为本地模式，数据保存在本浏览器。登录与云端同步稍后开放。
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/login">
                <Button size="sm" variant="secondary">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" variant="ghost">
                  注册账号
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {email && (
              <p className="text-sm text-slate-700">
                <span className="text-xs text-slate-400">当前账号 · </span>
                {email}
              </p>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              退出登录
            </Button>
          </div>
        )}
      </Card>

      {!AUTH_ENABLED && (
        <Card className="border-[#F59E0B]/30 bg-amber-50/40">
          <p className="text-sm text-[#1E293B]">本地模式提示</p>
          <p className="mt-1 text-xs text-slate-500">
            需要云端同步时，可在{" "}
            <code className="text-[10px]">src/lib/config.ts</code> 将{" "}
            <code className="text-[10px]">AUTH_ENABLED</code> 设为 true。
          </p>
        </Card>
      )}

      <Card className="bg-[var(--background)]">
        <h2 className="text-sm font-medium text-slate-800">最近删除</h2>
        <p className="mt-1 text-[10px] text-slate-400">
          删除的内容保留 {getTrashRetentionDays()} 天，过期后自动清除
        </p>
        <ul className="mt-3 space-y-2">
          {trash.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700">
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  思考 · 删除于 {formatDate(item.deletedAt)} · 至{" "}
                  {formatDate(item.expiresAt)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRestore(item)}
                >
                  恢复
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPurgeTarget(item)}
                >
                  永久删除
                </Button>
              </div>
            </li>
          ))}
          {trash.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">
              暂无最近删除的内容
            </p>
          )}
        </ul>
      </Card>

      <Card className="bg-[var(--background)]">
        <label className="text-xs text-slate-500">OpenAI API Key（可选）</label>
        <p className="mb-2 text-[10px] text-slate-400">用于右下角 AI 助手</p>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
        <Button className="mt-3" variant="primary" size="sm" onClick={save}>
          保存
        </Button>
        {saved && <p className="mt-2 text-xs text-green-600">已保存</p>}
      </Card>

      <ConfirmDialog
        open={!!purgeTarget}
        title="永久删除"
        message={
          purgeTarget
            ? `确定永久删除「${purgeTarget.title}」吗？此操作不可恢复。`
            : ""
        }
        confirmLabel="永久删除"
        danger
        onConfirm={handlePurge}
        onCancel={() => setPurgeTarget(null)}
      />
    </div>
  );
}
