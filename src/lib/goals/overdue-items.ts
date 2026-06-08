import { isQualitativeKr } from "./kr-tasks";
import {
  getKrOverdueDate,
  getTaskOverdueDate,
} from "./recurrence";
import type { GoalWithMeta } from "./storage";
import { todayIso, type TodayQualTaskRow, type TodayQuantRow } from "./today-items";

export type OverdueQualTaskRow = TodayQualTaskRow & { overdueDate: string };
export type OverdueQuantRow = TodayQuantRow & { overdueDate: string };

export type OverdueGoalGroup = {
  goalId: string;
  goalTitle: string;
  quant: OverdueQuantRow[];
  qual: OverdueQualTaskRow[];
};

export function collectOverdueGoalGroups(goals: GoalWithMeta[]): OverdueGoalGroup[] {
  const today = todayIso();
  const groups: OverdueGoalGroup[] = [];

  for (const g of goals) {
    if (g.goal_type === "pending") continue;
    const quant: OverdueQuantRow[] = [];
    const qual: OverdueQualTaskRow[] = [];

    for (const kr of g.execution.key_results) {
      if (isQualitativeKr(kr)) {
        for (const task of kr.tasks ?? []) {
          const overdueDate = getTaskOverdueDate(task, today);
          if (!overdueDate) continue;
          qual.push({
            kind: "qual_task",
            goalId: g.id,
            goalTitle: g.title,
            krId: kr.id,
            krTitle: kr.title,
            task,
            overdueDate,
          });
        }
      } else {
        const overdueDate = getKrOverdueDate(kr, today);
        if (!overdueDate) continue;
        quant.push({
          kind: "quant_kr",
          goalId: g.id,
          goalTitle: g.title,
          kr,
          label: kr.title.trim() || "KR",
          overdueDate,
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
