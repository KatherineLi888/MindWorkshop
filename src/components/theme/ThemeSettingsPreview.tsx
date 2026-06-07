"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WORKSHOP_THEME_CHANGED,
  getThemePresetLabel,
  loadWorkshopTheme,
  type WorkshopThemePrefs,
} from "@/lib/theme/workshop-theme";
import { cn } from "@/lib/utils";

/** 设置首页：主题色预览入口 */
export function ThemeSettingsPreview() {
  const [prefs, setPrefs] = useState<WorkshopThemePrefs | null>(null);

  useEffect(() => {
    setPrefs(loadWorkshopTheme());
    const refresh = () => setPrefs(loadWorkshopTheme());
    window.addEventListener(WORKSHOP_THEME_CHANGED, refresh);
    return () => window.removeEventListener(WORKSHOP_THEME_CHANGED, refresh);
  }, []);

  if (!prefs) return null;

  const label = getThemePresetLabel(prefs.presetId);

  return (
    <Link
      href="/settings/theme"
      className={cn(
        "group block rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition",
        "hover:border-[var(--primary)]/35 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-slate-800">外观 · 主题色</h2>
          <p className="mt-0.5 text-[10px] text-slate-400">
            当前：{label}
            {prefs.presetId === "custom" && " · 已自定义"}
          </p>
        </div>
        <span className="shrink-0 text-slate-300 transition group-hover:text-[var(--primary)]">
          ›
        </span>
      </div>

      <div
        className="mt-3 flex items-center gap-3 rounded-lg border border-[var(--border)] p-3"
        style={{ background: prefs.surface }}
      >
        <div className="flex -space-x-1">
          <span
            className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
            style={{ background: prefs.primary }}
            title="主题色"
          />
          <span
            className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
            style={{ background: prefs.accent }}
            title="强调色"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span
            className="rounded-md px-2 py-1 text-[10px] text-white"
            style={{ background: prefs.primary }}
          >
            按钮
          </span>
          <span
            className="rounded-md border px-2 py-1 text-[10px]"
            style={{
              borderColor: prefs.border,
              color: prefs.primary,
              background: prefs.background,
            }}
          >
            导航
          </span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">点击进入切换预设或自定义颜色</p>
    </Link>
  );
}
