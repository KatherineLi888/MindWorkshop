import type { EntityType } from "@/types/database";

export type FlowStage =
  | "inbox"
  | "thinking"
  | "decisions"
  | "goals"
  | "track";

export const FLOW_STAGE_LABELS: Record<FlowStage, string> = {
  inbox: "收集箱",
  thinking: "思考",
  decisions: "决策",
  goals: "目标",
  track: "追踪",
};

export const FLOW_STAGE_HREFS: Record<FlowStage, string> = {
  inbox: "/inbox",
  thinking: "/thinking",
  decisions: "/decisions",
  goals: "/goals",
  track: "/graph",
};

export const FLOW_STAGE_ORDER: FlowStage[] = [
  "inbox",
  "thinking",
  "decisions",
  "goals",
  "track",
];

export type FlowEntityRef = {
  stage: FlowStage;
  entityType: EntityType | "inbox_manual" | "goal_pending";
  entityId: string;
  title: string;
  href: string;
  updatedAt: string;
};

export type FlowBlockMeta = {
  entityKey: string;
  entityType: string;
  entityId: string;
  stage: FlowStage;
  blockReason: string | null;
  blockPending: boolean;
  updatedAt: string;
};

export type FunnelItemView = FlowEntityRef & {
  progressed: boolean;
  blockReason: string | null;
  blockPending: boolean;
};

export type FunnelStageView = {
  stage: FlowStage;
  label: string;
  href: string;
  total: number;
  progressed: number;
  stuck: number;
  items: FunnelItemView[];
};

export type FunnelSnapshot = {
  stages: FunnelStageView[];
  updatedAt: string;
};

/** 线性漏斗：收集箱 → … → 追踪，逐层下漏 */
export type LinearFunnelStep = {
  stage: FlowStage;
  label: string;
  href: string;
  count: number;
  leakToNext: number;
  leakRate: number;
  dropAtStage: number;
  stuck: number;
};

/** 跳入漏斗：从某一阶段直接进入后的留存 */
export type JumpInRetentionStep = {
  stage: FlowStage;
  label: string;
  reached: number;
  rate: number;
};

export type JumpInCohort = {
  entryStage: FlowStage;
  label: string;
  entries: number;
  viaDirect: number;
  viaWizard: number;
  retention: JumpInRetentionStep[];
};

export type JumpMatrixColumn = {
  stage: FlowStage;
  label: string;
};

export type JumpMatrixRow = {
  stage: FlowStage;
  label: string;
};

export type JumpMatrixData = {
  columns: JumpMatrixColumn[];
  rows: JumpMatrixRow[];
  cells: number[][];
  columnTotals: number[];
  columnFunnels: {
    stage: FlowStage;
    label: string;
    count: number;
    rate: number;
  }[][];
};

export type JumpEntryInsight = {
  entryStage: FlowStage;
  label: string;
  total: number;
  biggestLeak: {
    fromLabel: string;
    toLabel: string;
    drop: number;
    dropRate: number;
  } | null;
};

export type StageLeakStat = {
  fromStage: FlowStage;
  toStage: FlowStage;
  fromLabel: string;
  toLabel: string;
  entered: number;
  progressed: number;
  dropped: number;
  lossRate: number;
  retainRate: number;
};

export type FunnelDeepAnalytics = {
  stageLeaks: StageLeakStat[];
  worstLeak: StageLeakStat | null;
  strengthenAt: {
    stage: FlowStage;
    label: string;
    href: string;
    hint: string;
  } | null;
  mostUsedEntry: { stage: FlowStage; label: string; total: number } | null;
  leastUsedEntry: { stage: FlowStage; label: string; total: number } | null;
};

export type TrackLoopbackStep = {
  toStage: FlowStage;
  label: string;
  count: number;
  rate: number;
};

export type TrackLoopbackData = {
  trackTotal: number;
  loopbackTotal: number;
  steps: TrackLoopbackStep[];
};

export type FullFunnelAnalytics = {
  /** 收集箱中尚未跳入下游的条数 */
  inboxPending: number;
  linear: LinearFunnelStep[];
  /** 从追踪回转至思考/决策/目标 */
  trackLoopback: TrackLoopbackData;
  jumpMatrix: JumpMatrixData;
  /** 跳入最多的入口 */
  topEntry: JumpEntryInsight | null;
  /** 各入口漏损洞察（按跳入量排序） */
  entryInsights: JumpEntryInsight[];
  deep: FunnelDeepAnalytics;
  /** @deprecated 已由 jumpMatrix 替代 */
  jumpIn: JumpInCohort[];
  snapshot: FunnelSnapshot;
  updatedAt: string;
};

export function flowEntityKey(
  entityType: string,
  entityId: string
): string {
  return `${entityType}:${entityId}`;
}
