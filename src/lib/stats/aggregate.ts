import { STORAGE_KEY, type VaultState } from "@/app/canvas/types";
import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals, type GoalWithMeta } from "@/lib/goals/storage";
import type { DecisionRow } from "@/types/database";
import { inTimeRange, matchesTimeFilter } from "./time-range";
import type { TimeRange, WidgetFilters } from "./dashboard-config";

type TimeFilter = Pick<WidgetFilters, "timeRange" | "timeFrom" | "timeTo">;
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadApplications } from "@/lib/models/application-store";
import { loadModelLibrary } from "@/lib/models/model-library-store";
import { loadAllInboxItems } from "@/lib/inbox/storage";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { buildSeedSummary } from "@/lib/seeds/storage";
import type { SeedSummary } from "@/lib/seeds/types";
import type { GraphNodeRow } from "@/types/database";

export type ChartPoint = { name: string; value: number; fill?: string };

export type GoalProgressRow = {
  id: string;
  name: string;
  progress: number;
  goalType: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  module: string;
  moduleLabel: string;
  time: string;
  href: string;
};

export type DashboardStats = {
  raw: {
    goals: GoalWithMeta[];
    decisions: DecisionRow[];
    thinkingCountInRange: (filters: TimeFilter | TimeRange) => number;
    modelAppsInRange: (filters: TimeFilter | TimeRange) => number;
    canvasDocsInRange: (filters: TimeFilter | TimeRange) => number;
    graphNodesInRange: (filters: TimeFilter | TimeRange) => number;
  };
  kpis: {
    decisions: number;
    activeGoals: number;
    thinkingSessions: number;
    modelApplies: number;
    canvasDocs: number;
    graphNodes: number;
    inboxItems: number;
  };
  decisionSource: ChartPoint[];
  decisionOutcome: ChartPoint[];
  goalTypeDist: ChartPoint[];
  goalProgress: GoalProgressRow[];
  moduleUsage: ChartPoint[];
  activityTrend: { date: string; count: number }[];
  recentActivity: ActivityItem[];
  seeds: SeedSummary;
};

const MODULE_COLORS: Record<string, string> = {
  决策: "#3B82F6",
  目标: "#10B981",
  思考: "#8B5CF6",
  模型: "#F59E0B",
  画布: "#06B6D4",
  图谱: "#EC4899",
};

const GOAL_TYPE_LABELS: Record<string, string> = {
  near: "近期目标",
  long: "长期目标",
  pending: "待定目标",
};

function loadVault(): VaultState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultState;
  } catch {
    return null;
  }
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function lastNDays(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function formatDayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export async function loadDashboardStats(): Promise<DashboardStats> {
  const [decisions, goals] = await Promise.all([
    loadAllDecisions(),
    loadAllGoals(),
  ]);

  const activeDecisions = decisions.filter((d) => !d.archived_at);
  const thinkingSessions = loadThoughtSessions();
  const modelApps = loadApplications();
  const modelLibrary = loadModelLibrary();
  const graphNodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  const vault = loadVault();
  const canvasDocs = vault ? Object.keys(vault.documents).length : 0;

  const activeGoals = goals.filter((g) => g.progress < 100);
  const inboxItems = (await loadAllInboxItems()).length;

  const decisionSource: ChartPoint[] = [
    {
      name: "主动做",
      value: activeDecisions.filter((d) => d.source === "active").length,
      fill: "#3B82F6",
    },
    {
      name: "被委派",
      value: activeDecisions.filter((d) => d.source === "passive").length,
      fill: "#94A3B8",
    },
  ];

  const decisionOutcome: ChartPoint[] = [
    {
      name: "正常进行",
      value: activeDecisions.filter((d) => d.tag_outcome === "proceed").length,
      fill: "#10B981",
    },
    {
      name: "放弃",
      value: activeDecisions.filter((d) => d.tag_outcome === "abandon").length,
      fill: "#F59E0B",
    },
  ];

  const goalTypeDist: ChartPoint[] = Object.entries(GOAL_TYPE_LABELS).map(
    ([key, label]) => ({
      name: label,
      value: goals.filter((g) => g.goal_type === key).length,
      fill:
        key === "near"
          ? "#3B82F6"
          : key === "long"
            ? "#8B5CF6"
            : "#F59E0B",
    })
  );

  const goalProgress: GoalProgressRow[] = [...goals]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)
    .map((g) => ({
      id: g.id,
      name: g.title,
      progress: g.progress,
      goalType: GOAL_TYPE_LABELS[g.goal_type] ?? g.goal_type,
    }));

  const moduleUsage: ChartPoint[] = [
    { name: "决策", value: activeDecisions.length, fill: MODULE_COLORS.决策 },
    { name: "目标", value: goals.length, fill: MODULE_COLORS.目标 },
    { name: "思考", value: thinkingSessions.length, fill: MODULE_COLORS.思考 },
    {
      name: "模型",
      value: modelLibrary.length + modelApps.length,
      fill: MODULE_COLORS.模型,
    },
    { name: "画布", value: canvasDocs, fill: MODULE_COLORS.画布 },
    { name: "图谱", value: graphNodes.length, fill: MODULE_COLORS.图谱 },
  ].filter((m) => m.value > 0);

  const activityBuckets = new Map<string, number>();
  lastNDays(7).forEach((d) => activityBuckets.set(d, 0));

  const bump = (iso: string) => {
    const key = dayKey(iso);
    if (activityBuckets.has(key)) {
      activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1);
    }
  };

  decisions.forEach((d) => bump(d.created_at));
  goals.forEach((g) => bump(g.created_at));
  thinkingSessions.forEach((s) => bump(s.createdAt));
  modelApps.forEach((a) => bump(a.createdAt));
  if (vault) {
    Object.values(vault.documents).forEach((doc) => bump(doc.createdAt));
  }
  graphNodes.forEach((n) => bump(n.created_at));

  const activityTrend = lastNDays(7).map((date) => ({
    date: formatDayLabel(date),
    count: activityBuckets.get(date) ?? 0,
  }));

  const recentActivity: ActivityItem[] = [
    ...activeDecisions.map((d) => ({
      id: `decision-${d.id}`,
      title: d.title,
      module: "decision",
      moduleLabel: "决策",
      time: d.updated_at,
      href: "/decisions",
    })),
    ...goals.map((g) => ({
      id: `goal-${g.id}`,
      title: g.title,
      module: "goal",
      moduleLabel: "目标",
      time: g.updated_at,
      href: "/goals",
    })),
    ...thinkingSessions.map((s) => ({
      id: `thinking-${s.id}`,
      title: s.title,
      module: "thinking",
      moduleLabel: "思考",
      time: s.updatedAt,
      href: "/thinking",
    })),
    ...modelApps.map((a) => ({
      id: `model-${a.id}`,
      title: a.scenario || a.modelName,
      module: "model",
      moduleLabel: "模型",
      time: a.updatedAt,
      href: "/models",
    })),
    ...(vault
      ? Object.values(vault.documents).map((doc) => ({
          id: `canvas-${doc.id}`,
          title: doc.name,
          module: "canvas",
          moduleLabel: "画布",
          time: doc.updatedAt,
          href: "/canvas",
        }))
      : []),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  return {
    raw: {
      goals,
      decisions,
      thinkingCountInRange: (filters) => {
        const match =
          typeof filters === "string"
            ? (iso: string) => inTimeRange(iso, filters)
            : (iso: string) => matchesTimeFilter(iso, filters);
        return thinkingSessions.filter((s) => match(s.createdAt)).length;
      },
      modelAppsInRange: (filters) => {
        const match =
          typeof filters === "string"
            ? (iso: string) => inTimeRange(iso, filters)
            : (iso: string) => matchesTimeFilter(iso, filters);
        return modelApps.filter((a) => match(a.createdAt)).length;
      },
      canvasDocsInRange: (filters) => {
        if (!vault) return 0;
        const match =
          typeof filters === "string"
            ? (iso: string) => inTimeRange(iso, filters)
            : (iso: string) => matchesTimeFilter(iso, filters);
        return Object.values(vault.documents).filter((d) =>
          match(d.createdAt)
        ).length;
      },
      graphNodesInRange: (filters) => {
        const match =
          typeof filters === "string"
            ? (iso: string) => inTimeRange(iso, filters)
            : (iso: string) => matchesTimeFilter(iso, filters);
        return graphNodes.filter((n) => match(n.created_at)).length;
      },
    },
    kpis: {
      decisions: activeDecisions.length,
      activeGoals: activeGoals.length,
      thinkingSessions: thinkingSessions.length,
      modelApplies: modelApps.length,
      canvasDocs,
      graphNodes: graphNodes.length,
      inboxItems,
    },
    decisionSource,
    decisionOutcome,
    goalTypeDist,
    goalProgress,
    moduleUsage,
    activityTrend,
    recentActivity,
    seeds: buildSeedSummary(),
  };
}
