import type { FlowStage } from "@/lib/flow/types";

/** 种子可出现的所有阶段（含流程外起源） */
export type SeedStage =
  | FlowStage
  | "review"
  | "home"
  | "model"
  | "theory"
  | "canvas"
  | "inbox";

export type SeedStatus = "active" | "ended";

/** 萌芽中=仅单阶段 · 生长中=已跨阶段 · 已归档=已结束 */
export type SeedPhase = "sprouting" | "growing" | "archived";

export type SeedEventAction =
  | "born"
  | "entered"
  | "jumped"
  | "loopback"
  | "abandoned"
  | "ended";

export type SeedLifeEvent = {
  id: string;
  stage: SeedStage;
  entityType: string;
  entityId: string;
  label: string;
  action: SeedEventAction;
  /** 该时间点发生了什么 */
  summary?: string;
  createdAt: string;
};

export type IdeaSeed = {
  id: string;
  title: string;
  status: SeedStatus;
  endReason?: string;
  events: SeedLifeEvent[];
  createdAt: string;
  updatedAt: string;
};

export type SeedSummary = {
  sprouting: number;
  growing: number;
  archived: number;
  /** 仪表盘优先展示：当下生长中 */
  spotlight: IdeaSeed[];
  recent: IdeaSeed[];
};
