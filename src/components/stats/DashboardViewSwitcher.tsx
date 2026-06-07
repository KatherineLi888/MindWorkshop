"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TIME_RANGE_LABELS,
  type TimeRange,
} from "@/lib/stats/dashboard-config";
import {
  addCustomView,
  removeCustomView,
  type DashboardView,
  type DashboardViewsStore,
  viewTimeLabel,
} from "@/lib/stats/dashboard-views";

type Props = {
  store: DashboardViewsStore;
  disabled?: boolean;
  onChange: (store: DashboardViewsStore) => void;
};

export function DashboardViewSwitcher({
  store,
  disabled,
  onChange,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [preset, setPreset] = useState<TimeRange>("custom");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  const openAdd = () => {
    setLabel("");
    setPreset("custom");
    setTimeFrom("");
    setTimeTo("");
    setAddOpen(true);
  };

  const submitAdd = () => {
    if (!label.trim()) return;
    if (preset === "custom" && (!timeFrom || !timeTo)) return;
    const next = addCustomView(store, {
      label: label.trim(),
      timePreset: preset,
      timeFrom: preset === "custom" ? timeFrom : undefined,
      timeTo: preset === "custom" ? timeTo : undefined,
    });
    onChange(next);
    setAddOpen(false);
  };

  const removeView = (view: DashboardView) => {
    if (view.builtin) return;
    if (!confirm(`删除视图「${view.label}」？`)) return;
    onChange(removeCustomView(store, view.id));
  };

  return (
    <>
      <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white p-1">
        {store.views.map((view) => {
          const active = view.id === store.activeViewId;
          return (
            <div key={view.id} className="flex shrink-0 items-center">
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({ ...store, activeViewId: view.id })
                }
                className={`rounded-lg px-2.5 py-1.5 text-left transition ${
                  active
                    ? "bg-[#3B82F6] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                } ${disabled ? "opacity-60" : ""}`}
                title={view.description ?? viewTimeLabel(view)}
              >
                <span className="block text-[11px] font-medium leading-tight">
                  {view.label}
                </span>
                <span
                  className={`block text-[9px] leading-tight ${
                    active ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {viewTimeLabel(view)}
                </span>
              </button>
              {!view.builtin && !disabled && (
                <button
                  type="button"
                  onClick={() => removeView(view)}
                  className="ml-0.5 rounded px-1 text-[10px] text-slate-300 hover:bg-red-50 hover:text-red-500"
                  title="删除视图"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {!disabled && (
          <button
            type="button"
            onClick={openAdd}
            className="shrink-0 rounded-lg border border-dashed border-[#CBD5E1] px-2 py-1.5 text-[11px] text-slate-500 hover:border-[#3B82F6] hover:text-[#3B82F6]"
          >
            + 自定义
          </button>
        )}
      </div>

      {addOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold">新建自定义视图</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              例如「Y2 计划周期」—— 会复制当前视图的组件布局，并套用新的时间范围
            </p>

            <label className="mt-3 block text-xs text-slate-600">
              视图名称
              <Input
                className="mt-1"
                placeholder="如：Y2 仪表盘"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>

            <p className="mt-3 text-xs font-medium text-slate-600">时间范围</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {(
                ["today", "week", "month", "7d", "custom"] as TimeRange[]
              ).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPreset(r)}
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    preset === r
                      ? "bg-[#3B82F6] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {TIME_RANGE_LABELS[r]}
                </button>
              ))}
            </div>

            {preset === "custom" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] text-slate-500">
                  起始
                  <Input
                    type="date"
                    className="mt-0.5"
                    value={timeFrom}
                    onChange={(e) => setTimeFrom(e.target.value)}
                  />
                </label>
                <label className="text-[10px] text-slate-500">
                  结束
                  <Input
                    type="date"
                    className="mt-0.5"
                    value={timeTo}
                    onChange={(e) => setTimeTo(e.target.value)}
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
                取消
              </Button>
              <Button variant="primary" size="sm" onClick={submitAdd}>
                创建并切换
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
