import type { FlowAnswers } from "./flow";
import {
  hasMultiValueSelection,
  rebuildHistoryFromAnswers,
  isAbandonTerminal,
} from "./flow";

export type DecisionExecutorTag = "self" | "delegate";
export type DecisionHorizonTag = "short" | "long";
export type DecisionOutcomeTag = "proceed" | "abandon";

export type DecisionTags = {
  tag_executor: DecisionExecutorTag | null;
  tag_horizon: DecisionHorizonTag | null;
  tag_outcome: DecisionOutcomeTag;
};

export const EXECUTOR_LABELS: Record<DecisionExecutorTag, string> = {
  self: "自己做",
  delegate: "别人做",
};

export const HORIZON_LABELS: Record<DecisionHorizonTag, string> = {
  short: "短期",
  long: "长期",
};

export const OUTCOME_LABELS: Record<DecisionOutcomeTag, string> = {
  proceed: "正常进行",
  abandon: "放弃",
};

/** 来源：主动做 / 被委派 */
export const SOURCE_LABELS = {
  active: "主动做",
  passive: "被委派",
} as const;

/** 根据 flow_state 推导三个展示标签 */
export function computeDecisionTags(answers: FlowAnswers): DecisionTags {
  const history = rebuildHistoryFromAnswers(answers);

  let tag_outcome: DecisionOutcomeTag = "proceed";
  if (history.some((id) => isAbandonTerminal(id))) {
    tag_outcome = "abandon";
  } else if (answers.not_altruism === "drop") {
    tag_outcome = "abandon";
  } else {
    if (
      answers.origin === "active" &&
      history.includes("active_value") &&
      !hasMultiValueSelection(answers, "active_value")
    ) {
      tag_outcome = "abandon";
    }
    if (
      answers.origin === "passive" &&
      history.includes("passive_exchange") &&
      !hasMultiValueSelection(answers, "passive_exchange")
    ) {
      tag_outcome = "abandon";
    }
  }

  let tag_executor: DecisionExecutorTag | null = null;
  if (answers.exec_mode === "self") tag_executor = "self";
  if (answers.exec_mode === "delegate") tag_executor = "delegate";

  let tag_horizon: DecisionHorizonTag | null = null;
  if (answers.cycle === "short") {
    tag_horizon = "short";
  } else if (
    answers.cycle === "long" ||
    answers.long_type === "growth" ||
    answers.long_type === "project"
  ) {
    tag_horizon = "long";
  }

  return { tag_executor, tag_horizon, tag_outcome };
}

export function tagsFromFlowState(
  flowState: Record<string, unknown>
): DecisionTags {
  return computeDecisionTags(flowState as FlowAnswers);
}
