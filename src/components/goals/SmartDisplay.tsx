"use client";

import { useState } from "react";
import { SMART_FIELD_LABELS } from "@/lib/goals/types";
import type { SmartFields } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  smart: SmartFields;
  title?: string;
  compact?: boolean;
  /** 默认折叠，只显示一行摘要 */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
};

export function SmartDisplay({
  smart,
  title,
  compact,
  collapsible = false,
  defaultCollapsed = true,
}: Props) {
  const [open, setOpen] = useState(!defaultCollapsed);

  const summary =
    smart.specific?.trim().slice(0, 72) ||
    smart.measurable?.trim().slice(0, 72) ||
    "未填写 SMART";

  if (collapsible && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2 text-left transition hover:bg-white"
      >
        <span className="min-w-0 truncate text-xs text-slate-600">
          <span className="font-medium text-slate-500">SMART · </span>
          {summary}
          {(smart.specific?.length ?? 0) > 72 ? "…" : ""}
        </span>
        <span className="shrink-0 text-[10px] text-[#3B82F6]">展开</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {(title || collapsible) && (
        <div className="flex items-center justify-between gap-2">
          {title && (
            <h3 className="text-sm font-medium text-slate-800">{title}</h3>
          )}
          {collapsible && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              收起
            </button>
          )}
        </div>
      )}
      <div
        className={cn(
          compact ? "space-y-1.5" : "space-y-1.5",
          collapsible && "rounded-lg border border-[#E8ECF0] bg-[#FAFBFC] p-2"
        )}
      >
        {SMART_FIELD_LABELS.map((f) => {
          const text = smart[f.key]?.trim();
          if (compact && !text) return null;
          return (
            <div
              key={f.key}
              className="flex gap-2 rounded-md px-1 py-0.5 text-xs leading-relaxed"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#EEF2FF] text-[9px] font-semibold text-[#4F46E5]">
                {f.short}
              </span>
              <p className="min-w-0 flex-1 text-slate-700">
                {text || <span className="text-slate-400">未填写</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
