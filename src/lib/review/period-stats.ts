import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { loadFlowJumps } from "@/lib/flow/pipeline-storage";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { loadTriageRecords } from "@/lib/triage/storage";
import type { GraphNodeRow } from "@/types/database";
import { PERIOD_PRESET_LABELS } from "./period-labels";
import type { PeriodPreset, PeriodStatsSnapshot, PeriodStatItem } from "./types";

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolvePeriodRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (preset === "day") {
    return {
      start: startOfDay(now),
      end: endOfDay(now),
      label: PERIOD_PRESET_LABELS.day,
    };
  }
  if (preset === "week") {
    const start = startOfDay(now);
    const dow = start.getDay() || 7;
    start.setDate(start.getDate() - (dow - 1));
    return { start, end: endOfDay(now), label: PERIOD_PRESET_LABELS.week };
  }
  if (preset === "month") {
    return {
      start: startOfMonth(now),
      end: endOfDay(now),
      label: PERIOD_PRESET_LABELS.month,
    };
  }
  if (preset === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), q * 3, 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: endOfDay(now), label: PERIOD_PRESET_LABELS.quarter };
  }
  if (preset === "half_year") {
    const h = now.getMonth() < 6 ? 0 : 6;
    const start = new Date(now.getFullYear(), h, 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: endOfDay(now), label: PERIOD_PRESET_LABELS.half_year };
  }
  if (preset === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    start.setHours(0, 0, 0, 0);
    return { start, end: endOfDay(now), label: PERIOD_PRESET_LABELS.year };
  }
  const start = customStart ? startOfDay(new Date(customStart)) : startOfDay(now);
  const end = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
  return { start, end, label: PERIOD_PRESET_LABELS.custom };
}

function countJumpsInPeriod(
  start: Date,
  end: Date,
  toStage: string
): number {
  return new Set(
    loadFlowJumps()
      .filter(
        (j) =>
          j.toStage === toStage && inRange(j.createdAt, start, end)
      )
      .map((j) => j.toEntityId)
  ).size;
}

function detectAnomalies(input: {
  thinking: number;
  decisions: number;
  goals: number;
  track: number;
  triage: number;
}): PeriodStatItem[] {
  const items: PeriodStatItem[] = [
    {
      key: "triage",
      label: "闪念/定位",
      value: `${input.triage} 条`,
      numericValue: input.triage,
    },
    {
      key: "thinking",
      label: "新建思考",
      value: `${input.thinking} 个`,
      numericValue: input.thinking,
    },
    {
      key: "decisions",
      label: "新建决策",
      value: `${input.decisions} 条`,
      numericValue: input.decisions,
    },
    {
      key: "goals",
      label: "新建目标",
      value: `${input.goals} 个`,
      numericValue: input.goals,
    },
    {
      key: "track",
      label: "追踪问题",
      value: `${input.track} 个`,
      numericValue: input.track,
    },
  ];

  if (input.thinking >= 2 && input.decisions / Math.max(input.thinking, 1) < 0.4) {
    const thinkingItem = items.find((i) => i.key === "thinking");
    if (thinkingItem) {
      thinkingItem.anomaly = true;
      thinkingItem.anomalyHint = "想得多、决策少——复盘可聚焦「为何停在思考」";
    }
  }

  if (input.decisions >= 2 && input.goals / Math.max(input.decisions, 1) < 0.4) {
    const decisionItem = items.find((i) => i.key === "decisions");
    if (decisionItem) {
      decisionItem.anomaly = true;
      decisionItem.anomalyHint = "决策多、目标少——是否缺少承诺与落地";
    }
  }

  if (input.triage >= 3 && input.thinking + input.decisions < input.triage * 0.3) {
    const triageItem = items.find((i) => i.key === "triage");
    if (triageItem) {
      triageItem.anomaly = true;
      triageItem.anomalyHint = "输入多、下游少——素材是否未及时推进";
    }
  }

  if (input.track >= 2 && input.goals === 0 && input.decisions === 0) {
    const trackItem = items.find((i) => i.key === "track");
    if (trackItem) {
      trackItem.anomaly = true;
      trackItem.anomalyHint = "追踪活跃但缺少决策/目标锚定";
    }
  }

  return items;
}

export async function buildPeriodStats(
  start: Date,
  end: Date
): Promise<PeriodStatsSnapshot> {
  const triageCount = loadTriageRecords().filter((r) =>
    inRange(r.createdAt, start, end)
  ).length;

  const thinkingCount = loadThoughtSessions().filter((s) =>
    inRange(s.createdAt, start, end)
  ).length;

  const decisions = await loadAllDecisions();
  const decisionCount = decisions.filter(
    (d) => !d.archived_at && inRange(d.created_at, start, end)
  ).length;

  const goals = await loadAllGoals();
  const goalCount = goals.filter((g) =>
    inRange(g.created_at, start, end)
  ).length;

  const nodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  const trackCount = nodes.filter((n) =>
    inRange(n.created_at, start, end)
  ).length;

  const funnel = {
    thinking: countJumpsInPeriod(start, end, "thinking") || thinkingCount,
    decisions: countJumpsInPeriod(start, end, "decisions") || decisionCount,
    goals: countJumpsInPeriod(start, end, "goals") || goalCount,
    track: countJumpsInPeriod(start, end, "track") || trackCount,
  };

  const items = detectAnomalies({
    thinking: thinkingCount,
    decisions: decisionCount,
    goals: goalCount,
    track: trackCount,
    triage: triageCount,
  });

  return {
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    triageCount,
    thinkingCount,
    decisionCount,
    goalCount,
    trackCount,
    funnel,
    items,
  };
}

export async function buildGoalReviewStats(
  goalId: string
): Promise<PeriodStatItem[]> {
  const goals = await loadAllGoals();
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return [];

  const items: PeriodStatItem[] = [
    {
      key: "goal_progress",
      label: "目标进度",
      value: `${goal.progress ?? 0}%`,
      numericValue: goal.progress ?? 0,
    },
    {
      key: "goal_type",
      label: "目标类型",
      value: goal.goal_type === "near" ? "近期" : goal.goal_type === "long" ? "长期" : "待定",
    },
  ];

  const krs = goal.execution?.key_results ?? [];
  krs.forEach((kr, idx) => {
    const pct =
      kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0;
    const weak = kr.target > 0 && kr.current / kr.target < 0.5;
    items.push({
      key: `kr_${idx}`,
      label: `KR${idx + 1}`,
      value: `${kr.current}/${kr.target}${kr.unit ? ` ${kr.unit}` : ""} (${pct}%)`,
      anomaly: weak,
      anomalyHint: weak ? `「${kr.title}」推进不足，可在此复盘` : undefined,
    });
  });

  if ((goal.progress ?? 0) < 40 && krs.length > 0) {
    const progressItem = items.find((i) => i.key === "goal_progress");
    if (progressItem) {
      progressItem.anomaly = true;
      progressItem.anomalyHint = "整体进度偏低，复盘可聚焦执行卡点";
    }
  }

  return items;
}
