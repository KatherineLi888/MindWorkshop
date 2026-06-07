export type ModelKind = "quadrant" | "stage" | "funnel" | "grid";

export type AxisLabels = {
  low: string;
  high: string;
};

export type QuadrantRegion = {
  id: string;
  label: string;
  definition: string;
  traits: string;
};

export type QuadrantConfig = {
  cols: number;
  rows: number;
  xAxis: AxisLabels;
  yAxis: AxisLabels;
  regions: QuadrantRegion[];
};

export type StageItem = {
  id: string;
  name: string;
  description: string;
};

export type StageConfig = {
  stages: StageItem[];
};

export type FunnelLevel = {
  id: string;
  name: string;
  description: string;
};

export type FunnelConfig = {
  levels: FunnelLevel[];
};

export type GridCell = {
  id: string;
  title: string;
  definition: string;
};

export type GridConfig = {
  cols: number;
  rows: number;
  cells: GridCell[];
};

export type ModelConfig =
  | QuadrantConfig
  | StageConfig
  | FunnelConfig
  | GridConfig;

export type ModelDefinition = {
  name: string;
  description: string;
  kind: ModelKind;
  applicableScenarios: string;
  inspirations: string;
  usageNotes: string;
  config: ModelConfig;
};

/** 模型库中的模型（内置 + 用户新建，统一列表） */
export type StoredModel = ModelDefinition & {
  id: string;
  tags: string[];
  source: string;
  builtin?: boolean;
  createdAt: string;
  updatedAt: string;
};

/** @deprecated 使用 StoredModel */
export type UserModel = StoredModel;

/** 套用模型时各槽位填写的内容 */
export type ModelSlotValues = Record<string, string>;

/** 一次模型套用记录 */
export type ModelApplication = {
  id: string;
  modelId: string;
  modelName: string;
  kind: ModelKind;
  scenario: string;
  note: string;
  values: ModelSlotValues;
  configSnapshot: ModelConfig;
  createdAt: string;
  updatedAt: string;
};

export const MODEL_KIND_LABELS: Record<ModelKind, string> = {
  quadrant: "象限矩阵",
  stage: "阶段模型",
  funnel: "漏斗模型",
  grid: "宫格模型",
};
