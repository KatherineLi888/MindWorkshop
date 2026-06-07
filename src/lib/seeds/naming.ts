import { UNNAMED_SEED_TITLE } from "./constants";
import { seedStageLabel } from "./labels";
import type { SeedStage } from "./types";

const STAGE_ORIGIN: Partial<Record<SeedStage, string>> = {
  home: "首页",
  inbox: "收集箱",
  thinking: "思考",
  decisions: "决策",
  goals: "目标",
  track: "追踪",
  review: "复盘",
  model: "模型",
  theory: "理论",
  canvas: "画布",
};

const ENTITY_ACTION: Record<string, string> = {
  triage: "写下闪念",
  inbox_manual: "收入收集箱",
  thinking_session: "开启思考",
  decision: "创建决策",
  goal: "创建目标",
  graph_node: "记录问题",
  thinking_model: "新建模型",
  theory: "收录理论",
  model_application: "套用模型",
  review_record: "撰写复盘",
  canvas_document: "创建画布",
};

function cleanDetail(text?: string): string {
  const t = text?.trim();
  if (!t || t.length < 2) return "";
  return t.length > 36 ? `${t.slice(0, 36)}…` : t;
}

/** 种子独立命名：起自{来源阶段} · {动作}「详情」 */
export function buildSeedTitle(input: {
  stage: SeedStage;
  entityType: string;
  detail?: string;
}): string {
  const origin = STAGE_ORIGIN[input.stage] ?? seedStageLabel(input.stage);
  const action =
    ENTITY_ACTION[input.entityType] ?? `起始于${seedStageLabel(input.stage)}`;
  const detail = cleanDetail(input.detail);
  if (!detail) {
    return `起自${origin} · ${action}`;
  }
  return `起自${origin} · ${action}「${detail}」`;
}

/** 无阶段信息时的兜底名 */
export function fallbackSeedTitle(): string {
  return UNNAMED_SEED_TITLE;
}

export function isUnnamedSeedTitle(title: string): boolean {
  return !title?.trim() || title === UNNAMED_SEED_TITLE;
}
