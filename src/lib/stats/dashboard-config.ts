import { loadLocal, saveLocal } from "@/lib/local-store";
import { autoPlaceInstances, compactEmptyRows } from "./grid-layout";

const STORAGE_KEY = "workshop-stats-dashboard-v2";
const LEGACY_KEY = "workshop-stats-dashboard-config";

export type KpiKey =
  | "decisions"
  | "activeGoals"
  | "thinkingSessions"
  | "modelApplies"
  | "canvasDocs"
  | "graphNodes"
  | "inboxItems";

export type WidgetId =
  | "kpi"
  | "decisions"
  | "goals_progress"
  | "goals_types"
  | "activity"
  | "modules"
  | "recent"
  | "seeds"
  | "thinking_pin"
  | "decision_pin";

export type WidgetStyle =
  | "default"
  | "compact"
  | "chart"
  | "list"
  | "cards"
  | "pie"
  | "bar_slim"
  | "bar_bold"
  | "bar_steps"
  | "bar_glow"
  | "bar_inline";

/** 四列网格占位：宽×高（列×行），如 2x3 = 占 2 列 3 行 */
export type WidgetSize =
  | "1x1"
  | "1x2"
  | "1x4"
  | "2x1"
  | "3x1"
  | "4x1"
  | "2x2"
  | "2x3"
  | "3x2"
  | "4x2"
  | "4x4";

/** 所有可选尺寸（按单元格数从小到大） */
export const ALL_WIDGET_SIZES: WidgetSize[] = [
  "1x1",
  "1x2",
  "2x1",
  "3x1",
  "1x4",
  "2x2",
  "4x1",
  "2x3",
  "3x2",
  "4x2",
  "4x4",
];

export type TimeRange = "all" | "today" | "week" | "month" | "7d" | "custom";

export type WidgetScope = "global" | "decisions" | "goals";

export type GoalTypeFilter = "near" | "long" | "pending";

export type WidgetFilters = {
  /** 创建/更新时间范围（适用于 KPI、动态、决策等） */
  timeRange?: TimeRange;
  /** 自定义时间起止（YYYY-MM-DD），timeRange=custom 时生效 */
  timeFrom?: string;
  timeTo?: string;
  kpiKeys?: KpiKey[];
  goalTypes?: GoalTypeFilter[];
  /** 指定只展示这些目标（空=按类型/时间筛） */
  goalIds?: string[];
  dueWithin?: "all" | "week" | "month";
  goalSort?: "progress_desc" | "created_desc" | "due_asc";
  goalLimit?: number;
  stockModules?: KpiKey[];
  recentModules?: Array<
    "decision" | "goal" | "thinking" | "model" | "canvas"
  >;
  recentLimit?: number;
  decisionSource?: "all" | "active" | "passive";
  /** 固定到仪表盘的实体 id（思考/决策条目） */
  pinEntityIds?: string[];
};

export type WidgetInstance = {
  instanceId: string;
  type: WidgetId;
  size: WidgetSize;
  style: WidgetStyle;
  /** 四列网格左上角锚点 */
  row: number;
  col: number;
  /** 自定义标题，如「本周要完成的」 */
  title?: string;
  filters: WidgetFilters;
};

export type DashboardLayout = {
  instances: WidgetInstance[];
};

export const KPI_META: Record<
  KpiKey,
  { label: string; icon: string; href: string; accent: string; bg: string }
> = {
  decisions: {
    label: "决策",
    icon: "⚖️",
    href: "/decisions",
    accent: "border-l-blue-500",
    bg: "bg-blue-50/60",
  },
  activeGoals: {
    label: "推进中目标",
    icon: "🎯",
    href: "/goals",
    accent: "border-l-emerald-500",
    bg: "bg-emerald-50/60",
  },
  thinkingSessions: {
    label: "思考",
    icon: "💭",
    href: "/thinking",
    accent: "border-l-violet-500",
    bg: "bg-violet-50/60",
  },
  modelApplies: {
    label: "模型套用",
    icon: "🧩",
    href: "/models",
    accent: "border-l-amber-500",
    bg: "bg-amber-50/60",
  },
  canvasDocs: {
    label: "画布",
    icon: "◫",
    href: "/canvas",
    accent: "border-l-cyan-500",
    bg: "bg-cyan-50/60",
  },
  graphNodes: {
    label: "追踪",
    icon: "🔗",
    href: "/graph",
    accent: "border-l-pink-500",
    bg: "bg-pink-50/60",
  },
  inboxItems: {
    label: "收集箱",
    icon: "▤",
    href: "/inbox",
    accent: "border-l-slate-500",
    bg: "bg-slate-50/60",
  },
};

export const ALL_KPI_KEYS: KpiKey[] = [
  "decisions",
  "activeGoals",
  "thinkingSessions",
  "modelApplies",
  "canvasDocs",
  "graphNodes",
  "inboxItems",
];

export const WIDGET_META: Record<
  WidgetId,
  {
    label: string;
    description: string;
    module: string;
    styles: { id: WidgetStyle; label: string }[];
    defaultStyle: WidgetStyle;
    defaultSize: WidgetSize;
    sizes: WidgetSize[];
  }
> = {
  kpi: {
    label: "数字概览",
    description: "勾选要统计的板块，可限定时间",
    module: "全局",
    styles: [
      { id: "default", label: "标准卡片" },
      { id: "compact", label: "紧凑胶囊" },
    ],
    defaultStyle: "compact",
    defaultSize: "4x1",
    sizes: ALL_WIDGET_SIZES,
  },
  decisions: {
    label: "决策分布",
    description: "来源与结果分布",
    module: "决策",
    styles: [
      { id: "default", label: "饼图+列表" },
      { id: "chart", label: "仅饼图" },
      { id: "list", label: "仅列表" },
    ],
    defaultStyle: "default",
    defaultSize: "2x1",
    sizes: ALL_WIDGET_SIZES,
  },
  goals_progress: {
    label: "目标进度",
    description: "按类型/时间/指定目标筛选",
    module: "目标",
    styles: [
      { id: "default", label: "标准渐变条" },
      { id: "bar_slim", label: "细线进度" },
      { id: "bar_bold", label: "粗条进度" },
      { id: "bar_inline", label: "条内百分比" },
      { id: "bar_steps", label: "刻度进度" },
      { id: "bar_glow", label: "光晕进度" },
    ],
    defaultStyle: "default",
    defaultSize: "2x1",
    sizes: ALL_WIDGET_SIZES,
  },
  goals_types: {
    label: "目标类型",
    description: "近期/长期/待定数量",
    module: "目标",
    styles: [
      { id: "cards", label: "数字卡片" },
      { id: "pie", label: "饼图" },
      { id: "list", label: "列表" },
    ],
    defaultStyle: "cards",
    defaultSize: "2x1",
    sizes: ALL_WIDGET_SIZES,
  },
  activity: {
    label: "创作节奏",
    description: "近 7 日活跃趋势",
    module: "全局",
    styles: [
      { id: "chart", label: "柱状图" },
      { id: "compact", label: "迷你柱" },
    ],
    defaultStyle: "chart",
    defaultSize: "2x1",
    sizes: ALL_WIDGET_SIZES,
  },
  modules: {
    label: "模块存量",
    description: "勾选要对比的板块",
    module: "全局",
    styles: [
      { id: "chart", label: "条形图" },
      { id: "cards", label: "卡片" },
      { id: "list", label: "列表" },
    ],
    defaultStyle: "chart",
    defaultSize: "2x1",
    sizes: ALL_WIDGET_SIZES,
  },
  recent: {
    label: "最近动态",
    description: "筛选板块与时间",
    module: "全局",
    styles: [
      { id: "default", label: "完整列表" },
      { id: "compact", label: "精简" },
    ],
    defaultStyle: "default",
    defaultSize: "4x1",
    sizes: ALL_WIDGET_SIZES,
  },
  seeds: {
    label: "想法种子",
    description: "想法从诞生到生长、回转或消亡的轨迹",
    module: "全局",
    styles: [
      { id: "default", label: "标准列表" },
      { id: "compact", label: "精简" },
    ],
    defaultStyle: "default",
    defaultSize: "2x2",
    sizes: ALL_WIDGET_SIZES,
  },
  thinking_pin: {
    label: "思考条目",
    description: "从思考列表固定到仪表盘",
    module: "思考",
    styles: [{ id: "cards", label: "卡片" }],
    defaultStyle: "cards",
    defaultSize: "2x1",
    sizes: ["1x1", "1x2", "2x1", "2x2"],
  },
  decision_pin: {
    label: "决策条目",
    description: "从决策列表固定到仪表盘",
    module: "决策",
    styles: [{ id: "cards", label: "卡片" }],
    defaultStyle: "cards",
    defaultSize: "2x1",
    sizes: ["1x1", "1x2", "2x1", "2x2"],
  },
};

export const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  all: "全部",
  today: "当日创建/更新",
  week: "本周创建/更新",
  month: "本月创建/更新",
  "7d": "近 7 日",
  custom: "指定日期",
};

export const WIDGET_SCOPES: Record<
  WidgetScope,
  { label: string; hint: string; types: WidgetId[] }
> = {
  global: {
    label: "全局",
    hint: "跨模块汇总、动态与创作节奏",
    types: ["kpi", "activity", "modules", "recent", "seeds", "thinking_pin", "decision_pin"],
  },
  decisions: {
    label: "决策",
    hint: "决策模块专属统计",
    types: ["decisions"],
  },
  goals: {
    label: "目标",
    hint: "目标进度与类型分布",
    types: ["goals_progress", "goals_types"],
  },
};

export function scopeForType(type: WidgetId): WidgetScope {
  if (WIDGET_SCOPES.decisions.types.includes(type)) return "decisions";
  if (WIDGET_SCOPES.goals.types.includes(type)) return "goals";
  return "global";
}

export const SIZE_LABELS: Record<WidgetSize, string> = {
  "1x1": "单格（1 单位）",
  "1x2": "竖条（1×2）",
  "1x4": "竖条（1×4）",
  "2x1": "横条（2×1）",
  "3x1": "横条（3×1）",
  "4x1": "通栏（4×1）",
  "2x2": "方块（2×2）",
  "2x3": "竖块（2×3）",
  "3x2": "横块（3×2）",
  "4x2": "宽块（4×2）",
  "4x4": "大屏（4×4）",
};

/** 尺寸在 4 列预览网格上的宽高（列×行） */
export const SIZE_PREVIEW_SPAN: Record<
  WidgetSize,
  { col: number; row: number }
> = {
  "1x1": { col: 1, row: 1 },
  "1x2": { col: 1, row: 2 },
  "1x4": { col: 1, row: 4 },
  "2x1": { col: 2, row: 1 },
  "3x1": { col: 3, row: 1 },
  "4x1": { col: 4, row: 1 },
  "2x2": { col: 2, row: 2 },
  "2x3": { col: 2, row: 3 },
  "3x2": { col: 3, row: 2 },
  "4x2": { col: 4, row: 2 },
  "4x4": { col: 4, row: 4 },
};

export function defaultFilters(type: WidgetId): WidgetFilters {
  switch (type) {
    case "kpi":
      return {
        kpiKeys: ["decisions", "activeGoals", "thinkingSessions"],
        timeRange: "all",
      };
    case "goals_progress":
      return {
        goalTypes: ["near"],
        dueWithin: "all",
        goalSort: "progress_desc",
        goalLimit: 5,
        timeRange: "all",
      };
    case "goals_types":
      return { timeRange: "all" };
    case "decisions":
      return { decisionSource: "all", timeRange: "all" };
    case "modules":
      return {
        stockModules: ["decisions", "activeGoals", "thinkingSessions"],
        timeRange: "all",
      };
    case "recent":
      return {
        recentModules: ["decision", "goal", "thinking"],
        recentLimit: 6,
        timeRange: "month",
      };
    case "activity":
      return { timeRange: "7d" };
    case "seeds":
      return { timeRange: "all" };
    case "thinking_pin":
    case "decision_pin":
      return { pinEntityIds: [], timeRange: "all" };
    default:
      return {};
  }
}

export function createWidgetInstance(
  type: WidgetId,
  size?: WidgetSize,
  filters?: WidgetFilters,
  style?: WidgetStyle,
  title?: string,
  anchor?: { row: number; col: number }
): WidgetInstance {
  const meta = WIDGET_META[type];
  return {
    instanceId: crypto.randomUUID(),
    type,
    size: size ?? meta.defaultSize,
    style: style ?? meta.defaultStyle,
    row: anchor?.row ?? 0,
    col: anchor?.col ?? 0,
    title,
    filters: filters ?? defaultFilters(type),
  };
}

const DEFAULT_INSTANCES_RAW: WidgetInstance[] = [
  createWidgetInstance(
    "kpi",
    "4x1",
    {
      kpiKeys: ["decisions", "activeGoals", "thinkingSessions"],
      timeRange: "month",
    },
    "compact"
  ),
  createWidgetInstance(
    "goals_progress",
    "2x1",
    {
      goalTypes: ["near"],
      dueWithin: "week",
      goalLimit: 5,
      goalSort: "due_asc",
    },
    "default",
    "本周近期目标"
  ),
  createWidgetInstance(
    "goals_progress",
    "2x1",
    {
      goalTypes: ["long"],
      goalLimit: 5,
      goalSort: "progress_desc",
    },
    "default",
    "长期目标推进"
  ),
  createWidgetInstance(
    "recent",
    "4x1",
    {
      recentModules: ["decision", "goal", "thinking"],
      timeRange: "month",
      recentLimit: 6,
    },
    "compact"
  ),
  createWidgetInstance("seeds", "2x2", { timeRange: "all" }, "default"),
];

export const DEFAULT_LAYOUT: DashboardLayout = {
  instances: autoPlaceInstances(DEFAULT_INSTANCES_RAW),
};

type LegacyEntry = {
  id: WidgetId;
  enabled?: boolean;
  style?: WidgetStyle;
  kpiKeys?: KpiKey[];
};

function migrateLegacy(saved: { widgets?: LegacyEntry[] }): DashboardLayout {
  const enabled = (saved.widgets ?? []).filter((w) => w.enabled !== false);
  if (!enabled.length) return DEFAULT_LAYOUT;
  return {
    instances: autoPlaceInstances(
      enabled.map((w) =>
        createWidgetInstance(
          w.id,
          WIDGET_META[w.id].defaultSize,
          w.id === "kpi"
            ? { kpiKeys: w.kpiKeys ?? ALL_KPI_KEYS, timeRange: "all" }
            : defaultFilters(w.id),
          w.style ?? WIDGET_META[w.id].defaultStyle
        )
      )
    ),
  };
}

function normalizeInstanceSize(size: string): WidgetSize {
  if (size in SIZE_PREVIEW_SPAN) return size as WidgetSize;
  return "2x1";
}

export function loadDashboardLayout(): DashboardLayout {
  const v2 = loadLocal<DashboardLayout | null>(STORAGE_KEY, null);
  if (v2?.instances?.length) {
    const normalized = v2.instances.map((i) => ({
      ...i,
      size: normalizeInstanceSize(i.size),
      style:
        i.type === "goals_progress" &&
        (i.style === "compact" || i.style === "list")
          ? "default"
          : i.style,
    }));
    return {
      instances: compactEmptyRows(autoPlaceInstances(normalized)),
    };
  }
  const legacy = loadLocal<{ widgets?: LegacyEntry[] } | null>(LEGACY_KEY, null);
  if (legacy?.widgets?.length) return migrateLegacy(legacy);
  return DEFAULT_LAYOUT;
}

export function saveDashboardLayout(layout: DashboardLayout) {
  saveLocal(STORAGE_KEY, layout);
}

export function cloneLayout(layout: DashboardLayout): DashboardLayout {
  return {
    instances: autoPlaceInstances(layout.instances).map((i) => ({
      ...i,
      filters: {
        ...i.filters,
        kpiKeys: i.filters.kpiKeys?.slice(),
        goalTypes: i.filters.goalTypes?.slice(),
        goalIds: i.filters.goalIds?.slice(),
        pinEntityIds: i.filters.pinEntityIds?.slice(),
        stockModules: i.filters.stockModules?.slice(),
        recentModules: i.filters.recentModules?.slice(),
      },
    })),
  };
}

export function widgetTitle(instance: WidgetInstance): string {
  if (instance.title?.trim()) return instance.title.trim();
  return WIDGET_META[instance.type].label;
}
