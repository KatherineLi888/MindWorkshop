import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";

export type TrackAnchorOption = {
  type: "goal" | "decision" | "goal_kr";
  id: string;
  title: string;
  hint?: string;
};

export type TrackAnchorGroups = {
  ongoingGoals: TrackAnchorOption[];
  ongoingKrs: TrackAnchorOption[];
  recentDecisions: TrackAnchorOption[];
  moreGoals: TrackAnchorOption[];
  moreKrs: TrackAnchorOption[];
  moreDecisions: TrackAnchorOption[];
};

const RECENT_DECISION_DAYS = 45;
const RECENT_DECISION_LIMIT = 12;

export async function loadTrackAnchorGroups(): Promise<TrackAnchorGroups> {
  const [goals, decisions] = await Promise.all([
    loadAllGoals(),
    loadAllDecisions(),
  ]);

  const ongoingGoals = goals
    .filter((g) => g.goal_type !== "pending" && g.progress < 100)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .map((g) => ({
      type: "goal" as const,
      id: g.id,
      title: g.title,
      hint: `${g.progress}% · ${g.goal_type === "near" ? "近期" : "长期"}`,
    }));

  const ongoingKrs: TrackAnchorOption[] = [];
  for (const g of goals.filter(
    (g) => g.goal_type !== "pending" && g.progress < 100
  )) {
    for (const kr of g.execution.key_results) {
      if (!kr.title.trim() && kr.target <= 0) continue;
      ongoingKrs.push({
        type: "goal_kr",
        id: kr.id,
        title: kr.title.trim() || "未命名 KR",
        hint: `↳ ${g.title}`,
      });
    }
  }

  const active = decisions
    .filter((d) => !d.archived_at)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  const cutoff = Date.now() - RECENT_DECISION_DAYS * 86400000;
  const recentIds = new Set(
    active
      .filter((d) => new Date(d.updated_at).getTime() >= cutoff)
      .slice(0, RECENT_DECISION_LIMIT)
      .map((d) => d.id)
  );

  const recentDecisions = active
    .filter((d) => recentIds.has(d.id))
    .map((d) => ({
      type: "decision" as const,
      id: d.id,
      title: d.title,
      hint:
        d.tag_outcome === "abandon"
          ? "已放弃"
          : d.tag_outcome === "proceed"
            ? "进行中"
            : undefined,
    }));

  const ongoingGoalIds = new Set(ongoingGoals.map((g) => g.id));
  const moreGoals = goals
    .filter((g) => !ongoingGoalIds.has(g.id))
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 20)
    .map((g) => ({
      type: "goal" as const,
      id: g.id,
      title: g.title,
      hint: g.goal_type === "pending" ? "待定" : `${g.progress}%`,
    }));

  const moreDecisions = active
    .filter((d) => !recentIds.has(d.id))
    .slice(0, 20)
    .map((d) => ({
      type: "decision" as const,
      id: d.id,
      title: d.title,
      hint: d.tag_outcome === "abandon" ? "已放弃" : undefined,
    }));

  const moreKrs: TrackAnchorOption[] = [];
  for (const g of goals.filter((g) => ongoingGoalIds.has(g.id) === false)) {
    for (const kr of g.execution.key_results) {
      if (!kr.title.trim() && kr.target <= 0) continue;
      moreKrs.push({
        type: "goal_kr",
        id: kr.id,
        title: kr.title.trim() || "未命名 KR",
        hint: `↳ ${g.title}`,
      });
    }
  }

  return {
    ongoingGoals,
    ongoingKrs,
    recentDecisions,
    moreGoals,
    moreKrs,
    moreDecisions,
  };
}

export function anchorKey(
  type: "goal" | "decision" | "goal_kr",
  id: string
): string {
  return `${type}:${id}`;
}
