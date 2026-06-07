import type { EntityType } from "@/types/database";

export const ENTITY_LABELS: Record<EntityType, string> = {
  decision: "决策",
  goal: "目标",
  graph_node: "追踪节点",
  thinking_session: "思考会话",
  model_application: "模型套用",
  canvas_document: "画布文档",
  thinking_model: "思维模型",
  self_check: "自检笔记",
  canvas_node: "知识节点",
  inbox: "收集箱",
};
