"use client";

import type { ReactNode } from "react";
import {
  ALL_KPI_KEYS,
  KPI_META,
  WIDGET_META,
  type KpiKey,
  type WidgetEntry,
  type WidgetId,
  type WidgetStyle,
} from "@/lib/stats/dashboard-config";

type Props = {
  entry: WidgetEntry;
  editing: boolean;
  onPatch: (patch: Partial<WidgetEntry>) => void;
  onRemove: () => void;
  onAdd: () => void;
  children: ReactNode;
};

export function WidgetEditFrame({
  entry,
  editing,
  onPatch,
  onRemove,
  onAdd,
  children,
}: Props) {
  const meta = WIDGET_META[entry.id];

  if (!editing) {
    return <>{children}</>;
  }

  if (!entry.enabled) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="flex min-h-[5rem] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC]/80 px-4 py-6 text-center transition hover:border-[#3B82F6]/50 hover:bg-blue-50/30"
      >
        <span className="text-2xl text-slate-300">+</span>
        <span className="mt-1 text-sm font-medium text-slate-600">
          添加「{meta.label}」
        </span>
        <span className="mt-0.5 text-[10px] text-slate-400">{meta.module}</span>
      </button>
    );
  }

  const kpiKeys = entry.kpiKeys ?? ALL_KPI_KEYS;

  const toggleKpi = (key: KpiKey) => {
    const next = kpiKeys.includes(key)
      ? kpiKeys.filter((k) => k !== key)
      : [...kpiKeys, key];
    onPatch({ kpiKeys: next, enabled: next.length > 0 });
  };

  return (
    <div className="widget-edit-jiggle relative rounded-xl ring-2 ring-[#3B82F6]/40 ring-offset-2 ring-offset-white">
      <div className="flex flex-wrap items-center gap-1.5 rounded-t-xl border border-b-0 border-[#BFDBFE] bg-[#EFF6FF] px-2 py-1.5">
        <span className="shrink-0 text-[10px] font-semibold text-[#1D4ED8]">
          {meta.label}
        </span>
        <span className="text-[10px] text-slate-400">·</span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {meta.styles.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPatch({ style: s.id as WidgetStyle })}
              className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                entry.style === s.id
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white text-slate-600 ring-1 ring-[#E2E8F0] hover:ring-[#93C5FD]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-sm text-red-500 ring-1 ring-red-200 hover:bg-red-50"
          title="移除此组件"
        >
          ×
        </button>
      </div>

      {entry.id === "kpi" && (
        <div className="flex flex-wrap gap-1 border-x border-[#BFDBFE] bg-[#F8FAFC] px-2 py-1.5">
          {ALL_KPI_KEYS.map((key) => {
            const on = kpiKeys.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleKpi(key)}
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  on
                    ? "bg-[#EEF2FF] font-medium text-[#4338CA]"
                    : "bg-white text-slate-400 ring-1 ring-[#E2E8F0]"
                }`}
              >
                {KPI_META[key].icon} {KPI_META[key].label}
              </button>
            );
          })}
        </div>
      )}

      <div className="rounded-b-xl border border-t-0 border-[#BFDBFE] bg-white/50">
        {children}
      </div>
    </div>
  );
}
