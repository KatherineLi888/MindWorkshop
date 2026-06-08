import { isQualitativeKr } from "./kr-tasks";
import { isKrDueToday, isTaskDueToday } from "./recurrence";
import type { GoalWithMeta } from "./storage";
import type { KeyResult, KrTask } from "./types";

export type TodayQualTaskRow = {
  kind: "qual_task";
  goalId: string;
  goalTitle: string;
  krId: string;
  krTitle: string;
  task: KrTask;
};

export type TodayQuantRow = {
  kind: "quant_kr";
  goalId: string;
  goalTitle: string;
  kr: KeyResult;
  label: string;
};

export type TodayGoalGroup = {
  goalId: string;
  goalTitle: string;
  quant: TodayQuantRow[];
  qual: TodayQualTaskRow[];
};

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function collectTodayGoalGroups(goals: GoalWithMeta[]): TodayGoalGroup[] {
  const today = todayIso();
  const groups: TodayGoalGroup[] = [];

  for (const g of goals) {
    if (g.goal_type === "pending") continue;
    const quant: TodayQuantRow[] = [];
    const qual: TodayQualTaskRow[] = [];

    for (const kr of g.execution.key_results) {
      if (isQualitativeKr(kr)) {
        for (const task of kr.tasks ?? []) {
          if (!isTaskDueToday(task, today)) continue;
          qual.push({
            kind: "qual_task",
            goalId: g.id,
            goalTitle: g.title,
            krId: kr.id,
            krTitle: kr.title,
            task,
          });
        }
      } else if (isKrDueToday(kr, today)) {
        quant.push({
          kind: "quant_kr",
          goalId: g.id,
          goalTitle: g.title,
          kr,
          label: kr.title.trim() || "KR",
        });
      }
    }

    if (quant.length || qual.length) {
      groups.push({
        goalId: g.id,
        goalTitle: g.title,
        quant,
        qual,
      });
    }
  }

  return groups;
}
