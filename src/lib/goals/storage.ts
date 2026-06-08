import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import {
  DEFAULT_GOAL_EXECUTION,
  normalizeExecution,
  computeGoalProgress,
  type GoalExecution,
} from "@/lib/goals/types";
import type { GoalRow, SmartFields } from "@/types/database";

export type GoalWithMeta = GoalRow & {
  execution: GoalExecution;
  smart_versions?: SmartFields[];
};

export function toGoalWithMeta(row: GoalRow): GoalWithMeta {
  const execution = normalizeExecution(row.execution);
  const progress = computeGoalProgress(row.progress, execution);
  const versions = (row as GoalRow & { smart_versions?: SmartFields[] })
    .smart_versions;
  return {
    ...row,
    progress,
    execution,
    smart_versions: versions,
  };
}

export async function loadAllGoals(): Promise<GoalWithMeta[]> {
  if (!isCloudEnabled()) {
    return loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []).map(toGoalWithMeta);
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data as GoalRow[]) ?? []).map(toGoalWithMeta);
}

export async function loadGoalSmartVersions(
  goalId: string
): Promise<SmartFields[]> {
  if (!isCloudEnabled()) {
    const goals = loadLocal<(GoalRow & { smart_versions?: SmartFields[] })[]>(
      LOCAL_KEYS.goals,
      []
    );
    return goals.find((x) => x.id === goalId)?.smart_versions ?? [];
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("goal_smart_versions")
    .select("smart_data, created_at")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => r.smart_data as SmartFields);
}

export async function saveGoal(goal: GoalWithMeta): Promise<GoalWithMeta[]> {
  const execution = normalizeExecution(goal.execution);
  const progress = computeGoalProgress(goal.progress, execution);
  const updated_at = new Date().toISOString();
  const payload = {
    ...goal,
    execution,
    progress,
    updated_at,
  };

  if (!isCloudEnabled()) {
    const prev = loadLocal<(GoalRow & { smart_versions?: SmartFields[] })[]>(
      LOCAL_KEYS.goals,
      []
    );
    const row = {
      title: payload.title,
      goal_type: payload.goal_type,
      progress: payload.progress,
      smart_current: payload.smart_current,
      execution: payload.execution,
      smart_versions: goal.smart_versions,
      updated_at,
    };
    const idx = prev.findIndex((g) => g.id === goal.id);
    const next =
      idx >= 0
        ? prev.map((g, i) => (i === idx ? { ...g, ...row } : g))
        : [{ ...goal, ...row } as GoalRow & { smart_versions?: SmartFields[] }, ...prev];
    saveLocal(LOCAL_KEYS.goals, next);
    return next.map(toGoalWithMeta);
  }

  const supabase = createClient();
  await supabase
    .from("goals")
    .update({
      title: payload.title,
      goal_type: payload.goal_type,
      progress: payload.progress,
      smart_current: payload.smart_current,
      execution: payload.execution,
      updated_at,
    })
    .eq("id", goal.id);

  return loadAllGoals();
}

const EMPTY_SMART: SmartFields = {
  specific: "",
  measurable: "",
  achievable: "",
  relevant: "",
  timeBound: "",
};

export function buildPendingGoal(title: string): GoalWithMeta {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: "local",
    title: title.trim(),
    goal_type: "pending",
    progress: 0,
    smart_current: { ...EMPTY_SMART, specific: title.trim() },
    execution: { ...DEFAULT_GOAL_EXECUTION },
    smart_versions: [],
    created_at: now,
    updated_at: now,
  };
}

export function buildNewGoal(input: {
  title: string;
  goal_type: "near" | "long";
  smart: SmartFields;
  versions: SmartFields[];
}): GoalWithMeta {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    user_id: "local",
    title: input.title,
    goal_type: input.goal_type,
    progress: 0,
    smart_current: input.smart,
    execution: { ...DEFAULT_GOAL_EXECUTION },
    smart_versions: input.versions,
    created_at: now,
    updated_at: now,
  };
}

export async function persistNewGoal(
  goal: GoalWithMeta
): Promise<string | null> {
  const row = {
    ...goal,
    execution: normalizeExecution(goal.execution),
    smart_versions: goal.smart_versions ?? [goal.smart_current],
  } as GoalRow & { smart_versions?: SmartFields[] };

  if (!isCloudEnabled()) {
    const prev = loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []);
    const exists = prev.some((g) => g.id === goal.id);
    saveLocal(LOCAL_KEYS.goals, exists ? prev.map((g) => (g.id === goal.id ? row : g)) : [row, ...prev]);
    ensureEntityHasSeed({
      entityType: "goal",
      entityId: goal.id,
      title: goal.title,
      stage: "goals",
    });
    return goal.id;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: inserted, error } = await supabase
    .from("goals")
    .upsert({
      id: goal.id,
      user_id: user.id,
      title: goal.title,
      goal_type: goal.goal_type,
      smart_current: goal.smart_current,
      progress: goal.progress ?? 0,
      execution: normalizeExecution(goal.execution),
      updated_at: goal.updated_at ?? new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;

  const goalId = inserted?.id ?? goal.id;
  const versions = goal.smart_versions ?? [goal.smart_current];
  for (const v of versions) {
    await supabase.from("goal_smart_versions").insert({
      goal_id: goalId,
      user_id: user.id,
      smart_data: v,
    });
  }

  ensureEntityHasSeed({
    entityType: "goal",
    entityId: goalId,
    title: goal.title,
    stage: "goals",
  });

  return goalId;
}
