import { collectTodayGoalGroups } from "./today-items";
import type { GoalWithMeta } from "@/lib/goals/storage";
import type { KeyResult, KrTask } from "./types";
import { normalizeRecurrence } from "./recurrence";

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function createKrTask(title: string, due_date: string | null = null): KrTask {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    due_date,
    completed: false,
    completed_at: null,
    created_at: now,
  };
}

export function normalizeKrTasks(raw: unknown): KrTask[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((t): t is Partial<KrTask> => t != null && typeof t === "object")
    .map((t) => ({
      id: String(t.id ?? crypto.randomUUID()),
      title: String(t.title ?? ""),
      due_date: t.due_date ?? null,
      start_date: t.start_date ?? null,
      recurrence: normalizeRecurrence(t.recurrence),
      completed: !!t.completed,
      completed_at: t.completed_at ?? null,
      created_at: t.created_at ?? new Date().toISOString(),
    }));
}

export function computeQualitativeKrProgress(kr: KeyResult): number {
  const tasks = kr.tasks ?? [];
  const active = tasks.filter((t) => t.title.trim());
  if (!active.length) return 0;
  const done = active.filter((t) => t.completed).length;
  return Math.round((done / active.length) * 100);
}

export function isQualitativeKr(kr: KeyResult): boolean {
  return kr.krKind === "qualitative" || (kr.tasks?.length ?? 0) > 0;
}

export type TodayTaskRow = {
  goalId: string;
  goalTitle: string;
  krId: string;
  krTitle: string;
  task: KrTask;
};

export function collectTodayTasks(goals: GoalWithMeta[]): TodayTaskRow[] {
  return collectTodayGoalGroups(goals).flatMap((g) =>
    g.qual.map((q) => ({
      goalId: q.goalId,
      goalTitle: q.goalTitle,
      krId: q.krId,
      krTitle: q.krTitle,
      task: q.task,
    }))
  );
}

export function collectCompletedTasks(goals: GoalWithMeta[]): TodayTaskRow[] {
  const rows: TodayTaskRow[] = [];
  for (const g of goals) {
    for (const kr of g.execution.key_results) {
      for (const task of kr.tasks ?? []) {
        if (!task.title.trim() || !task.completed) continue;
        rows.push({
          goalId: g.id,
          goalTitle: g.title,
          krId: kr.id,
          krTitle: kr.title,
          task,
        });
      }
    }
  }
  return rows.sort(
    (a, b) =>
      new Date(b.task.completed_at ?? 0).getTime() -
      new Date(a.task.completed_at ?? 0).getTime()
  );
}
