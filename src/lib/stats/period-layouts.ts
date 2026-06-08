import {
  autoPlaceInstances,
  type GridAnchor,
} from "./grid-layout";
import {
  cloneLayout,
  createWidgetInstance,
  SIZE_PREVIEW_SPAN,
  type DashboardLayout,
  type WidgetInstance,
} from "./dashboard-config";

/** 本周 / 本月主体区默认 4 列 × 2 行网格（左右各一块 2×2） */
export function createPeriodGridLayout(
  timeRange: "week" | "month" | "all"
): DashboardLayout {
  const instances = autoPlaceInstances([
    createWidgetInstance(
      "decisions",
      "2x2",
      { decisionSource: "all", timeRange },
      "default",
      timeRange === "week"
        ? "本周决策"
        : timeRange === "month"
          ? "本月决策"
          : "全部决策"
    ),
    createWidgetInstance(
      "goals_progress",
      "2x2",
      {
        goalTypes: ["near", "long"],
        goalLimit: 6,
        goalSort: "progress_desc",
        timeRange,
      },
      "default",
      timeRange === "week"
        ? "本周目标推进"
        : timeRange === "month"
          ? "本月目标推进"
          : "全部目标推进"
    ),
  ]);
  return { instances };
}

export const DAY_LAYOUT: DashboardLayout = { instances: [] };

export const WEEK_LAYOUT: DashboardLayout = createPeriodGridLayout("week");

export const MONTH_LAYOUT: DashboardLayout = createPeriodGridLayout("month");

export const ALL_LAYOUT: DashboardLayout = createPeriodGridLayout("all");

export function layoutForBuiltinView(viewId: string): DashboardLayout {
  if (viewId === "day") return cloneLayout(DAY_LAYOUT);
  if (viewId === "week") return cloneLayout(WEEK_LAYOUT);
  if (viewId === "month") return cloneLayout(MONTH_LAYOUT);
  if (viewId === "all") return cloneLayout(ALL_LAYOUT);
  return cloneLayout(WEEK_LAYOUT);
}

function cellOccupied(
  placed: WidgetInstance[],
  row: number,
  col: number
): boolean {
  return placed.some((i) => {
    const { col: w, row: h } = SIZE_PREVIEW_SPAN[i.size];
    return (
      row >= i.row && row < i.row + h && col >= i.col && col < i.col + w
    );
  });
}

/** 编辑模式下找第一个可放置锚点 */
export function firstEmptyAnchor(layout: DashboardLayout): GridAnchor {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 4; col++) {
      if (!cellOccupied(layout.instances, row, col)) return { row, col };
    }
  }
  return { row: 2, col: 0 };
}
