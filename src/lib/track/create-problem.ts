import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import type { GraphNodeRow } from "@/types/database";

type CreateProblemInput = {
  title: string;
  anchorType: "goal" | "decision" | "goal_kr";
  anchorId: string;
  problemFocus?: string;
  solutionApproach?: string;
  background?: string;
};

export function createLocalTrackProblem(
  input: CreateProblemInput
): GraphNodeRow {
  const now = new Date().toISOString();
  const row: GraphNodeRow = {
    id: crypto.randomUUID(),
    user_id: "local",
    title: input.title.trim(),
    node_type: "problem",
    background: input.background ?? "",
    problem_focus: input.problemFocus?.trim() || input.title.trim(),
    solution_approach: input.solutionApproach?.trim() ?? "",
    anchor_type: input.anchorType,
    anchor_id: input.anchorId,
    resolved: false,
    loopback_target: null,
    status: "tracking",
    position_x: 0,
    position_y: 0,
    created_at: now,
    updated_at: now,
  };

  const prev = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  saveLocal(LOCAL_KEYS.graphNodes, [...prev, row]);
  registerFlowEntry("graph_node", row.id, "track");
  return row;
}
