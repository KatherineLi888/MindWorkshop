import { normalizeExecution } from "./types";
import { saveGoal, type GoalWithMeta } from "./storage";
import { todayIso } from "./today-items";
import type { KeyResult, KrTask } from "./types";

export async function saveGoalExecution(
  goals: GoalWithMeta[],
  goalId: string,
  patchExecution: (execution: GoalWithMeta["execution"]) => GoalWithMeta["execution"]
): Promise<GoalWithMeta[]> {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return goals;
  const execution = normalizeExecution(patchExecution(goal.execution));
  return saveGoal({ ...goal, execution });
}

function recomputeQualKr(kr: KeyResult): KeyResult {
  const tasks = kr.tasks ?? [];
  const active = tasks.filter((t) => t.title.trim());
  const done = active.filter((t) => t.completed).length;
  return {
    ...kr,
    current: done,
    target: Math.max(1, active.length),
  };
}

export async function patchQualTask(
  goals: GoalWithMeta[],
  goalId: string,
  krId: string,
  taskId: string,
  patch: Partial<KrTask>
): Promise<GoalWithMeta[]> {
  return saveGoalExecution(goals, goalId, (execution) => ({
    ...execution,
    key_results: execution.key_results.map((kr) => {
      if (kr.id !== krId) return kr;
      const tasks = (kr.tasks ?? []).map((t) =>
        t.id === taskId ? { ...t, ...patch } : t
      );
      return recomputeQualKr({ ...kr, tasks });
    }),
  }));
}

export async function deleteQualTask(
  goals: GoalWithMeta[],
  goalId: string,
  krId: string,
  taskId: string
): Promise<GoalWithMeta[]> {
  return saveGoalExecution(goals, goalId, (execution) => ({
    ...execution,
    key_results: execution.key_results.map((kr) => {
      if (kr.id !== krId) return kr;
      const tasks = (kr.tasks ?? []).filter((t) => t.id !== taskId);
      return recomputeQualKr({ ...kr, tasks });
    }),
  }));
}

export async function moveQualTaskToToday(
  goals: GoalWithMeta[],
  goalId: string,
  krId: string,
  taskId: string,
  today = todayIso()
): Promise<GoalWithMeta[]> {
  return patchQualTask(goals, goalId, krId, taskId, {
    due_date: today,
    start_date: today,
  });
}

export async function patchKrSchedule(
  goals: GoalWithMeta[],
  goalId: string,
  krId: string,
  patch: Partial<Pick<KeyResult, "start_date" | "due_date" | "recurrence">>
): Promise<GoalWithMeta[]> {
  return saveGoalExecution(goals, goalId, (execution) => ({
    ...execution,
    key_results: execution.key_results.map((kr) =>
      kr.id === krId ? { ...kr, ...patch } : kr
    ),
  }));
}

export async function moveKrToToday(
  goals: GoalWithMeta[],
  goalId: string,
  krId: string,
  today = todayIso()
): Promise<GoalWithMeta[]> {
  return patchKrSchedule(goals, goalId, krId, {
    due_date: today,
    start_date: today,
  });
}
