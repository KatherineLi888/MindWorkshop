import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import type { GraphNodeRow } from "@/types/database";
import { anchorKey } from "./anchors";

export function loadTrackProblems(): GraphNodeRow[] {
  const raw = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  return raw
    .filter((n) => n.node_type === "problem")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
}

export function problemsForAnchor(
  nodes: GraphNodeRow[],
  type: "goal" | "decision" | "goal_kr",
  id: string
): GraphNodeRow[] {
  return nodes.filter(
    (n) => n.anchor_type === type && n.anchor_id === id
  );
}

export function groupProblemsByAnchor(
  nodes: GraphNodeRow[]
): Map<string, GraphNodeRow[]> {
  const map = new Map<string, GraphNodeRow[]>();
  for (const n of nodes) {
    if (!n.anchor_type || !n.anchor_id) continue;
    const key = anchorKey(n.anchor_type, n.anchor_id);
    const list = map.get(key) ?? [];
    list.push(n);
    map.set(key, list);
  }
  return map;
}

export function openProblemCount(nodes: GraphNodeRow[]): number {
  return nodes.filter((n) => !n.resolved).length;
}
