import type { ProgressVsTime } from "@/lib/goals/time-progress";
import { getTimeVsLabel } from "@/lib/goals/time-vs-label";
import type { GoalWithMeta } from "@/lib/goals/storage";
import { loadFlowJumps } from "@/lib/flow/pipeline-storage";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { resolvePeriodRange } from "@/lib/review/period-stats";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { loadTriageRecords } from "@/lib/triage/storage";
import type { DecisionRow, GraphNodeRow } from "@/types/database";
import { formatDateOnly } from "@/lib/utils";

export type PeriodBriefRange = "week" | "month";

export type MetricDelta = {
  key: string;
  label: string;
  icon: string;
  current: number;
  previous: number;
  unit: string;
  trend: "up" | "down" | "flat";
};

export type GoalPulse = {
  id: string;
  title: string;
  progress: number;
  vs: ProgressVsTime | "unknown";
  tag: string;
};

export type PeriodBrief = {
  periodLabel: string;
  periodRange: string;
  overallTone: "ahead" | "behind" | "mixed" | "sync" | "none";
  overallHeadline: string;
  progressCounts: {
    ahead: number;
    onTrack: number;
    behind: number;
    unknown: number;
    total: number;
  };
  watchGoals: GoalPulse[];
  leadingGoals: GoalPulse[];
  metrics: MetricDelta[];
  funnel: { thinking: number; decisions: number; goals: number; track: number };
  insights: string[];
  flowNote: string;
};

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function previousPeriodRange(preset: PeriodBriefRange): {
  current: { start: Date; end: Date };
  previous: { start: Date; end: Date };
} {
  const current = resolvePeriodRange(preset);
  const prevEnd = new Date(current.start.getTime() - 1);
  if (preset === "week") {
    const prevStart = new Date(prevEnd);
    const dow = prevStart.getDay() || 7;
    prevStart.setHours(0, 0, 0, 0);
    prevStart.setDate(prevStart.getDate() - (dow - 1));
    return {
      current: { start: current.start, end: current.end },
      previous: { start: prevStart, end: prevEnd },
    };
  }
  const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);
  prevStart.setHours(0, 0, 0, 0);
  return {
    current: { start: current.start, end: current.end },
    previous: { start: prevStart, end: prevEnd },
  };
}

function countJumpsInPeriod(start: Date, end: Date, toStage: string): number {
  return new Set(
    loadFlowJumps()
      .filter(
        (j) => j.toStage === toStage && inRange(j.createdAt, start, end)
      )
      .map((j) => j.toEntityId)
  ).size;
}

type PeriodCounts = {
  triage: number;
  thinking: number;
  decisions: number;
  goals: number;
  track: number;
};

function countPeriodActivity(
  start: Date,
  end: Date,
  decisions: DecisionRow[],
  goals: GoalWithMeta[]
): PeriodCounts {
  const thinking = loadThoughtSessions().filter((s) =>
    inRange(s.createdAt, start, end)
  ).length;

  const decisionCount = decisions.filter(
    (d) => !d.archived_at && inRange(d.created_at, start, end)
  ).length;

  const goalCount = goals.filter((g) => inRange(g.created_at, start, end)).length;

  const triage = loadTriageRecords().filter((r) =>
    inRange(r.createdAt, start, end)
  ).length;

  const nodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  const track = nodes.filter((n) => inRange(n.created_at, start, end)).length;

  return {
    triage,
    thinking,
    decisions: decisionCount,
    goals: goalCount,
    track,
  };
}

function metricTrend(current: number, previous: number): "up" | "down" | "flat" {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

function buildMetrics(
  cur: PeriodCounts,
  prev: PeriodCounts
): MetricDelta[] {
  const defs: Array<{
    key: keyof PeriodCounts;
    label: string;
    icon: string;
    unit: string;
  }> = [
    { key: "thinking", label: "思考", icon: "◉", unit: "个" },
    { key: "decisions", label: "决策", icon: "◇", unit: "条" },
    { key: "goals", label: "目标", icon: "◎", unit: "个" },
    { key: "track", label: "追踪", icon: "◈", unit: "个" },
    { key: "triage", label: "闪念", icon: "✎", unit: "条" },
  ];
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    icon: d.icon,
    current: cur[d.key],
    previous: prev[d.key],
    unit: d.unit,
    trend: metricTrend(cur[d.key], prev[d.key]),
  }));
}

function analyzeGoals(goals: GoalWithMeta[]): {
  counts: PeriodBrief["progressCounts"];
  watchGoals: GoalPulse[];
  leadingGoals: GoalPulse[];
  overallTone: PeriodBrief["overallTone"];
  overallHeadline: string;
} {
  const active = goals.filter(
    (g) => g.goal_type !== "pending" && g.progress < 100
  );

  if (!active.length) {
    return {
      counts: { ahead: 0, onTrack: 0, behind: 0, unknown: 0, total: 0 },
      watchGoals: [],
      leadingGoals: [],
      overallTone: "none",
      overallHeadline: "暂无进行中的目标",
    };
  }

  const pulses: GoalPulse[] = active.map((g) => {
    const label = getTimeVsLabel(
      g.progress,
      g.execution.start_date,
      g.execution.due_date
    );
    const vs =
      label?.vs === "not_started" || label?.vs === "ended"
        ? "unknown"
        : (label?.vs ?? "unknown");
    return {
      id: g.id,
      title: g.title,
      progress: g.progress,
      vs,
      tag: label?.text ?? "—",
    };
  });

  const ahead = pulses.filter((p) => p.vs === "ahead");
  const behind = pulses.filter((p) => p.vs === "behind");
  const onTrack = pulses.filter((p) => p.vs === "on_track");
  const unknown = pulses.filter((p) => p.vs === "unknown");

  const counts = {
    ahead: ahead.length,
    onTrack: onTrack.length,
    behind: behind.length,
    unknown: unknown.length,
    total: active.length,
  };

  let overallTone: PeriodBrief["overallTone"] = "mixed";
  let overallHeadline = "目标进度参差，需逐个核对";

  if (behind.length > ahead.length && behind.length >= onTrack.length) {
    overallTone = "behind";
    overallHeadline = `${behind.length} 个目标落后时间线，需优先追赶`;
  } else if (ahead.length > behind.length && ahead.length >= onTrack.length) {
    overallTone = "ahead";
    overallHeadline = `${ahead.length} 个目标领先计划，节奏良好`;
  } else if (behind.length === 0 && onTrack.length > 0) {
    overallTone = "sync";
    overallHeadline = "整体与时间进度同步";
  } else if (unknown.length === active.length) {
    overallTone = "none";
    overallHeadline = `${active.length} 个目标进行中，尚未进入时间进度`;
  }

  const watchGoals = [...behind]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);
  const leadingGoals = [...ahead]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  return {
    counts,
    watchGoals,
    leadingGoals,
    overallTone,
    overallHeadline,
  };
}

function buildInsights(cur: PeriodCounts, prev: PeriodCounts): string[] {
  const insights: string[] = [];

  if (cur.thinking >= 2 && cur.decisions / Math.max(cur.thinking, 1) < 0.4) {
    insights.push("思考多、决策少——可能停在发散阶段，适合做一次决策复盘");
  }
  if (cur.decisions >= 2 && cur.goals / Math.max(cur.decisions, 1) < 0.4) {
    insights.push("决策多、目标少——承诺与落地可能不足，检查是否缺少 OKR");
  }
  if (cur.triage >= 3 && cur.thinking + cur.decisions < cur.triage * 0.3) {
    insights.push("闪念输入多、下游产出少——素材是否未及时推进");
  }
  if (cur.track >= 2 && cur.goals === 0 && cur.decisions === 0) {
    insights.push("问题追踪活跃但缺少决策/目标锚定");
  }

  const thinkDelta = cur.thinking - prev.thinking;
  const decDelta = cur.decisions - prev.decisions;
  if (thinkDelta > 0 && decDelta <= 0 && cur.thinking >= 3) {
    insights.push(
      `思考比上周期多 ${thinkDelta} 个，决策未同步增长——留意是否「只想不做」`
    );
  }
  if (decDelta > 0 && thinkDelta <= 0 && cur.decisions >= 2) {
    insights.push(
      `决策比上周期多 ${decDelta} 条，思考输入偏少——决策质量值得复盘`
    );
  }

  return insights.slice(0, 3);
}

function buildFlowNote(cur: PeriodCounts, prev: PeriodCounts): string {
  const curRatio =
    cur.thinking > 0
      ? Math.round((cur.decisions / cur.thinking) * 100)
      : null;
  const prevRatio =
    prev.thinking > 0
      ? Math.round((prev.decisions / prev.thinking) * 100)
      : null;

  if (curRatio == null && prevRatio == null) {
    return "本周期尚无思考产出，流程尚未启动";
  }
  if (curRatio == null) {
    return `上周期思考→决策转化约 ${prevRatio}%，本周期尚无新思考`;
  }
  if (prevRatio == null) {
    return `思考→决策转化约 ${curRatio}%（上周期无思考基数）`;
  }
  const diff = curRatio - prevRatio;
  if (diff > 5) {
    return `思考→决策转化 ${curRatio}%，比上周期高 ${diff} 个百分点，闭环更紧`;
  }
  if (diff < -5) {
    return `思考→决策转化 ${curRatio}%，比上周期低 ${Math.abs(diff)} 个百分点，推进偏慢`;
  }
  return `思考→决策转化约 ${curRatio}%，与上周期接近`;
}

export function buildPeriodBrief(
  preset: PeriodBriefRange,
  goals: GoalWithMeta[],
  decisions: DecisionRow[]
): PeriodBrief {
  const { current, previous } = previousPeriodRange(preset);
  const cur = countPeriodActivity(current.start, current.end, decisions, goals);
  const prev = countPeriodActivity(
    previous.start,
    previous.end,
    decisions,
    goals
  );

  const periodLabel = preset === "week" ? "本周" : "本月";
  const periodRange = `${formatDateOnly(current.start.toISOString())} – ${formatDateOnly(current.end.toISOString())}`;

  const goalAnalysis = analyzeGoals(goals);

  const funnel = {
    thinking: countJumpsInPeriod(current.start, current.end, "thinking") || cur.thinking,
    decisions:
      countJumpsInPeriod(current.start, current.end, "decisions") || cur.decisions,
    goals: countJumpsInPeriod(current.start, current.end, "goals") || cur.goals,
    track: countJumpsInPeriod(current.start, current.end, "track") || cur.track,
  };

  return {
    periodLabel,
    periodRange,
    overallTone: goalAnalysis.overallTone,
    overallHeadline: goalAnalysis.overallHeadline,
    progressCounts: goalAnalysis.counts,
    watchGoals: goalAnalysis.watchGoals,
    leadingGoals: goalAnalysis.leadingGoals,
    metrics: buildMetrics(cur, prev),
    funnel,
    insights: buildInsights(cur, prev),
    flowNote: buildFlowNote(cur, prev),
  };
}
