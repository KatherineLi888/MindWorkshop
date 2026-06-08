import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import {
  linkDecisionToTrack,
  linkGoalToTrack,
} from "@/lib/flow/jump-actions";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import {
  migrateProblemRow,
  normalizeProblemPatch,
  type TrackHandleMode,
} from "@/lib/track/problem-status";
import type { GraphNodeRow, TrackLoopbackTarget } from "@/types/database";

export type SaveTrackProblemInput = {
  problemFocus: string;
  solutionApproach: string;
  resolutionPlan: string;
  anchorType: "goal" | "decision" | "goal_kr";
  anchorId: string;
  loopbackTarget?: TrackLoopbackTarget | null;
  background?: string;
  resolved?: boolean;
  trackHandle?: TrackHandleMode | null;
};

function deriveTitle(focus: string): string {
  const t = focus.trim();
  if (t.length <= 80) return t;
  return `${t.slice(0, 77)}…`;
}

export async function saveTrackProblem(
  input: SaveTrackProblemInput
): Promise<GraphNodeRow> {
  const now = new Date().toISOString();
  const focus = input.problemFocus.trim();
  const resolved = !!input.resolved;
  const base: GraphNodeRow = {
    id: crypto.randomUUID(),
    user_id: "local",
    title: deriveTitle(focus),
    node_type: "problem",
    background: input.background ?? "",
    problem_focus: focus,
    solution_approach: input.solutionApproach.trim(),
    resolution_plan: input.resolutionPlan.trim(),
    anchor_type: input.anchorType,
    anchor_id: input.anchorId,
    resolved,
    track_handle: resolved ? null : input.trackHandle ?? "immediate",
    loopback_target: input.loopbackTarget ?? null,
    status: resolved ? "ongoing" : "tracking",
    archived_at: null,
    position_x: 0,
    position_y: 0,
    created_at: now,
    updated_at: now,
  };
  const row = {
    ...base,
    ...normalizeProblemPatch(
      { resolved: base.resolved, track_handle: base.track_handle },
      base
    ),
  } as GraphNodeRow;

  if (input.anchorType === "goal" || input.anchorType === "goal_kr") {
    const goalId =
      input.anchorType === "goal"
        ? input.anchorId
        : await resolveGoalIdForKr(input.anchorId);
    if (goalId) await linkGoalToTrack(goalId, row.id);
  } else {
    await linkDecisionToTrack(input.anchorId, row.id);
  }

  const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  saveLocal(LOCAL_KEYS.graphNodes, [...prev, row]);
  registerFlowEntry("graph_node", row.id, "track");
  return row;
}

async function resolveGoalIdForKr(krId: string): Promise<string | null> {
  const { loadAllGoals } = await import("@/lib/goals/storage");
  const goals = await loadAllGoals();
  for (const g of goals) {
    if (g.execution.key_results.some((k) => k.id === krId)) return g.id;
  }
  return null;
}

export function updateTrackProblem(
  id: string,
  patch: Partial<GraphNodeRow>
): GraphNodeRow | null {
  const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  const idx = prev.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const focus = patch.problem_focus ?? prev[idx].problem_focus ?? prev[idx].title;
  const normalized = normalizeProblemPatch(patch, prev[idx]);
  const next: GraphNodeRow = {
    ...prev[idx],
    ...normalized,
    title: patch.problem_focus ? deriveTitle(patch.problem_focus) : prev[idx].title,
    problem_focus: patch.problem_focus ?? prev[idx].problem_focus,
    updated_at: new Date().toISOString(),
  };
  if (patch.problem_focus) {
    next.title = deriveTitle(focus);
  }
  const list = [...prev];
  list[idx] = next;
  saveLocal(LOCAL_KEYS.graphNodes, list);
  return next;
}

export function deleteTrackProblem(id: string): void {
  const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  saveLocal(
    LOCAL_KEYS.graphNodes,
    prev.filter((n) => n.id !== id)
  );
}

export function archiveTrackProblem(id: string, archive: boolean): GraphNodeRow | null {
  return updateTrackProblem(id, {
    archived_at: archive ? new Date().toISOString() : null,
    status: archive ? "paused" : "tracking",
  });
}

export function loadAllTrackProblems(): GraphNodeRow[] {
  return loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, [])
    .filter((n) => n.node_type === "problem")
    .map(migrateProblemRow)
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}
