import { normalizeExecution } from "@/lib/goals/types";
import type { GoalRow } from "@/types/database";

/** 线上 goals 表可能是 title 或 name 列，写入时两个都带上 */
export function goalCloudWritePayload(
  goal: Pick<
    GoalRow,
    | "id"
    | "title"
    | "goal_type"
    | "progress"
    | "smart_current"
    | "execution"
    | "created_at"
    | "updated_at"
  > & { user_id?: string }
): Record<string, unknown> {
  const title = goal.title?.trim() || "未命名目标";
  const now = goal.updated_at ?? new Date().toISOString();
  return {
    id: goal.id,
    user_id: goal.user_id,
    title,
    name: title,
    goal_type: goal.goal_type,
    smart_current: goal.smart_current ?? {},
    progress: Number(goal.progress ?? 0),
    execution: normalizeExecution(goal.execution),
    created_at: goal.created_at ?? now,
    updated_at: now,
  };
}

export function normalizeCloudGoalRow(raw: Record<string, unknown>): GoalRow {
  const title = String(raw.title ?? raw.name ?? "").trim() || "未命名目标";
  return {
    ...(raw as unknown as GoalRow),
    title,
  };
}
