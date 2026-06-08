import type { SmartFields } from "@/types/database";
import {
  computeWeightedOkrProgress,
  normalizeKeyResult,
} from "./kr-progress";
import { normalizeRecurrence, type RecurrenceSchedule } from "./recurrence";

export type KrRecordMode = "set" | "accumulate" | "count" | "consume";

/** 定性 KR 下的子任务 */
export type KrTask = {
  id: string;
  title: string;
  due_date: string | null;
  start_date?: string | null;
  recurrence?: RecurrenceSchedule | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type KrKind = "quantitative" | "qualitative";

export type KeyResult = {
  id: string;
  title: string;
  /** 定量=数字指标；定性=任务清单完成度 */
  krKind?: KrKind;
  /** 定性 KR 的子任务 */
  tasks?: KrTask[];
  /** 目标量 */
  target: number;
  /** 当前值 / 累计值 / 已完成次数 */
  current: number;
  unit: string;
  /** 权重 0–100 */
  weight: number;
  recordMode: KrRecordMode;
  /** KR 开始日期 */
  start_date: string | null;
  /** KR 截止日期 */
  due_date: string | null;
  /** set + down：起始值（如减重前的体重） */
  baseline?: number | null;
  /** set 模式：数值朝目标增大(up)或减小(down) */
  valueDirection: "up" | "down";
  /** 允许超出目标；超出时进度条显示彩蛋色 */
  allowExceed?: boolean;
  /** 日历打卡展示关键词，如「上肢」→ 日历显示「上肢 3次」 */
  calendarKeyword?: string;
  recurrence?: RecurrenceSchedule | null;
};

export type GoalExecution = {
  /** OKR 开始日期 */
  start_date: string | null;
  /** OKR 截止日期 */
  due_date: string | null;
  target_quantity: number | null;
  current_quantity: number;
  quantity_unit: string;
  /** auto=按 KR 加权；manual=用手动量化字段 */
  progressMode?: "auto" | "manual";
  key_results: KeyResult[];
};

export const DEFAULT_GOAL_EXECUTION: GoalExecution = {
  start_date: null,
  due_date: null,
  target_quantity: null,
  current_quantity: 0,
  quantity_unit: "",
  key_results: [],
};

export function normalizeExecution(raw?: Partial<GoalExecution> | null): GoalExecution {
  if (!raw) return { ...DEFAULT_GOAL_EXECUTION };
  const krs = Array.isArray(raw.key_results) ? raw.key_results : [];
  return {
    start_date: raw.start_date ?? null,
    due_date: raw.due_date ?? null,
    target_quantity: raw.target_quantity ?? null,
    current_quantity: raw.current_quantity ?? 0,
    quantity_unit: raw.quantity_unit ?? "",
    progressMode: raw.progressMode === "manual" ? "manual" : "auto",
    key_results: krs.map((kr, i) =>
      normalizeKeyResult(kr as KeyResult, i, krs.length)
    ),
  };
}

/** 根据执行数据计算进度 0–100 */
export function computeGoalProgress(
  progress: number,
  execution: GoalExecution
): number {
  const hasKrs = execution.key_results.some(
    (k) => k.title.trim() || k.target > 0
  );
  const mode = execution.progressMode ?? "auto";

  if (
    mode === "manual" &&
    execution.target_quantity != null &&
    execution.target_quantity > 0
  ) {
    return Math.min(
      100,
      Math.round(
        (execution.current_quantity / execution.target_quantity) * 100
      )
    );
  }

  const okr = computeWeightedOkrProgress(execution.key_results);
  if (okr != null && (mode === "auto" || hasKrs)) {
    return Math.min(100, Math.max(0, okr));
  }

  if (execution.target_quantity != null && execution.target_quantity > 0) {
    return Math.min(
      100,
      Math.round(
        (execution.current_quantity / execution.target_quantity) * 100
      )
    );
  }
  return Math.min(100, Math.max(0, Math.round(progress)));
}

export const SMART_FIELD_LABELS: {
  key: keyof SmartFields;
  label: string;
  short: string;
}[] = [
  { key: "specific", label: "具体 · 要完成什么", short: "S" },
  { key: "measurable", label: "可衡量 · 如何验收", short: "M" },
  { key: "achievable", label: "可达成 · 资源与现实", short: "A" },
  { key: "relevant", label: "相关 · 与方向一致", short: "R" },
  { key: "timeBound", label: "有时限 · 节点与截止", short: "T" },
];
