import { seedBoardMeta } from "./classify";
import { seedStageLabel } from "./labels";
import type { IdeaSeed, SeedStage } from "./types";

export type SeedOriginKey =
  | "theory"
  | "decisions"
  | "thinking"
  | "goals"
  | "track"
  | "inbox"
  | "home"
  | "model"
  | "canvas"
  | "review"
  | "other";

export const SEED_ORIGIN_OPTIONS: { key: SeedOriginKey; label: string }[] = [
  { key: "theory", label: "理论" },
  { key: "decisions", label: "决策" },
  { key: "thinking", label: "思考" },
  { key: "goals", label: "目标" },
  { key: "track", label: "追踪" },
  { key: "inbox", label: "收集箱" },
  { key: "home", label: "首页" },
  { key: "model", label: "模型" },
  { key: "canvas", label: "画布" },
];

const STAMP_STYLE: Record<
  SeedOriginKey,
  { ring: string; bg: string; text: string }
> = {
  theory: { ring: "ring-violet-200", bg: "bg-violet-50", text: "text-violet-700" },
  decisions: { ring: "ring-blue-200", bg: "bg-blue-50", text: "text-blue-700" },
  thinking: { ring: "ring-purple-200", bg: "bg-purple-50", text: "text-purple-700" },
  goals: { ring: "ring-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
  track: { ring: "ring-amber-200", bg: "bg-amber-50", text: "text-amber-700" },
  inbox: { ring: "ring-slate-200", bg: "bg-slate-50", text: "text-slate-600" },
  home: { ring: "ring-rose-200", bg: "bg-rose-50", text: "text-rose-700" },
  model: { ring: "ring-fuchsia-200", bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
  canvas: { ring: "ring-teal-200", bg: "bg-teal-50", text: "text-teal-700" },
  review: { ring: "ring-cyan-200", bg: "bg-cyan-50", text: "text-cyan-700" },
  other: { ring: "ring-slate-200", bg: "bg-slate-50", text: "text-slate-600" },
};

export function birthEvent(seed: IdeaSeed) {
  return seed.events.find((e) => e.action === "born") ?? seed.events[0];
}

export function seedOriginKey(seed: IdeaSeed): SeedOriginKey {
  const born = birthEvent(seed);
  if (!born) return "other";
  if (born.entityType === "theory" || born.stage === "theory") return "theory";
  if (born.entityType === "decision" || born.stage === "decisions")
    return "decisions";
  if (born.entityType === "thinking_session" || born.stage === "thinking")
    return "thinking";
  if (born.entityType === "goal" || born.stage === "goals") return "goals";
  if (born.entityType === "graph_node" || born.stage === "track") return "track";
  if (born.stage === "inbox") return "inbox";
  if (born.stage === "home") return "home";
  if (born.stage === "model") return "model";
  if (born.stage === "canvas") return "canvas";
  if (born.stage === "review") return "review";
  return "other";
}

export function seedOriginLabel(seed: IdeaSeed): string {
  const key = seedOriginKey(seed);
  return (
    SEED_ORIGIN_OPTIONS.find((o) => o.key === key)?.label ??
    seedStageLabel(birthEvent(seed)?.stage ?? "home")
  );
}

export function seedOriginStampStyle(seed: IdeaSeed) {
  return STAMP_STYLE[seedOriginKey(seed)];
}

/** 列筛选：来源 + 当前流转阶段（思考/决策/目标等） */
export type SeedColumnFilterState = {
  origin: SeedOriginKey | "";
  currentStage: SeedStage | "";
};

export const SEED_FLOW_STAGE_OPTIONS: { key: SeedStage; label: string }[] = [
  { key: "thinking", label: "思考" },
  { key: "decisions", label: "决策" },
  { key: "goals", label: "目标" },
  { key: "track", label: "追踪" },
  { key: "theory", label: "理论" },
  { key: "canvas", label: "画布" },
];

export function filterSeedsByColumn(
  seeds: IdeaSeed[],
  filter: SeedColumnFilterState
): IdeaSeed[] {
  return seeds.filter((s) => {
    if (filter.origin && seedOriginKey(s) !== filter.origin) return false;
    if (filter.currentStage) {
      const cur = seedBoardMeta(s).currentStage;
      if (cur !== filter.currentStage) return false;
    }
    return true;
  });
}

export function birthLocationFull(seed: IdeaSeed): string {
  const born = birthEvent(seed);
  if (!born) return "—";
  const stage = seedStageLabel(born.stage);
  const entity = born.label?.trim();
  return entity && entity !== stage ? `${stage} · ${entity}` : stage;
}
