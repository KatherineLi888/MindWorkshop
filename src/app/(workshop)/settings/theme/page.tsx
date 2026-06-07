"use client";

import Link from "next/link";
import { ThemePrefsPanel } from "@/components/theme/ThemePrefsPanel";

export default function ThemeSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 lg:p-6">
      <Link
        href="/settings"
        className="inline-block text-xs text-[var(--primary)] hover:underline"
      >
        ← 返回设置
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-slate-900">主题色</h1>
        <p className="mt-1 text-xs text-slate-500">
          选择预设或自定义颜色，保存后对导航、按钮、输入框等生效。
        </p>
      </div>

      <ThemePrefsPanel />
    </div>
  );
}
