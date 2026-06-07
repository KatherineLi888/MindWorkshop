"use client";

import { TimeProgressBar } from "@/components/goals/TimeProgressBar";
import type { KeyResult } from "@/lib/goals/types";
import { getKrProgressVisual } from "@/lib/goals/kr-progress";
import { krUnitContext } from "@/lib/goals/time-gap-units";
import { resolveProgressVisual } from "@/lib/goals/progress-visual";
import { cn } from "@/lib/utils";

type Props = {
  kr: KeyResult;
  size?: "sm" | "md";
  className?: string;
};

export function KrProgressPercent({
  kr,
  className,
}: {
  kr: KeyResult;
  className?: string;
}) {
  const { displayPercent, barWidth, isOverflow } = getKrProgressVisual(kr);
  const visual = resolveProgressVisual(
    isOverflow ? displayPercent : barWidth,
    kr.start_date,
    kr.due_date,
    isOverflow
  );

  return (
    <span
      className={cn(
        "shrink-0 font-semibold tabular-nums",
        visual.percentClass,
        className
      )}
    >
      {displayPercent}%
    </span>
  );
}

export function KrProgressBar({ kr, size = "md", className }: Props) {
  const { displayPercent, barWidth, isOverflow } = getKrProgressVisual(kr);

  return (
    <TimeProgressBar
      completionPercent={isOverflow ? displayPercent : barWidth}
      startDate={kr.start_date}
      endDate={kr.due_date}
      size={size}
      isOverflow={isOverflow}
      unitContext={krUnitContext(kr)}
      className={className}
    />
  );
}
