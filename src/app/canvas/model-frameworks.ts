import type { ModelCell, ModelFrameworkId } from "./types";

export type FrameworkDef = {
  id: ModelFrameworkId;
  name: string;
  description: string;
  cols: number;
  rows: number;
  defaultCells: Omit<ModelCell, "id">[];
};

export const MODEL_FRAMEWORKS: FrameworkDef[] = [
  {
    id: "eisenhower",
    name: "重要紧急四象限",
    description: "艾森豪威尔矩阵：按重要性与紧急性分类",
    cols: 2,
    rows: 2,
    defaultCells: [
      { title: "重要且紧急", content: "" },
      { title: "重要不紧急", content: "" },
      { title: "紧急不重要", content: "" },
      { title: "不重要不紧急", content: "" },
    ],
  },
  {
    id: "swot",
    name: "SWOT 分析",
    description: "优势、劣势、机会、威胁",
    cols: 2,
    rows: 2,
    defaultCells: [
      { title: "优势 S", content: "" },
      { title: "劣势 W", content: "" },
      { title: "机会 O", content: "" },
      { title: "威胁 T", content: "" },
    ],
  },
  {
    id: "stages-4",
    name: "四阶段流程",
    description: "事项发展的四个阶段，标题可改",
    cols: 4,
    rows: 1,
    defaultCells: [
      { title: "阶段 1", content: "" },
      { title: "阶段 2", content: "" },
      { title: "阶段 3", content: "" },
      { title: "阶段 4", content: "" },
    ],
  },
  {
    id: "stages-5",
    name: "五阶段流程",
    description: "适合项目里程碑或学习路径",
    cols: 5,
    rows: 1,
    defaultCells: [
      { title: "阶段 1", content: "" },
      { title: "阶段 2", content: "" },
      { title: "阶段 3", content: "" },
      { title: "阶段 4", content: "" },
      { title: "阶段 5", content: "" },
    ],
  },
  {
    id: "pdca",
    name: "PDCA 循环",
    description: "计划 → 执行 → 检查 → 处理",
    cols: 4,
    rows: 1,
    defaultCells: [
      { title: "Plan 计划", content: "" },
      { title: "Do 执行", content: "" },
      { title: "Check 检查", content: "" },
      { title: "Act 处理", content: "" },
    ],
  },
  {
    id: "priority-3x3",
    name: "九宫格优先级",
    description: "3×3 矩阵，按优先级或分类填入",
    cols: 3,
    rows: 3,
    defaultCells: Array.from({ length: 9 }, (_, i) => ({
      title: `象限 ${i + 1}`,
      content: "",
    })),
  },
  {
    id: "pros-cons",
    name: "利弊分析",
    description: "两栏对比优点与缺点",
    cols: 2,
    rows: 1,
    defaultCells: [
      { title: "优点 / Pros", content: "" },
      { title: "缺点 / Cons", content: "" },
    ],
  },
  {
    id: "5w1h",
    name: "5W1H 分析",
    description: "What / Why / Who / When / Where / How",
    cols: 3,
    rows: 2,
    defaultCells: [
      { title: "What 什么", content: "" },
      { title: "Why 为什么", content: "" },
      { title: "Who 谁", content: "" },
      { title: "When 何时", content: "" },
      { title: "Where 何地", content: "" },
      { title: "How 如何", content: "" },
    ],
  },
  {
    id: "blank-2x2",
    name: "空白四宫格",
    description: "自由定义四个区域",
    cols: 2,
    rows: 2,
    defaultCells: [
      { title: "区域 1", content: "" },
      { title: "区域 2", content: "" },
      { title: "区域 3", content: "" },
      { title: "区域 4", content: "" },
    ],
  },
];

export const FRAMEWORK_MAP = Object.fromEntries(
  MODEL_FRAMEWORKS.map((f) => [f.id, f])
) as Record<ModelFrameworkId, FrameworkDef>;

export function createModelCells(frameworkId: ModelFrameworkId): ModelCell[] {
  const def = FRAMEWORK_MAP[frameworkId];
  return def.defaultCells.map((c, i) => ({
    id: `cell-${i}`,
    title: c.title,
    content: c.content,
  }));
}
