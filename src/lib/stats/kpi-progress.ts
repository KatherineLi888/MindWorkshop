import type { DashboardStats } from "./aggregate";
import { loadThoughtSessions } from "@/lib/thinking/storage";

export type KpiProgressMetrics = {
  thinking: number;
  decisions: number;
  goals: number;
  seeds: number;
};

export function computeKpiProgress(stats: DashboardStats): KpiProgressMetrics {
  const sessions = loadThoughtSessions();
  const thinkingDone = sessions.filter((s) =>
    s.nodes.some(
      (n) =>
        n.type === "answer" &&
        n.content?.trim() &&
        n.content.trim().length > 2
    )
  ).length;
  const thinking =
    sessions.length > 0
      ? Math.round((thinkingDone / sessions.length) * 100)
      : 0;

  const decisions = stats.raw.decisions.filter((d) => !d.archived_at);
  const proceed = decisions.filter((d) => d.tag_outcome === "proceed").length;
  const decisionPct =
    decisions.length > 0
      ? Math.round((proceed / decisions.length) * 100)
      : 0;

  const activeGoals = stats.raw.goals.filter((g) => g.progress < 100);
  const goals =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((a, g) => a + g.progress, 0) / activeGoals.length
        )
      : 0;

  const { sprouting, growing, archived } = stats.seeds;
  const seedTotal = sprouting + growing + archived;
  const seeds =
    seedTotal > 0
      ? Math.round(((growing + sprouting) / seedTotal) * 100)
      : 0;

  return {
    thinking,
    decisions: decisionPct,
    goals,
    seeds,
  };
}
