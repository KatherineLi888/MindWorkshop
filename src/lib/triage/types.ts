export type TriageDestination =
  | "inbox"
  | "thinking"
  | "decisions"
  | "goals"
  | "track"
  | "knowledge";

/** 步骤 1：这件事是什么性质 */
export type TriageOrigin = "flash" | "spinning" | "ongoing" | "clear";

/** 各分支下的具体定位 */
export type TriageFocus =
  | "unclear_what"
  | "unclear_direction"
  | "unclear_details"
  | "ongoing_blocked"
  | "ongoing_review"
  | "ongoing_adjust"
  | "clear_explore"
  | "clear_decide"
  | "clear_goal"
  | "clear_blocked"
  | "clear_knowledge";

/** @deprecated 旧版记录字段，读取时兼容 */
export type TriageProblemClarity = "flash" | "unclear" | "clear";

/** @deprecated 旧版记录字段，读取时兼容 */
export type TriageDirection =
  | "explore"
  | "choose"
  | "commit"
  | "blocked";

export type TriageRecord = {
  id: string;
  rawText: string;
  summary: string;
  worryPoints: string[];
  origin: TriageOrigin;
  focus: TriageFocus | null;
  destination: TriageDestination;
  targetEntityId?: string;
  targetEntityType?: string;
  entryMode?: "wizard" | "direct";
  createdAt: string;
  /** @deprecated */
  problemClarity?: TriageProblemClarity;
  /** @deprecated */
  direction?: TriageDirection | null;
};
