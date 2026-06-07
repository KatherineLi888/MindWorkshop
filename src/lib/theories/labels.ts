import type { TheoryEvidenceOutcome, TheoryIntent, TheoryStatus } from "./types";

export const THEORY_INTENT_LABELS: Record<TheoryIntent, string> = {
  observe: "仅记录",
  execute: "候选执行理论",
};

export const THEORY_STATUS_LABELS: Record<TheoryStatus, string> = {
  captured: "刚收录",
  verifying: "验证中",
  validated: "已确认",
  refuted: "已证伪",
  promoted: "已升格为模型",
};

export const THEORY_STATUS_COLORS: Record<TheoryStatus, string> = {
  captured: "bg-slate-100 text-slate-600",
  verifying: "bg-amber-50 text-amber-700",
  validated: "bg-emerald-50 text-emerald-700",
  refuted: "bg-red-50 text-red-600",
  promoted: "bg-violet-50 text-violet-700",
};

export const THEORY_EVIDENCE_OUTCOME_LABELS: Record<
  TheoryEvidenceOutcome,
  string
> = {
  support: "支持",
  refute: "反驳",
  partial: "部分成立",
  note: "记录",
};
