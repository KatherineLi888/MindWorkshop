import { applyKrRecord } from "./kr-progress";
import { logKrActivity, logManualGoalActivity } from "./activity-log";
import type { GoalExecution } from "./types";

/** 对单条 KR 应用记录并返回新的 execution */
export function patchKrRecord(
  execution: GoalExecution,
  krId: string,
  value: number
): GoalExecution {
  const kr = execution.key_results.find((k) => k.id === krId);
  if (!kr) return execution;
  const updated = applyKrRecord(kr, {
    value: kr.recordMode === "set" ? value : undefined,
    delta:
      kr.recordMode === "accumulate"
        ? value
        : kr.recordMode === "count" || kr.recordMode === "consume"
          ? 1
          : undefined,
  });
  return {
    ...execution,
    key_results: execution.key_results.map((k) =>
      k.id === krId ? updated : k
    ),
  };
}

export function patchKrRecordWithLog(
  goalId: string,
  execution: GoalExecution,
  krId: string,
  value: number
): GoalExecution {
  const kr = execution.key_results.find((k) => k.id === krId);
  if (kr) logKrActivity(goalId, kr, value);
  return patchKrRecord(execution, krId, value);
}

/** 手动量化目标 +1 */
export function patchQuantityRecord(
  execution: GoalExecution,
  delta = 1
): GoalExecution {
  return {
    ...execution,
    current_quantity: Math.max(0, execution.current_quantity + delta),
  };
}

export function patchQuantityRecordWithLog(
  goalId: string,
  execution: GoalExecution,
  delta = 1
): GoalExecution {
  logManualGoalActivity(goalId, execution.quantity_unit, delta);
  return patchQuantityRecord(execution, delta);
}

/** 是否启用手动量化追踪 */
export function hasManualQuantityTracking(execution: GoalExecution): boolean {
  const mode = execution.progressMode ?? "auto";
  if (mode === "manual") {
    return (
      execution.target_quantity != null && execution.target_quantity > 0
    );
  }
  const hasKrs = execution.key_results.some(
    (k) => k.title.trim() || k.target > 0
  );
  return (
    !hasKrs &&
    execution.target_quantity != null &&
    execution.target_quantity > 0
  );
}
