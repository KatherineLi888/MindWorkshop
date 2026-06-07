"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { KeyResult } from "@/lib/goals/types";
import { KR_RECORD_MODE_LABELS, unitLabel } from "@/lib/goals/kr-progress";
import { cn } from "@/lib/utils";

type Props = {
  kr: KeyResult;
  open: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
};

export function KrRecordDialog({ kr, open, onClose, onSubmit }: Props) {
  const [value, setValue] = useState("");
  const unit = unitLabel(kr);
  const meta = KR_RECORD_MODE_LABELS[kr.recordMode];

  if (!open) return null;

  const handleSubmit = () => {
    const n = Number(value);
    if (Number.isNaN(n)) return;
    onSubmit(n);
    setValue("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-black/30 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-slate-900">新增记录</h3>
        <p className="mt-0.5 truncate text-xs text-slate-500">{kr.title || "未命名 KR"}</p>
        <p className="mt-2 text-[10px] text-slate-400">{meta.hint}</p>

        {kr.recordMode === "count" || kr.recordMode === "consume" ? (
          <div className="mt-4 space-y-3">
            <p className="text-center text-sm text-slate-600">
              {kr.recordMode === "consume"
                ? `确认消耗 1${unit}？（当前 ${kr.current}/${kr.target}）`
                : `确认完成 1 次？（当前 ${kr.current}/${kr.target}${unit}）`}
            </p>
            {kr.allowExceed && kr.target > 0 && kr.current >= kr.target && (
              <p className="text-center text-[10px] text-fuchsia-600">
                已超出目标，仍可继续打卡
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={
                  kr.target > 0 && kr.current >= kr.target && !kr.allowExceed
                }
                onClick={() => onSubmit(1)}
              >
                +1 {unit}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-xs text-slate-600">
              {kr.recordMode === "set"
                ? kr.valueDirection === "down"
                  ? `当前${unit ? `（${unit}）` : ""}数值`
                  : `当前${unit ? `（${unit}）` : ""}数值`
                : `本次${unit ? `（${unit}）` : ""}数量`}
              <Input
                type="number"
                step="any"
                className="mt-1"
                autoFocus
                placeholder={
                  kr.recordMode === "accumulate" ? "如 5.12" : "输入数值"
                }
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                取消
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={value.trim() === ""}
                onClick={handleSubmit}
              >
                确认记录
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
