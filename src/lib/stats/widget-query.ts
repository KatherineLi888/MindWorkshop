import type { GoalWithMeta } from "@/lib/goals/storage";
import type { DecisionRow } from "@/types/database";
import type { SeedSummary } from "@/lib/seeds/types";
import type {
  ActivityItem,
  ChartPoint,
  DashboardStats,
  GoalProgressRow,
} from "./aggregate";
import type { KpiKey, WidgetFilters, WidgetInstance } from "./dashboard-config";
import { ALL_KPI_KEYS, WIDGET_META } from "./dashboard-config";
import {
  mergeViewFilters,
  type ViewTimeScope,
} from "./dashboard-views";
import { dueInRange, inTimeRange, matchesTimeFilter } from "./time-range";

const GOAL_TYPE_LABELS: Record<string, string> = {
  near: "近期目标",
  long: "长期目标",
  pending: "待定目标",
};

export function filterGoals(
  goals: GoalWithMeta[],
  filters: WidgetFilters
): GoalProgressRow[] {
  let list = [...goals];

  if (filters.goalTypes?.length) {
    list = list.filter((g) =>
      filters.goalTypes!.includes(
        g.goal_type as "near" | "long" | "pending"
      )
    );
  }

  const range = filters.timeRange ?? "all";
  if (range !== "all") {
    list = list.filter(
      (g) =>
        matchesTimeFilter(g.created_at, filters) ||
        matchesTimeFilter(g.updated_at, filters)
    );
  }

  if (filters.dueWithin && filters.dueWithin !== "all") {
    list = list.filter((g) =>
      dueInRange(g.execution?.due_date ?? null, filters.dueWithin!)
    );
  }

  if (filters.goalIds?.length) {
    list = list.filter((g) => filters.goalIds!.includes(g.id));
  }

  const sort = filters.goalSort ?? "progress_desc";
  list.sort((a, b) => {
    if (sort === "progress_desc") return b.progress - a.progress;
    if (sort === "created_desc")
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sort === "due_asc") {
      const da = a.execution?.due_date ?? "9999";
      const db = b.execution?.due_date ?? "9999";
      return da.localeCompare(db);
    }
    return 0;
  });

  const limit = filters.goalLimit ?? 6;
  return list.slice(0, limit).map((g) => ({
    id: g.id,
    name: g.title,
    progress: g.progress,
    goalType: GOAL_TYPE_LABELS[g.goal_type] ?? g.goal_type,
  }));
}

export function filterDecisions(
  decisions: DecisionRow[],
  filters: WidgetFilters
) {
  let list = decisions.filter((d) => !d.archived_at);
  const range = filters.timeRange ?? "all";
  if (range !== "all") {
    list = list.filter((d) => matchesTimeFilter(d.created_at, filters));
  }
  if (filters.decisionSource === "active") {
    list = list.filter((d) => d.source === "active");
  }
  if (filters.decisionSource === "passive") {
    list = list.filter((d) => d.source === "passive");
  }

  const decisionSource: ChartPoint[] = [
    {
      name: "主动做",
      value: list.filter((d) => d.source === "active").length,
      fill: "#3B82F6",
    },
    {
      name: "被委派",
      value: list.filter((d) => d.source === "passive").length,
      fill: "#94A3B8",
    },
  ];
  const decisionOutcome: ChartPoint[] = [
    {
      name: "正常进行",
      value: list.filter((d) => d.tag_outcome === "proceed").length,
      fill: "#10B981",
    },
    {
      name: "放弃",
      value: list.filter((d) => d.tag_outcome === "abandon").length,
      fill: "#F59E0B",
    },
  ];
  return { decisionSource, decisionOutcome };
}

export function filterKpi(
  stats: DashboardStats,
  keys: KpiKey[],
  filters: WidgetFilters
): Partial<Record<KpiKey, number>> {
  const range = filters.timeRange ?? "all";
  const out: Partial<Record<KpiKey, number>> = {};

  for (const key of keys) {
    if (range === "all") {
      out[key] = stats.kpis[key];
      continue;
    }
    if (key === "decisions") {
      out[key] = stats.raw.decisions.filter(
        (d) => !d.archived_at && matchesTimeFilter(d.created_at, filters)
      ).length;
    } else if (key === "activeGoals") {
      out[key] = stats.raw.goals.filter(
        (g) =>
          g.progress < 100 &&
          (matchesTimeFilter(g.created_at, filters) ||
            matchesTimeFilter(g.updated_at, filters))
      ).length;
    } else if (key === "thinkingSessions") {
      out[key] =
        range === "all"
          ? stats.kpis.thinkingSessions
          : stats.raw.thinkingCountInRange(filters);
    } else if (key === "modelApplies") {
      out[key] =
        range === "all"
          ? stats.kpis.modelApplies
          : stats.raw.modelAppsInRange(filters);
    } else if (key === "canvasDocs") {
      out[key] =
        range === "all"
          ? stats.kpis.canvasDocs
          : stats.raw.canvasDocsInRange(filters);
    } else if (key === "graphNodes") {
      out[key] =
        range === "all"
          ? stats.kpis.graphNodes
          : stats.raw.graphNodesInRange(filters);
    } else if (key === "inboxItems") {
      out[key] = stats.kpis.inboxItems;
    }
  }
  return out;
}

export function filterRecent(
  items: ActivityItem[],
  filters: WidgetFilters
): ActivityItem[] {
  let list = [...items];
  const range = filters.timeRange ?? "all";
  if (range !== "all") {
    list = list.filter((i) => matchesTimeFilter(i.time, filters));
  }
  if (filters.recentModules?.length) {
    list = list.filter((i) =>
      filters.recentModules!.includes(
        i.module as "decision" | "goal" | "thinking" | "model" | "canvas"
      )
    );
  }
  return list.slice(0, filters.recentLimit ?? 8);
}

export function filterModuleStock(
  stats: DashboardStats,
  filters: WidgetFilters
): ChartPoint[] {
  const keys = filters.stockModules ?? ALL_KPI_KEYS;
  const kpi = filterKpi(stats, keys, filters);
  const nameMap: Record<KpiKey, string> = {
    decisions: "决策",
    activeGoals: "目标",
    thinkingSessions: "思考",
    modelApplies: "模型",
    canvasDocs: "画布",
    graphNodes: "图谱",
    inboxItems: "收集箱",
  };
  const colors: Record<string, string> = {
    决策: "#3B82F6",
    目标: "#10B981",
    思考: "#8B5CF6",
    模型: "#F59E0B",
    画布: "#06B6D4",
    图谱: "#EC4899",
    收集箱: "#64748B",
  };
  return keys
    .map((k) => ({
      name: nameMap[k],
      value: kpi[k] ?? 0,
      fill: colors[nameMap[k]],
    }))
    .filter((m) => m.value > 0);
}

export type WidgetViewData = {
  title: string;
  goalProgress?: GoalProgressRow[];
  decisionSource?: ChartPoint[];
  decisionOutcome?: ChartPoint[];
  kpiKeys?: KpiKey[];
  kpiValues?: Partial<Record<KpiKey, number>>;
  goalTypeDist?: ChartPoint[];
  moduleUsage?: ChartPoint[];
  activityTrend?: DashboardStats["activityTrend"];
  recentActivity?: ActivityItem[];
  seeds?: SeedSummary;
};

export function buildWidgetView(
  instance: WidgetInstance,
  stats: DashboardStats,
  viewScope?: ViewTimeScope | null
): WidgetViewData {
  const title = instance.title?.trim() || WIDGET_META[instance.type].label;
  const f = mergeViewFilters(instance.filters, viewScope);

  switch (instance.type) {
    case "goals_progress":
      return {
        title,
        goalProgress: filterGoals(stats.raw.goals, f),
      };
    case "decisions": {
      const d = filterDecisions(stats.raw.decisions, f);
      return { title, ...d };
    }
    case "kpi": {
      const keys = f.kpiKeys ?? ["decisions", "activeGoals", "thinkingSessions"];
      return {
        title,
        kpiKeys: keys,
        kpiValues: filterKpi(stats, keys, f),
      };
    }
    case "goals_types": {
      const goals = filterGoals(stats.raw.goals, {
        ...f,
        goalLimit: 999,
        goalSort: "progress_desc",
      });
      const types = f.goalTypes ?? ["near", "long", "pending"];
      const dist: ChartPoint[] = types.map((t) => ({
        name: GOAL_TYPE_LABELS[t],
        value: stats.raw.goals.filter((g) => {
          if (g.goal_type !== t) return false;
          const range = f.timeRange ?? "all";
          return (
            range === "all" ||
            matchesTimeFilter(g.created_at, f) ||
            matchesTimeFilter(g.updated_at, f)
          );
        }).length,
        fill:
          t === "near" ? "#3B82F6" : t === "long" ? "#8B5CF6" : "#F59E0B",
      }));
      return { title, goalTypeDist: dist, goalProgress: goals };
    }
    case "modules":
      return { title, moduleUsage: filterModuleStock(stats, f) };
    case "recent":
      return {
        title,
        recentActivity: filterRecent(stats.recentActivity, f),
      };
    case "activity":
      return { title, activityTrend: stats.activityTrend };
    case "seeds":
      return { title, seeds: stats.seeds };
    default:
      return { title };
  }
}
