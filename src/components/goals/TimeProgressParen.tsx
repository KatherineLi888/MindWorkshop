"use client";

import { formatTimeVsParen, getTimeVsLabel } from "@/lib/goals/time-vs-label";
import { cn } from "@/lib/utils";

type Props = {
  completionPercent: number;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
};

export function TimeProgressParen({
  completionPercent,
  startDate,
  endDate,
  size = "md",
  className,
}: Props) {
  const text = formatTimeVsParen(completionPercent, startDate, endDate);
  if (!text) return null;

  const label = getTimeVsLabel(completionPercent, startDate, endDate);

  return (
    <span
      className={cn(
        "shrink-0 whitespace-nowrap tabular-nums",
        size === "sm" ? "text-[9px]" : "text-[10px]",
        label?.vs === "ahead" && "text-emerald-600",
        label?.vs === "behind" && "text-amber-600",
        label?.vs === "on_track" && "text-slate-400",
        label?.vs === "ended" && "text-slate-500",
        className
      )}
    >
      {text}
    </span>
  );
}
