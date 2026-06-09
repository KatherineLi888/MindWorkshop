export type ReviewKind = "period" | "goal" | "event" | "decision";

export type PeriodPreset =
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "half_year"
  | "year"
  | "custom";

export type ReviewHighlight = {
  id: string;
  statKey: string;
  statLabel: string;
  statValue: string;
  anomaly?: boolean;
  reflection: string;
};

export type ReviewRecord = {
  id: string;
  kind: ReviewKind;
  title: string;
  periodPreset?: PeriodPreset;
  periodStart?: string;
  periodEnd?: string;
  goalId?: string;
  goalTitle?: string;
  krId?: string;
  krLabel?: string;
  decisionId?: string;
  decisionTitle?: string;
  eventNote?: string;
  /** 决策复盘：亮点 / 不足 / 总结 */
  decisionHighlights?: string;
  decisionGaps?: string;
  decisionSummary?: string;
  /** 用户选择的统计板块 key */
  selectedStatKeys?: string[];
  highlights: ReviewHighlight[];
  summary: string;
  createdAt: string;
  updatedAt: string;
};

export type PeriodStatItem = {
  key: string;
  label: string;
  value: string;
  numericValue?: number;
  anomaly?: boolean;
  anomalyHint?: string;
};

export type PeriodMiniFunnel = {
  thinking: number;
  decisions: number;
  goals: number;
  track: number;
};

export type PeriodStatsSnapshot = {
  periodStart: string;
  periodEnd: string;
  triageCount: number;
  thinkingCount: number;
  decisionCount: number;
  goalCount: number;
  trackCount: number;
  funnel: PeriodMiniFunnel;
  items: PeriodStatItem[];
};
