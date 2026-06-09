import { normalizeExecution } from "@/lib/goals/types";
import type { GoalRow } from "@/types/database";

const GOAL_TYPES = new Set(["near", "long", "pending"]);

function normalizeGoalType(raw: unknown): GoalRow["goal_type"] {
  const v = String(raw ?? "pending");
  return GOAL_TYPES.has(v) ? (v as GoalRow["goal_type"]) : "pending";
}

/** 线上 goals 表列名可能是旧版：name/title、type/goal_type，写入时全部带上 */
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
  const goalType = normalizeGoalType(goal.goal_type);
  const now = goal.updated_at ?? new Date().toISOString();
  return {
    id: goal.id,
    user_id: goal.user_id,
    title,
    name: title,
    goal_type: goalType,
    type: goalType,
    smart_current: goal.smart_current ?? {},
    progress: Number(goal.progress ?? 0),
    execution: normalizeExecution(goal.execution),
    created_at: goal.created_at ?? now,
    updated_at: now,
  };
}

export function normalizeCloudGoalRow(raw: Record<string, unknown>): GoalRow {
  const title = String(raw.title ?? raw.name ?? "").trim() || "未命名目标";
  const goal_type = normalizeGoalType(raw.goal_type ?? raw.type);
  return {
    ...(raw as unknown as GoalRow),
    title,
    goal_type,
  };
}
