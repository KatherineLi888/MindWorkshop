import type { GoalExecution, KeyResult, KrRecordMode } from "./types";
import { unitLabel } from "./kr-progress";
import {
  compareProgressVsTime,
  computeTimeProgress,
  type ProgressVsTime,
} from "./time-progress";

export type UnitGapContext = {
  target: number;
  current: number;
  unit: string;
  recordMode?: KrRecordMode;
};

export function krUnitContext(kr: KeyResult): UnitGapContext {
  return {
    target: kr.target,
    current: kr.current,
    unit: unitLabel(kr),
    recordMode: kr.recordMode,
  };
}

export function goalUnitContext(
  execution: GoalExecution
): UnitGapContext | null {
  if (execution.target_quantity != null && execution.target_quantity > 0) {
    return {
      target: execution.target_quantity,
      current: execution.current_quantity,
      unit: execution.quantity_unit?.trim() || "次",
    };
  }
  const krs = execution.key_results.filter(
    (k) => k.title.trim() || k.target > 0
  );
  if (krs.length === 1) return krUnitContext(krs[0]);
  return null;
}

function expectedAmountAtTime(ctx: UnitGapContext, timePercent: number): number {
  if (ctx.target <= 0) return ctx.current;
  return (ctx.target * timePercent) / 100;
}

/** 将领先/落后换算为业务单位，如「还需约 2 次才能赶上进度」 */
export function formatCatchUpHint(
  completionPercent: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  ctx?: UnitGapContext | null
): string | null {
  if (!ctx || ctx.target <= 0) return null;

  const time = computeTimeProgress(startDate, endDate);
  if (!time.active || time.percent == null) return null;

  const vs = compareProgressVsTime(completionPercent, time);
  const expected = expectedAmountAtTime(ctx, time.percent);
  const unit = ctx.unit || "次";

  if (vs === "behind") {
    const gap = Math.max(0, expected - ctx.current);
    if (gap < 0.01) return null;
    const n =
      ctx.recordMode === "set" ? Math.ceil(gap * 10) / 10 : Math.ceil(gap);
    return `还需约 ${n}${unit} 才能赶上进度`;
  }

  if (vs === "ahead") {
    const surplus = ctx.current - expected;
    if (surplus < 0.01) return null;
    const n =
      ctx.recordMode === "set" ? Math.floor(surplus * 10) / 10 : Math.floor(surplus);
    return `约领先 ${n}${unit}`;
  }

  return null;
}

export function progressBarFillClass(
  vs: ProgressVsTime | null,
  isOverflow: boolean
): string {
  if (isOverflow) {
    return "bg-gradient-to-r from-amber-400 via-fuchsia-500 to-violet-500";
  }
  if (vs === "behind") return "bg-yellow-400";
  return "bg-emerald-500";
}
