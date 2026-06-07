"use client";

import { getTimeVsLabel } from "@/lib/goals/time-vs-label";
import { cn } from "@/lib/utils";

type Props = {
  completionPercent: number;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
};

export function TimeProgressBadge({
  completionPercent,
  startDate,
  endDate,
  size = "md",
  className,
}: Props) {
  const label = getTimeVsLabel(completionPercent, startDate, endDate);
  if (!label) return null;

  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap font-medium tabular-nums",
        size === "sm" ? "text-[9px]" : "text-[10px]",
        label.vs === "ahead" && "text-emerald-600",
        label.vs === "behind" && "text-amber-600",
        label.vs === "on_track" && "text-slate-400",
        label.vs === "not_started" && "text-slate-400",
        label.vs === "ended" && "text-slate-500",
        className
      )}
      title={
        label.diff != null
          ? `完成 ${completionPercent}% · 时间进度对比`
          : label.text
      }
    >
      {label.text}
    </span>
  );
}
