import {
  createFunnelConfig,
  createGridConfig,
  createQuadrantConfig,
  createStageConfig,
} from "./helpers";
import type { StoredModel } from "./types";

const now = "1970-01-01T00:00:00.000Z";

function builtin(
  partial: Omit<StoredModel, "tags" | "source" | "createdAt" | "updatedAt" | "builtin"> &
    Partial<Pick<StoredModel, "tags" | "source">>
): StoredModel {
  return {
    tags: partial.tags ?? [],
    source: partial.source ?? "",
    createdAt: now,
    updatedAt: now,
    builtin: true,
    ...partial,
  };
}

/** 首次初始化模型库时写入的内置模型 */
export const DEFAULT_BUILTIN_MODELS: StoredModel[] = [
  builtin({
    id: "eisenhower",
    name: "重要紧急四象限",
    description: "艾森豪威尔矩阵：按重要性与紧急性分类待办",
    kind: "quadrant",
    applicableScenarios: "任务繁多、需要排优先级时；日常时间管理与决策取舍",
    inspirations: "不是所有紧急的事都重要，也不是所有重要的事都紧急",
    usageNotes: "每周复盘待办清单；新项目立项时划分投入精力",
    config: (() => {
      const cfg = createQuadrantConfig(2, 2, {
        xAxis: { low: "不紧急", high: "紧急" },
        yAxis: { low: "不重要", high: "重要" },
        labels: [
          "重要不紧急",
          "重要且紧急",
          "不重要不紧急",
          "紧急不重要",
        ],
      });
      cfg.regions[0].definition = "值得投入时间，但不需立刻处理";
      cfg.regions[0].traits = "规划、学习、关系维护";
      cfg.regions[1].definition = "立刻处理，优先完成";
      cfg.regions[1].traits = "危机、截止日期、紧急会议";
      cfg.regions[2].definition = "可忽略或批量处理";
      cfg.regions[2].traits = "琐事、消遣、可委托的低价值事项";
      cfg.regions[3].definition = "看似紧急但价值不高";
      cfg.regions[3].traits = "打扰、部分邮件/消息，适合委派";
      return cfg;
    })(),
  }),
  builtin({
    id: "swot",
    name: "SWOT 分析",
    description: "从优势、劣势、机会、威胁四个维度审视现状",
    kind: "quadrant",
    applicableScenarios: "战略规划、竞品分析、个人职业评估、项目可行性判断",
    inspirations: "把内部因素（SW）与外部因素（OT）分开看，避免混淆可控与不可控",
    usageNotes: "重大决策前做一轮 SWOT；季度复盘个人/团队状态",
    config: (() => {
      const cfg = createQuadrantConfig(2, 2, {
        xAxis: { low: "内部", high: "外部" },
        yAxis: { low: "消极", high: "积极" },
        labels: ["优势 S", "机会 O", "劣势 W", "威胁 T"],
      });
      cfg.regions[0].definition = "组织/个人内部的有利条件与核心竞争力";
      cfg.regions[1].definition = "外部环境中可利用的机遇与趋势";
      cfg.regions[2].definition = "内部需要改进或弥补的短板";
      cfg.regions[3].definition = "外部可能带来风险或挑战的因素";
      return cfg;
    })(),
  }),
  builtin({
    id: "stages-3",
    name: "三阶段流程",
    description: "将事项拆分为三个连续阶段",
    kind: "stage",
    applicableScenarios: "简单项目、学习路径、习惯养成",
    inspirations: "阶段越少越清晰，三阶段适合大多数线性流程",
    usageNotes: "拆解个人目标或小型任务的推进节奏",
    config: createStageConfig(3, ["阶段一", "阶段二", "阶段三"]),
  }),
  builtin({
    id: "stages-4",
    name: "四阶段流程",
    description: "事项发展的四个阶段",
    kind: "stage",
    applicableScenarios: "产品生命周期、用户旅程、项目里程碑划分",
    inspirations: "四阶段是平衡粒度与可读性的常见选择",
    usageNotes: "项目规划时标注当前所处阶段与下一阶段目标",
    config: createStageConfig(4, ["阶段一", "阶段二", "阶段三", "阶段四"]),
  }),
  builtin({
    id: "pdca",
    name: "PDCA 循环",
    description: "计划 → 执行 → 检查 → 处理",
    kind: "stage",
    applicableScenarios: "质量管理、流程优化、个人复盘与迭代",
    inspirations: "改进不是一次性的，而是螺旋上升的循环",
    usageNotes: "每月复盘时按 PDCA 走一遍",
    config: (() => {
      const cfg = createStageConfig(4, [
        "Plan 计划",
        "Do 执行",
        "Check 检查",
        "Act 处理",
      ]);
      cfg.stages[0].description = "明确目标、制定方案与衡量标准";
      cfg.stages[1].description = "按方案执行，小步快跑";
      cfg.stages[2].description = "对照标准检查结果与偏差";
      cfg.stages[3].description = "标准化成功经验或调整方案进入下一轮";
      return cfg;
    })(),
  }),
  builtin({
    id: "funnel-sales",
    name: "转化漏斗",
    description: "从曝光到成交的层级递减漏斗",
    kind: "funnel",
    applicableScenarios: "营销转化分析、招聘漏斗、产品增长诊断",
    inspirations: "关注每一层的转化率，找到瓶颈环节",
    usageNotes: "季度复盘业务数据时定位流失点",
    config: createFunnelConfig(5, [
      "曝光 / 触达",
      "兴趣 / 点击",
      "意向 / 咨询",
      "试用 / 体验",
      "成交 / 转化",
    ]),
  }),
  builtin({
    id: "pros-cons",
    name: "利弊分析",
    description: "两栏对比优点与缺点",
    kind: "grid",
    applicableScenarios: "做选择、评估方案、权衡取舍",
    inspirations: "先列全再权衡，避免过早否定某个选项",
    usageNotes: "二选一时的快速决策辅助",
    config: createGridConfig(2, 1, ["优点", "缺点"]),
  }),
  builtin({
    id: "5w1h",
    name: "5W1H 分析",
    description: "What / Why / Who / When / Where / How",
    kind: "grid",
    applicableScenarios: "问题定义、事件复盘、方案完整性检查",
    inspirations: "六个维度覆盖一件事的基本要素",
    usageNotes: "新项目启动时做一轮 5W1H",
    config: createGridConfig(3, 2, [
      "What 什么",
      "Why 为什么",
      "Who 谁",
      "When 何时",
      "Where 何地",
      "How 如何",
    ]),
  }),
];
