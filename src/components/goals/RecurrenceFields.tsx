"use client";

import { Input } from "@/components/ui/input";
import {
  formatRecurrenceLabel,
  type RecurrenceKind,
  type RecurrenceSchedule,
} from "@/lib/goals/recurrence";
import { cn } from "@/lib/utils";

const KIND_OPTIONS: { value: RecurrenceKind; label: string }[] = [
  { value: "daily", label: "每日" },
  { value: "workdays", label: "法定工作日" },
  { value: "weekly", label: "每周（自选日）" },
  { value: "monthly_date", label: "每月固定日" },
  { value: "monthly_first_workday", label: "每月首个工作日" },
  { value: "monthly_range", label: "每月指定区间" },
];

const WEEK_OPTS = [
  { v: 1, l: "一" },
  { v: 2, l: "二" },
  { v: 3, l: "三" },
  { v: 4, l: "四" },
  { v: 5, l: "五" },
  { v: 6, l: "六" },
  { v: 0, l: "日" },
];

type Props = {
  startDate: string | null;
  dueDate: string | null;
  recurrence: RecurrenceSchedule | null | undefined;
  onStartDate: (v: string | null) => void;
  onDueDate: (v: string | null) => void;
  onRecurrence: (v: RecurrenceSchedule | null) => void;
  compact?: boolean;
};

export function RecurrenceFields({
  startDate,
  dueDate,
  recurrence,
  onStartDate,
  onDueDate,
  onRecurrence,
  compact,
}: Props) {
  const kind = recurrence?.kind;

  const setKind = (k: RecurrenceKind | "") => {
    if (!k) {
      onRecurrence(null);
      return;
    }
    onRecurrence({
      kind: k,
      weekdays: k === "weekly" ? [1] : undefined,
      monthDay: k === "monthly_date" ? 1 : undefined,
      monthRangeStart: k === "monthly_range" ? 1 : undefined,
      monthRangeEnd: k === "monthly_range" ? 5 : undefined,
    });
  };

  return (
    <div className={cn("space-y-1.5", compact && "text-[11px]")}>
      <div className="grid grid-cols-2 gap-1.5">
        <label className="text-[10px] text-slate-500">
          开始
          <Input
            type="date"
            className="mt-0.5 h-8 text-xs"
            value={startDate ?? ""}
            onChange={(e) => onStartDate(e.target.value || null)}
          />
        </label>
        <label className="text-[10px] text-slate-500">
          截止
          <Input
            type="date"
            className="mt-0.5 h-8 text-xs"
            value={dueDate ?? ""}
            onChange={(e) => onDueDate(e.target.value || null)}
          />
        </label>
      </div>

      <label className="block text-[10px] text-slate-500">
        重复周期
        <select
          className="mt-0.5 h-8 w-full rounded-md border border-[#E2E8F0] bg-white px-2 text-xs"
          value={kind ?? ""}
          onChange={(e) => setKind(e.target.value as RecurrenceKind | "")}
        >
          <option value="">不重复（仅截止日）</option>
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {kind === "weekly" && recurrence && (
        <div className="flex flex-wrap gap-1">
          {WEEK_OPTS.map((w) => {
            const on = recurrence.weekdays?.includes(w.v);
            return (
              <button
                key={w.v}
                type="button"
                onClick={() => {
                  const cur = recurrence.weekdays ?? [];
                  const next = on
                    ? cur.filter((d) => d !== w.v)
                    : [...cur, w.v];
                  onRecurrence({ ...recurrence, weekdays: next });
                }}
                className={cn(
                  "rounded px-2 py-0.5 text-[10px]",
                  on
                    ? "bg-[#3B82F6] text-white"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                周{w.l}
              </button>
            );
          })}
        </div>
      )}

      {kind === "monthly_date" && recurrence && (
        <Input
          type="number"
          min={1}
          max={31}
          className="h-8 w-24 text-xs"
          value={recurrence.monthDay ?? 1}
          onChange={(e) =>
            onRecurrence({
              ...recurrence,
              monthDay: Number(e.target.value) || 1,
            })
          }
        />
      )}

      {kind === "monthly_range" && recurrence && (
        <div className="flex items-center gap-1 text-xs">
          <Input
            type="number"
            min={1}
            max={31}
            className="h-8 w-16 text-xs"
            value={recurrence.monthRangeStart ?? 1}
            onChange={(e) =>
              onRecurrence({
                ...recurrence,
                monthRangeStart: Number(e.target.value) || 1,
              })
            }
          />
          <span className="text-slate-400">-</span>
          <Input
            type="number"
            min={1}
            max={31}
            className="h-8 w-16 text-xs"
            value={recurrence.monthRangeEnd ?? 5}
            onChange={(e) =>
              onRecurrence({
                ...recurrence,
                monthRangeEnd: Number(e.target.value) || 5,
              })
            }
          />
          <span className="text-[10px] text-slate-400">号</span>
        </div>
      )}

      {recurrence && (
        <p className="text-[9px] text-slate-400">
          周期：{formatRecurrenceLabel(recurrence)}
        </p>
      )}
    </div>
  );
}
