/** 理论意图：仅观察 vs 候选执行理论 */
export type TheoryIntent = "observe" | "execute";

/** 理论验证状态 */
export type TheoryStatus =
  | "captured"
  | "verifying"
  | "validated"
  | "refuted"
  | "promoted";

export type TheoryStep = {
  id: string;
  content: string;
};

export type TheoryEvidenceOutcome = "support" | "refute" | "partial" | "note";

export type TheoryEvidence = {
  id: string;
  scenario: string;
  outcome: TheoryEvidenceOutcome;
  note: string;
  createdAt: string;
};

/** 理论库条目 */
export type StoredTheory = {
  id: string;
  title: string;
  /** 核心表述 */
  statement: string;
  /** 出处（课、书、人） */
  source: string;
  intent: TheoryIntent;
  status: TheoryStatus;
  /** 在什么场景下可能成立 */
  applicableWhen: string;
  /** 在什么场景下可能不成立 */
  counterWhen: string;
  /** SOP 雏形：先 A 再 B */
  steps: TheoryStep[];
  evidence: TheoryEvidence[];
  promotedModelId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};
