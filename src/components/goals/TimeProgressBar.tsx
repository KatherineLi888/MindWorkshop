"use client";

import { useCallback, useRef, useState } from "react";
import {
  compareProgressVsTime,
  computeTimeProgress,
  timeStripeBackground,
} from "@/lib/goals/time-progress";
import { formatTimeVsParen, getTimeVsLabel } from "@/lib/goals/time-vs-label";
import {
  formatCatchUpHint,
  progressBarFillClass,
  type UnitGapContext,
} from "@/lib/goals/time-gap-units";
import { cn } from "@/lib/utils";

type Props = {
  completionPercent: number;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  size?: "sm" | "md";
  isOverflow?: boolean;
  unitContext?: UnitGapContext | null;
  className?: string;
};

function TimeVsParen({
  completionPercent,
  startDate,
  endDate,
  size,
  unitContext,
}: {
  completionPercent: number;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  size: "sm" | "md";
  unitContext?: UnitGapContext | null;
}) {
  const text = formatTimeVsParen(completionPercent, startDate, endDate);
  const label = getTimeVsLabel(completionPercent, startDate, endDate);
  const catchUpHint = formatCatchUpHint(
    completionPercent,
    startDate,
    endDate,
    unitContext
  );
  const [tipVisible, setTipVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const showTip = useCallback(() => {
    if (!catchUpHint) return;
    clearHideTimer();
    setTipVisible(true);
  }, [catchUpHint, clearHideTimer]);

  const hideTip = useCallback(() => {
    clearHideTimer();
    setTipVisible(false);
  }, [clearHideTimer]);

  const tapTip = useCallback(() => {
    if (!catchUpHint) return;
    showTip();
    hideTimer.current = setTimeout(() => setTipVisible(false), 1000);
  }, [catchUpHint, showTip]);

  if (!text) return null;

  return (
    <span
      className={cn(
        "relative shrink-0 cursor-default whitespace-nowrap tabular-nums",
        size === "sm" ? "text-[9px]" : "text-[10px]",
        label?.vs === "ahead" && "text-emerald-600",
        label?.vs === "behind" && "text-yellow-600",
        label?.vs === "on_track" && "text-emerald-600",
        label?.vs === "ended" && "text-slate-500",
        catchUpHint && "cursor-help"
      )}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onClick={tapTip}
    >
      {text}
      {tipVisible && catchUpHint && (
        <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 max-w-[10rem] whitespace-normal rounded bg-slate-800 px-1.5 py-0.5 text-left text-[9px] font-normal leading-snug text-white shadow-sm">
          {catchUpHint}
        </span>
      )}
    </span>
  );
}

export function TimeProgressBar({
  completionPercent,
  startDate,
  endDate,
  size = "md",
  isOverflow = false,
  unitContext,
  className,
}: Props) {
  const time = computeTimeProgress(startDate, endDate);
  const vs =
    time.active && time.percent != null
      ? compareProgressVsTime(completionPercent, time)
      : null;
  const barWidth = Math.min(100, isOverflow ? 100 : completionPercent);
  const h = size === "sm" ? "h-1" : "h-2";
  const fillClass = progressBarFillClass(vs, isOverflow);

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <div
        className={cn(
          "relative min-w-0 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]",
          h
        )}
      >
        {time.active && time.percent != null && (
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${time.percent}%`,
              background: timeStripeBackground(),
            }}
          />
        )}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-[1] rounded-full transition-all",
            fillClass
          )}
          style={{ width: `${barWidth}%` }}
        />
        {time.active &&
          time.percent != null &&
          time.percent > 0 &&
          time.percent < 100 && (
            <div
              className="absolute inset-y-0 z-[2] w-0.5 bg-slate-600/50"
              style={{ left: `calc(${time.percent}% - 1px)` }}
            />
          )}
      </div>
      <TimeVsParen
        completionPercent={completionPercent}
        startDate={startDate}
        endDate={endDate}
        size={size}
        unitContext={unitContext}
      />
    </div>
  );
}
