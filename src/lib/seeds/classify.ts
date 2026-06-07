import { seedStageLabel } from "./labels";
import type { IdeaSeed, SeedPhase, SeedStage } from "./types";

export const SEED_PHASE_LABELS: Record<SeedPhase, string> = {
  sprouting: "萌芽中",
  growing: "生长中",
  archived: "已归档",
};

/** 已纳入目标计划的种子标记（不经历萌芽态） */
export const GOAL_PLAN_SEED_MARKER = "目标计划";

/** 种子是否与目标计划绑定：创建/流转自目标模块 */
export function isGoalPlanSeed(seed: IdeaSeed): boolean {
  return seed.events.some(
    (e) => e.entityType === "goal" || e.stage === "goals"
  );
}

/** 种子经历过的不同阶段（不含结束事件） */
export function distinctStages(seed: IdeaSeed): SeedStage[] {
  const order: SeedStage[] = [];
  const seen = new Set<SeedStage>();
  for (const e of seed.events) {
    if (e.action === "ended") continue;
    if (!seen.has(e.stage)) {
      seen.add(e.stage);
      order.push(e.stage);
    }
  }
  return order;
}

export function stageTransitionCount(seed: IdeaSeed): number {
  return Math.max(0, distinctStages(seed).length - 1);
}

export function currentStage(seed: IdeaSeed): SeedStage | null {
  const stages = distinctStages(seed);
  return stages.length ? stages[stages.length - 1] : null;
}

/**
 * 客观标准：仅 1 阶段=萌芽；≥2 阶段且未结束=生长；已结束=归档。
 * 例外：目标计划种子已纳入 OKR，活跃态一律视为生长中（无萌芽）。
 */
export function classifySeed(seed: IdeaSeed): SeedPhase {
  if (seed.status === "ended") return "archived";
  if (isGoalPlanSeed(seed)) return "growing";
  const n = distinctStages(seed).length;
  if (n <= 1) return "sprouting";
  return "growing";
}

export type SeedBoardMeta = {
  phase: SeedPhase;
  stageCount: number;
  transitionCount: number;
  currentStage: SeedStage | null;
  currentStageLabel: string;
};

export function seedBoardMeta(seed: IdeaSeed): SeedBoardMeta {
  const stages = distinctStages(seed);
  const cur = stages.length ? stages[stages.length - 1] : null;
  return {
    phase: classifySeed(seed),
    stageCount: stages.length,
    transitionCount: stageTransitionCount(seed),
    currentStage: cur,
    currentStageLabel: cur ? seedStageLabel(cur) : "—",
  };
}

export function partitionSeeds(seeds: IdeaSeed[]): Record<SeedPhase, IdeaSeed[]> {
  const out: Record<SeedPhase, IdeaSeed[]> = {
    sprouting: [],
    growing: [],
    archived: [],
  };
  for (const s of seeds) {
    out[classifySeed(s)].push(s);
  }
  const byRecent = (a: IdeaSeed, b: IdeaSeed) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  out.sprouting.sort(byRecent);
  out.growing.sort(byRecent);
  out.archived.sort(byRecent);
  return out;
}

/** 当下生长中：按最近活跃排序 */
export function spotlightGrowing(seeds: IdeaSeed[], limit = 5): IdeaSeed[] {
  return seeds
    .filter((s) => classifySeed(s) === "growing")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, limit);
}
