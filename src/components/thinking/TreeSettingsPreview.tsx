"use client";

import Link from "next/link";

/** 设置首页：纵向导图样式预览入口 */
export function TreeSettingsPreview() {
  return (
    <Link
      href="/settings/tree"
      className="group block rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition hover:border-[var(--primary)]/35 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-slate-800">
            纵向导图 · 节点样式
          </h2>
          <p className="mt-0.5 text-[10px] text-slate-400">
            问题/回答配色、字号宽度、分支间距
          </p>
        </div>
        <span className="shrink-0 text-slate-300 transition group-hover:text-[var(--primary)]">
          ›
        </span>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border)] bg-[#F3F4F6] p-3">
        <div className="flex items-start gap-2 text-[11px]">
          <span className="rounded border border-sky-300 bg-sky-300 px-1 py-px text-[8px] font-semibold text-sky-900">
            问题
          </span>
          <span className="text-black">示例问题节点…</span>
        </div>
        <div className="my-1.5 h-px bg-slate-500" />
        <div className="flex items-start gap-2 text-[11px]">
          <span className="rounded border border-lime-400 bg-lime-400 px-1 py-px text-[8px] font-semibold text-lime-900">
            回答
          </span>
          <span className="text-black/60">回答区域</span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-400">点击进入详细调整</p>
    </Link>
  );
}
