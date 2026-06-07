export type ReviewKind = "period" | "goal" | "event";

export type PeriodPreset = "day" | "week" | "month" | "custom";

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
  eventNote?: string;
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
