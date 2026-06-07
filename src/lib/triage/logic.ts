import type {
  TriageDestination,
  TriageFocus,
  TriageOrigin,
  TriageRecord,
} from "./types";

export type TriageWizardOption = {
  id: string;
  label: string;
  hint?: string;
  origin?: TriageOrigin;
  focus?: TriageFocus;
  nextStepId?: string;
  destination?: TriageDestination;
};

export type TriageWizardStep = {
  id: string;
  title: string;
  condition?: string;
  options: TriageWizardOption[];
};

export const TRIAGE_DESTINATION_LABELS: Record<TriageDestination, string> = {
  inbox: "收集箱",
  thinking: "思考",
  decisions: "决策",
  goals: "目标",
  track: "追踪",
  knowledge: "知识库",
};

export const TRIAGE_ORIGIN_LABELS: Record<TriageOrigin, string> = {
  flash: "闪念",
  spinning: "脑子里转",
  ongoing: "进行中项目",
  clear: "问题已清楚",
};

export const TRIAGE_FOCUS_LABELS: Record<TriageFocus, string> = {
  unclear_what: "说不清问题是什么",
  unclear_direction: "大方向未定",
  unclear_details: "方向有，细节纠结",
  ongoing_blocked: "推进遇阻",
  ongoing_review: "复盘进展",
  ongoing_adjust: "调整目标或节奏",
  clear_explore: "摊开可能性继续想",
  clear_decide: "做不做 / 何时做",
  clear_goal: "落成目标与计划",
  clear_blocked: "清楚但仍遇阻",
  clear_knowledge: "知识库系统梳理",
};

/** @deprecated 旧记录兼容 */
export const TRIAGE_CLARITY_LABELS: Record<string, string> = {
  flash: "闪念",
  unclear: "未想清楚",
  clear: "已清楚",
};

export const DEFAULT_TRIAGE_WIZARD: TriageWizardStep[] = [
  {
    id: "origin",
    title: "步骤 1 · 这件事是什么性质？",
    options: [
      {
        id: "flash",
        label: "只是一个闪念，还谈不上问题",
        origin: "flash",
        destination: "inbox",
      },
      {
        id: "spinning",
        label: "有件事在脑子里转，但还没捋清楚",
        origin: "spinning",
        nextStepId: "spinning-focus",
      },
      {
        id: "ongoing",
        label: "本来就在推进中的事 / 项目",
        origin: "ongoing",
        nextStepId: "ongoing-focus",
      },
      {
        id: "clear",
        label: "问题已经比较清楚了",
        origin: "clear",
        nextStepId: "clear-needs",
      },
    ],
  },
  {
    id: "spinning-focus",
    title: "步骤 2 · 主要卡在哪里？",
    condition: "来自「脑子里转，还没捋清楚」",
    options: [
      {
        id: "unclear_what",
        label: "说不清「问题」到底是什么",
        hint: "先进入思考，把问题本身摊开",
        origin: "spinning",
        focus: "unclear_what",
        destination: "thinking",
      },
      {
        id: "unclear_direction",
        label: "大方向还没想好",
        hint: "先明确大概方向，再往下拆",
        origin: "spinning",
        focus: "unclear_direction",
        destination: "thinking",
      },
      {
        id: "unclear_details",
        label: "方向大概有了，卡在担心点或选项",
        hint: "理清担心点后，可能进入决策",
        origin: "spinning",
        focus: "unclear_details",
        destination: "thinking",
      },
    ],
  },
  {
    id: "ongoing-focus",
    title: "步骤 2 · 关于这件进行中的事，你现在需要？",
    condition: "来自「正在推进中的事 / 项目」",
    options: [
      {
        id: "ongoing_blocked",
        label: "推进中遇到了要想办法的问题",
        origin: "ongoing",
        focus: "ongoing_blocked",
        destination: "track",
      },
      {
        id: "ongoing_review",
        label: "想复盘一下进展与卡点",
        origin: "ongoing",
        focus: "ongoing_review",
        destination: "track",
      },
      {
        id: "ongoing_adjust",
        label: "想调整目标、方向或节奏",
        origin: "ongoing",
        focus: "ongoing_adjust",
        destination: "goals",
      },
    ],
  },
  {
    id: "clear-needs",
    title: "步骤 2 · 现在更需要的是？",
    condition: "来自「问题已经比较清楚」",
    options: [
      {
        id: "clear_explore",
        label: "把可能性摊开，继续想",
        origin: "clear",
        focus: "clear_explore",
        destination: "thinking",
      },
      {
        id: "clear_decide",
        label: "做不做 / 何时做（时间安排）",
        hint: "决策侧重时间与取舍，而非继续发散",
        origin: "clear",
        focus: "clear_decide",
        destination: "decisions",
      },
      {
        id: "clear_goal",
        label: "已经决定要做，落成目标与计划",
        origin: "clear",
        focus: "clear_goal",
        destination: "goals",
      },
      {
        id: "clear_blocked",
        label: "正在推进，遇到了要想办法的问题",
        origin: "clear",
        focus: "clear_blocked",
        destination: "track",
      },
      {
        id: "clear_knowledge",
        label: "到知识库做系统梳理（理论 / 模型 / 画布）",
        hint: "大面积梳理建议先经过思考或决策；也可直接进入",
        origin: "clear",
        focus: "clear_knowledge",
        destination: "knowledge",
      },
    ],
  },
];

const FOCUS_DESTINATION: Record<TriageFocus, TriageDestination> = {
  unclear_what: "thinking",
  unclear_direction: "thinking",
  unclear_details: "thinking",
  ongoing_blocked: "track",
  ongoing_review: "track",
  ongoing_adjust: "goals",
  clear_explore: "thinking",
  clear_decide: "decisions",
  clear_goal: "goals",
  clear_blocked: "track",
  clear_knowledge: "knowledge",
};

const ORIGIN_DESTINATION: Partial<Record<TriageOrigin, TriageDestination>> = {
  flash: "inbox",
};

export function resolveDestination(
  origin: TriageOrigin,
  focus: TriageFocus | null
): TriageDestination {
  if (origin === "flash") return "inbox";
  if (focus) return FOCUS_DESTINATION[focus];
  return ORIGIN_DESTINATION[origin] ?? "thinking";
}

export function getWizardParentStepId(stepId: string): string | null {
  if (stepId === "origin") return null;
  return "origin";
}

export function findWizardOption(
  steps: TriageWizardStep[],
  stepId: string,
  optionId: string
): TriageWizardOption | undefined {
  return steps
    .find((s) => s.id === stepId)
    ?.options.find((o) => o.id === optionId);
}

export function getRecordOriginLabel(record: TriageRecord): string {
  if (record.origin) return TRIAGE_ORIGIN_LABELS[record.origin];
  if (record.problemClarity)
    return TRIAGE_CLARITY_LABELS[record.problemClarity] ?? record.problemClarity;
  return "—";
}

export function getRecordFocusLabel(record: TriageRecord): string {
  if (record.focus) return TRIAGE_FOCUS_LABELS[record.focus];
  if (record.direction) {
    const map: Record<string, string> = {
      explore: "摊开继续想",
      choose: "做选择",
      commit: "落成目标",
      blocked: "推进遇阻",
    };
    return map[record.direction] ?? record.direction;
  }
  return "";
}

export function wizardToExportRows(steps: TriageWizardStep[]) {
  const rows: Record<string, string>[] = [];
  for (const step of steps) {
    for (const opt of step.options) {
      rows.push({
        步骤: step.title,
        条件: step.condition ?? "",
        选项: opt.label,
        提示: opt.hint ?? "",
        去向: opt.destination
          ? TRIAGE_DESTINATION_LABELS[opt.destination]
          : opt.nextStepId
            ? "下一步"
            : "",
      });
    }
  }
  return rows;
}
