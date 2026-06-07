import {
  getStep,
  getStepLabel,
  getStepNotes,
  rebuildHistoryFromAnswers,
  type FlowAnswers,
} from "./flow";

/** 实际做出的选择（比步骤名更重要） */
export type DecisionChoiceRecord = {
  stepId: string;
  /** 步骤语境，小字 */
  context: string;
  /** 你的具体选择 */
  choice: string;
  /** 决策流程中该步旁注 */
  flowNote?: string;
};

function choiceLabelForStep(stepId: string, answers: FlowAnswers): string {
  const step = getStep(stepId, answers);
  if (!step) return getStepLabel(stepId);

  if (step.type === "terminal") {
    return step.question.replace(/^结论：/, "").trim();
  }

  if (step.type === "confirm_flow") {
    return answers.flow_ok ? "内心确认：方向 OK" : "内心确认";
  }

  if (step.type === "choice") {
    const v = answers[stepId] as string | undefined;
    const opt = step.options?.find((o) => o.value === v);
    return opt?.label ?? (v ? String(v) : "—");
  }

  if (step.type === "multi") {
    const sel = (answers[stepId] as string[]) || [];
    if (sel.length === 0) return "未勾选（视为放弃）";
    return (
      step.options
        ?.filter((o) => sel.includes(o.value))
        .map((o) => o.label)
        .join("；") ?? sel.join("、")
    );
  }

  if (step.type === "project_node") {
    const id = answers.project_node as string | undefined;
    const node = step.projectNodes?.find((n) => n.id === id);
    return node?.label ?? (id ? String(id) : "—");
  }

  return "—";
}

const SKIP_IN_CHOICE_LOG = new Set(["flow_confirm"]);

/** 按真实历史顺序列出「具体选择」，非泛化流程名 */
export function buildDecisionChoiceRecords(
  answers: FlowAnswers
): DecisionChoiceRecord[] {
  const history = rebuildHistoryFromAnswers(answers);
  const flowNotes = getStepNotes(answers);

  return history
    .filter((stepId) => !SKIP_IN_CHOICE_LOG.has(stepId))
    .map((stepId) => {
      const context = getStepLabel(stepId);
      const choice = choiceLabelForStep(stepId, answers);
      const flowNote = flowNotes[stepId]?.trim() || undefined;
      return { stepId, context, choice, flowNote };
    });
}
