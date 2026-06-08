"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TIME_RANGE_LABELS,
  type TimeRange,
} from "@/lib/stats/dashboard-config";
import { addCustomView, type DashboardViewsStore } from "@/lib/stats/dashboard-views";

type Props = {
  store: DashboardViewsStore;
  onSave: (store: DashboardViewsStore) => void;
  onClose: () => void;
};

export function AddDashboardViewDialog({ store, onSave, onClose }: Props) {
  const [label, setLabel] = useState("");
  const [preset, setPreset] = useState<TimeRange>("week");

  const submit = () => {
    if (!label.trim()) return;
    onSave(
      addCustomView(store, {
        label: label.trim(),
        timePreset: preset,
      })
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-slate-800">新增视图</h3>
        <p className="mt-1 text-[11px] text-slate-500">
          添加与「当日/本周/本月/全部」同级的独立标签页
        </p>

        <label className="mt-3 block text-xs text-slate-600">
          视图名称
          <Input
            className="mt-1"
            placeholder="如：Q2 复盘"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <p className="mt-3 text-xs font-medium text-slate-600">数据范围</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {(["today", "week", "month", "all"] as TimeRange[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setPreset(r)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] transition ${
                preset === r
                  ? "bg-[#3B82F6] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {TIME_RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" size="sm" onClick={submit}>
            创建并切换
          </Button>
        </div>
      </div>
    </div>
  );
}
