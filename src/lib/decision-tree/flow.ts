/** 时间管理决策树 · 状态机 */

export type DecisionSource = "active" | "passive";

export type FlowAnswers = Record<string, string | string[] | boolean> & {
  step_notes?: Record<string, string>;
};

export type FlowStep = {
  id: string;
  question: string;
  type:
    | "choice"
    | "multi"
    | "text"
    | "confirm_flow"
    | "project_node"
    | "terminal";
  options?: { value: string; label: string }[];
  projectNodes?: { id: string; label: string }[];
  /** terminal 步骤是否为放弃结局 */
  abandon?: boolean;
};

/** 需要填写备注的步骤 */
export const STEPS_WITH_NOTES = [
  "active_value",
  "passive_exchange",
  "exec_mode",
  "cycle",
  "short_convert",
  "long_type",
  "project_eval",
  "altruism",
  "not_altruism",
  "project_loop",
] as const;

/** 放弃类终点（图上灰色删除线） */
export const ABANDON_TERMINAL_IDS = [
  "end_no_value_active",
  "end_no_exchange",
  "end_short_once",
  "end_drop",
] as const;

const TERMINAL_IDS = [
  ...ABANDON_TERMINAL_IDS,
  "end_growth",
  "end_altruism",
  "end_redesign",
  "end_project_good",
] as const;

export function getStepNotes(answers: FlowAnswers): Record<string, string> {
  return answers.step_notes ?? {};
}

export function withStepNote(
  answers: FlowAnswers,
  stepId: string,
  note: string
): FlowAnswers {
  const trimmed = note.trim();
  const prev = getStepNotes(answers);
  if (!trimmed) {
    const { [stepId]: _, ...rest } = prev;
    return { ...answers, step_notes: Object.keys(rest).length ? rest : undefined };
  }
  return { ...answers, step_notes: { ...prev, [stepId]: trimmed } };
}

export function isAbandonTerminal(stepId: string): boolean {
  return (ABANDON_TERMINAL_IDS as readonly string[]).includes(stepId);
}

export function isTerminalStep(stepId: string): boolean {
  return (TERMINAL_IDS as readonly string[]).includes(stepId);
}

export function stepAllowsNotes(stepId: string): boolean {
  return (STEPS_WITH_NOTES as readonly string[]).includes(stepId);
}

/** 决策图节点 id → 备注绑定的步骤 id */
export const TREE_NODE_NOTE_STEP: Record<string, string> = {
  active_value: "active_value",
  passive_exchange: "passive_exchange",
  exec_mode: "exec_mode",
  cycle: "cycle",
  short_convert: "short_convert",
  long_type: "long_type",
  project_loop: "project_loop",
  project_eval: "project_eval",
  altruism: "altruism",
  not_altruism: "not_altruism",
};

/** 决策记录等：简短问句，对应这一步在回答什么 */
export const STEP_CONTEXT_LABELS: Record<string, string> = {
  origin: "主动想做，还是被委派？",
  active_value: "值得做吗？",
  passive_exchange: "有交换价值吗？",
  exec_mode: "谁来做？",
  cycle: "短期还是长期？",
  short_convert: "做完能转长期吗？",
  long_type: "项目制还是自我投资？",
  project_loop: "项目在哪一步？",
  project_eval: "项目效果如何？",
  altruism: "对执行者有利吗？",
  not_altruism: "不利他时怎么办？",
  flow_confirm: "内心认同这方向吗？",
  end_no_value_active: "不值得做",
  end_no_exchange: "无交换价值",
  end_short_once: "单次完成",
  end_growth: "自我投资",
  end_altruism: "利他委派",
  end_drop: "直接放弃",
  end_redesign: "重设计后委派",
  end_project_good: "持续优化",
};

/** 决策树节点框内：更短的问句标签 */
export const STEP_TREE_LABELS: Record<string, string> = {
  origin: "主动/委派?",
  active_value: "值得做?",
  passive_exchange: "有交换?",
  exec_mode: "谁来做",
  cycle: "短长期?",
  short_convert: "转长期?",
  long_type: "项/投资?",
  project_loop: "项目步",
  project_eval: "效果好?",
  altruism: "利他?",
  not_altruism: "不利他?",
  flow_confirm: "确认",
  end_no_value_active: "放弃",
  end_no_exchange: "放弃",
  end_short_once: "单次",
  end_growth: "投资",
  end_altruism: "利他",
  end_drop: "放弃",
  end_redesign: "重设计",
  end_project_good: "优化",
};

/** @deprecated 使用 getStepLabel */
export const STEP_LABELS = STEP_CONTEXT_LABELS;

export function getStepLabel(stepId: string): string {
  return STEP_CONTEXT_LABELS[stepId] ?? stepId;
}

export function getTreeNodeLabel(stepId: string): string {
  return STEP_TREE_LABELS[stepId] ?? getStepLabel(stepId);
}

export function noteStepIdForTreeNode(nodeId: string): string | null {
  return TREE_NODE_NOTE_STEP[nodeId] ?? null;
}

export function getStep(
  stepId: string,
  _answers: FlowAnswers
): FlowStep | null {
  switch (stepId) {
    case "origin":
      return {
        id: "origin",
        question: "这件事是我主动想做的，还是别人让我做的？",
        type: "choice",
        options: [
          { value: "active", label: "主动想做" },
          { value: "passive", label: "被委派" },
        ],
      };
    case "active_value":
      return {
        id: "active_value",
        question: "这件事值得做吗？（可勾选；都不选则视为放弃）",
        type: "multi",
        options: [
          { value: "goal", label: "直接服务于我近期的某个主目标" },
          { value: "trust", label: "来自信任的人/专业人士的诚恳建议" },
        ],
      };
    case "passive_exchange":
      return {
        id: "passive_exchange",
        question: "这件事有交换价值吗？（可勾选；都不选则视为放弃）",
        type: "multi",
        options: [
          { value: "money", label: "货币化：能获得经济回报" },
          { value: "option", label: "期权化：未来看涨或带来选择权" },
        ],
      };
    case "exec_mode":
      return {
        id: "exec_mode",
        question: "谁来做？",
        type: "choice",
        options: [
          { value: "self", label: "自己执行" },
          { value: "delegate", label: "委派他人" },
        ],
      };
    case "cycle":
      return {
        id: "cycle",
        question: "这是短期任务还是长期事项？",
        type: "choice",
        options: [
          { value: "short", label: "短期" },
          { value: "long", label: "长期" },
        ],
      };
    case "short_convert":
      return {
        id: "short_convert",
        question: "完成后，有无可能转化为长期价值？",
        type: "choice",
        options: [
          { value: "once", label: "仅单次利益（做完即结束）" },
          { value: "convert", label: "可能转长期" },
        ],
      };
    case "long_type":
      return {
        id: "long_type",
        question: "这是项目制的事，还是个人长期自我投资？",
        type: "choice",
        options: [
          { value: "project", label: "项目制" },
          { value: "growth", label: "自我投资" },
        ],
      };
    case "project_loop":
      return {
        id: "project_loop",
        question: "项目健康度循环 · 选择当前节点并记录",
        type: "project_node",
        projectNodes: [
          { id: "feasibility", label: "1. 验证可行性" },
          { id: "mvp", label: "2. 跑通 MVP" },
          { id: "process", label: "3. 流程记录与提效" },
          { id: "evaluate", label: "4. 效果评估" },
        ],
      };
    case "project_eval":
      return {
        id: "project_eval",
        question: "当前项目效果如何？",
        type: "choice",
        options: [
          { value: "good", label: "良好 · 保持并持续优化" },
          { value: "bad", label: "不佳 · 第一性原理重组" },
        ],
      };
    case "altruism":
      return {
        id: "altruism",
        question: "这件事对执行者有利吗（是否利他）？",
        type: "choice",
        options: [
          { value: "yes", label: "利他 · 可以委派" },
          { value: "no", label: "不利他" },
        ],
      };
    case "not_altruism":
      return {
        id: "not_altruism",
        question: "不利他时如何处理？",
        type: "choice",
        options: [
          { value: "drop", label: "直接放弃" },
          { value: "redesign", label: "转为利他方式后委派" },
        ],
      };
    case "end_no_value_active":
      return {
        id: "end_no_value_active",
        question: "结论：不值得做，放弃此事。",
        type: "terminal",
        abandon: true,
      };
    case "end_no_exchange":
      return {
        id: "end_no_exchange",
        question: "结论：没有交换价值，不做。",
        type: "terminal",
        abandon: true,
      };
    case "end_short_once":
      return {
        id: "end_short_once",
        question: "结论：作为单次任务完成即可。",
        type: "terminal",
        abandon: false,
      };
    case "end_growth":
      return {
        id: "end_growth",
        question: "结论：纳入自我成长，持续投入。",
        type: "terminal",
        abandon: false,
      };
    case "end_altruism":
      return {
        id: "end_altruism",
        question: "结论：利他委派，建立双赢。",
        type: "terminal",
        abandon: false,
      };
    case "end_drop":
      return {
        id: "end_drop",
        question: "结论：直接放弃，不再投入。",
        type: "terminal",
        abandon: true,
      };
    case "end_redesign":
      return {
        id: "end_redesign",
        question: "结论：重新设计为利他方式后再委派。",
        type: "terminal",
        abandon: false,
      };
    case "end_project_good":
      return {
        id: "end_project_good",
        question: "结论：效果良好，保持并持续优化。",
        type: "terminal",
        abandon: false,
      };
    case "flow_confirm":
      return {
        id: "flow_confirm",
        question:
          "凭直觉感受：这个决策方向让你内心是充满能量，还是感到沉重？确认后再完成记录。",
        type: "confirm_flow",
      };
    default:
      return null;
  }
}

/** 终点之后统一进入心流确认 */
function afterTerminal(_current: string): "flow_confirm" {
  return "flow_confirm";
}

const VALUE_CUSTOM_KEYS = {
  active_value: "active_value_custom",
  passive_exchange: "passive_exchange_custom",
} as const;

export function hasMultiValueSelection(
  answers: FlowAnswers,
  step: "active_value" | "passive_exchange"
): boolean {
  const sel = (answers[step] as string[]) || [];
  const custom = String(
    answers[VALUE_CUSTOM_KEYS[step]] ?? ""
  ).trim();
  return sel.length > 0 || custom.length > 0;
}

export function valueSelectionLabels(
  answers: FlowAnswers,
  step: "active_value" | "passive_exchange",
  optionLabels: Record<string, string>
): string[] {
  const sel = (answers[step] as string[]) || [];
  const labels = sel.map((v) => optionLabels[v] ?? v);
  const custom = String(answers[VALUE_CUSTOM_KEYS[step]] ?? "").trim();
  if (custom) labels.push(custom);
  return labels;
}

export function nextStepId(
  current: string,
  answers: FlowAnswers
): string | "DONE" {
  const a = answers;

  if (current === "origin") {
    return a.origin === "passive" ? "passive_exchange" : "active_value";
  }

  if (current === "active_value") {
    if (!hasMultiValueSelection(a, "active_value")) return "end_no_value_active";
    return "exec_mode";
  }

  if (current === "passive_exchange") {
    if (!hasMultiValueSelection(a, "passive_exchange"))
      return "end_no_exchange";
    return "exec_mode";
  }

  if (current === "exec_mode") {
    return a.exec_mode === "delegate" ? "altruism" : "cycle";
  }

  if (current === "cycle") {
    return a.cycle === "short" ? "short_convert" : "long_type";
  }

  if (current === "short_convert") {
    return a.short_convert === "once" ? "end_short_once" : "long_type";
  }

  if (current === "long_type") {
    return a.long_type === "project" ? "project_loop" : "end_growth";
  }

  if (current === "project_loop") {
    if (a.project_node === "evaluate") return "project_eval";
    return "project_loop";
  }

  if (current === "project_eval") {
    return a.project_eval === "bad" ? "project_loop" : "end_project_good";
  }

  if (current === "altruism") {
    return a.altruism === "no" ? "not_altruism" : "end_altruism";
  }

  if (current === "not_altruism") {
    return a.not_altruism === "drop" ? "end_drop" : "end_redesign";
  }

  if (isTerminalStep(current)) {
    return afterTerminal(current);
  }

  if (current === "flow_confirm") {
    return "DONE";
  }

  return "DONE";
}

export function buildPathSummary(answers: FlowAnswers): string {
  const parts: string[] = [];
  const notes = getStepNotes(answers);

  if (answers.origin === "active") parts.push("主动做");
  else if (answers.origin === "passive") parts.push("被委派");

  if (answers.active_value || answers.active_value_custom) {
    const sel = (answers.active_value as string[]) || [];
    const custom = String(answers.active_value_custom ?? "").trim();
    const bits = [...sel];
    if (custom) bits.push(custom);
    parts.push(bits.length ? `价值:${bits.join("+")}` : "价值:放弃");
  }
  if (answers.passive_exchange || answers.passive_exchange_custom) {
    const sel = (answers.passive_exchange as string[]) || [];
    const custom = String(answers.passive_exchange_custom ?? "").trim();
    const bits = [...sel];
    if (custom) bits.push(custom);
    parts.push(bits.length ? `交换:${bits.join("+")}` : "交换:放弃");
  }
  if (answers.exec_mode)
    parts.push(answers.exec_mode === "self" ? "自己执行" : "委派");
  if (answers.cycle) parts.push(answers.cycle === "short" ? "短期" : "长期");
  if (answers.short_convert)
    parts.push(
      answers.short_convert === "once" ? "单次完成" : "可转长期"
    );
  if (answers.long_type)
    parts.push(answers.long_type === "project" ? "项目制" : "自我投资");
  if (answers.project_node) parts.push(`项目:${answers.project_node}`);
  if (answers.project_eval)
    parts.push(answers.project_eval === "good" ? "效果良好" : "重组");
  if (answers.altruism)
    parts.push(answers.altruism === "yes" ? "利他委派" : "非利他");
  if (answers.not_altruism)
    parts.push(
      answers.not_altruism === "drop" ? "放弃" : "重设计委派"
    );

  const noteBits = Object.entries(notes)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}:${v.slice(0, 20)}`);
  if (noteBits.length) parts.push(`备注(${noteBits.join("; ")})`);

  return parts.join(" → ");
}

export function resolveFinalAction(
  answers: FlowAnswers,
  lastStep: string
): string {
  if (lastStep === "end_no_value_active" || lastStep === "active_value") {
    if (!hasMultiValueSelection(answers, "active_value"))
      return "彻底放弃，不做";
  }
  if (lastStep === "end_no_exchange" || lastStep === "passive_exchange") {
    if (!hasMultiValueSelection(answers, "passive_exchange"))
      return "没有交换价值，不做";
  }
  if (lastStep === "end_short_once" || answers.short_convert === "once")
    return "快速执行，单次完成";
  if (lastStep === "end_growth" || answers.long_type === "growth")
    return "纳入自我成长计划，持续投入";
  if (lastStep === "end_project_good" || answers.project_eval === "good")
    return "保持并持续优化";
  if (answers.project_eval === "bad")
    return "第一性原理重组，回到验证可行性";
  if (lastStep === "end_altruism" || answers.altruism === "yes")
    return "安排委派，建立双赢交换";
  if (lastStep === "end_drop" || answers.not_altruism === "drop")
    return "直接放弃";
  if (lastStep === "end_redesign" || answers.not_altruism === "redesign")
    return "转为利他方式后委派";
  if (answers.long_type === "project") return "项目制循环推进中";
  if (answers.short_convert === "convert") return "转为长期可持续事项";
  return "按决策路径执行";
}

export function initialStepId() {
  return "origin";
}

/** 根据已保存答案还原走过的步骤链（用于详情页路径图） */
export function rebuildHistoryFromAnswers(answers: FlowAnswers): string[] {
  const history: string[] = [initialStepId()];
  let stepId = initialStepId();
  const seen = new Set<string>([stepId]);

  for (let i = 0; i < 32; i++) {
    const next = nextStepId(stepId, answers);
    if (next === "DONE") break;
    if (next === stepId) break;
    history.push(next);
    if (seen.has(next)) break;
    seen.add(next);
    stepId = next;
  }

  if (answers.flow_ok && !history.includes("flow_confirm")) {
    const last = history[history.length - 1];
    if (isTerminalStep(last)) {
      history.push("flow_confirm");
    }
  }

  return history;
}
