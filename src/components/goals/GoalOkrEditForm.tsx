"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SMART_FIELD_LABELS, type GoalExecution } from "@/lib/goals/types";
import type { GoalWithMeta } from "@/lib/goals/storage";
import type { SmartFields } from "@/types/database";
import { cn } from "@/lib/utils";

type Props = {
  draft: GoalWithMeta;
  onChange: (next: GoalWithMeta) => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  saving?: boolean;
};

export function GoalOkrEditForm({
  draft,
  onChange,
  onSave,
  onCancel,
  saving,
}: Props) {
  const patchExecution = (patch: Partial<GoalExecution>) => {
    onChange({
      ...draft,
      execution: { ...draft.execution, ...patch },
    });
  };

  const patchSmart = (patch: Partial<SmartFields>) => {
    onChange({
      ...draft,
      smart_current: { ...draft.smart_current, ...patch },
    });
  };

  const isPending = draft.goal_type === "pending";

  return (
    <div className="mt-3 space-y-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
      <p className="text-xs font-semibold text-[#3B82F6]">编辑 OKR</p>

      <label className="block text-xs text-slate-500">
        目标名称
        <Input
          className="mt-1"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
        />
      </label>

      {!isPending && (
        <div>
          <p className="text-xs text-slate-500">目标类型</p>
          <div className="mt-1 flex gap-1">
            {(
              [
                ["near", "近期目标"],
                ["long", "长期目标"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => onChange({ ...draft, goal_type: k })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[11px] transition",
                  draft.goal_type === k
                    ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]"
                    : "border-[#E2E8F0] bg-white text-slate-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-500">
          开始日期
          <Input
            type="date"
            className="mt-1"
            value={draft.execution.start_date ?? ""}
            onChange={(e) =>
              patchExecution({ start_date: e.target.value || null })
            }
          />
        </label>
        <label className="text-xs text-slate-500">
          截止日期
          <Input
            type="date"
            className="mt-1"
            value={draft.execution.due_date ?? ""}
            onChange={(e) =>
              patchExecution({ due_date: e.target.value || null })
            }
          />
        </label>
      </div>

      <div>
        <p className="text-xs text-slate-500">总进度计算</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(
            [
              ["auto", "按 KR 自动加权"],
              ["manual", "手动量化追踪"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => patchExecution({ progressMode: k })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[11px] transition",
                (draft.execution.progressMode ?? "auto") === k
                  ? "border-[#3B82F6] bg-[#EFF6FF] text-[#1D4ED8]"
                  : "border-[#E2E8F0] bg-white text-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(draft.execution.progressMode ?? "auto") === "manual" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-slate-500">
            目标量
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={draft.execution.target_quantity ?? ""}
              onChange={(e) =>
                patchExecution({
                  target_quantity: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </label>
          <label className="text-xs text-slate-500">
            已完成
            <Input
              type="number"
              min={0}
              className="mt-1"
              value={draft.execution.current_quantity}
              onChange={(e) =>
                patchExecution({
                  current_quantity: Math.max(0, Number(e.target.value) || 0),
                })
              }
            />
          </label>
          <label className="text-xs text-slate-500">
            单位
            <Input
              className="mt-1"
              value={draft.execution.quantity_unit}
              onChange={(e) =>
                patchExecution({ quantity_unit: e.target.value })
              }
            />
          </label>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">SMART</p>
        {SMART_FIELD_LABELS.map(({ key, label }) => (
          <label key={key} className="block text-[11px] text-slate-500">
            {label}
            <Textarea
              className="mt-0.5 min-h-[2.5rem] text-xs"
              value={draft.smart_current[key] ?? ""}
              onChange={(e) => patchSmart({ [key]: e.target.value })}
            />
          </label>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          disabled={saving || !draft.title.trim()}
          onClick={() => void onSave()}
        >
          {saving ? "保存中…" : "保存 OKR"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  );
}
