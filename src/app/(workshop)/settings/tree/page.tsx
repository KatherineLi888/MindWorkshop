"use client";

import Link from "next/link";
import { ThinkingTreePrefsPanel } from "@/components/thinking/ThinkingTreePrefsPanel";

export default function TreeSettingsPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 lg:p-6">
      <Link
        href="/settings"
        className="inline-block text-xs text-[var(--primary)] hover:underline"
      >
        ← 返回设置
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-slate-900">纵向导图 · 节点样式</h1>
        <p className="mt-1 text-xs text-slate-500">
          调整问题/回答配色、节点宽高、内外边距与分支间距；保存后对思考页「纵向导图」生效。
        </p>
      </div>

      <ThinkingTreePrefsPanel />
    </div>
  );
}
