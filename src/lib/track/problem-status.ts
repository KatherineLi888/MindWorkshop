import type { GraphNodeRow } from "@/types/database";

export type TrackHandleMode = "inbox" | "immediate";

export function isProblemResolved(node: GraphNodeRow): boolean {
  return !!node.resolved;
}

export function isProblemActive(node: GraphNodeRow): boolean {
  return !node.resolved;
}

export function defaultHandleForActive(
  handle?: TrackHandleMode | null
): TrackHandleMode {
  return handle === "inbox" ? "inbox" : "immediate";
}

export function handleLabel(
  handle: TrackHandleMode | null | undefined
): string {
  if (handle === "inbox") return "收集箱";
  if (handle === "immediate") return "立即处理";
  return "";
}

export function normalizeProblemPatch(
  patch: Partial<GraphNodeRow>,
  current?: GraphNodeRow
): Partial<GraphNodeRow> {
  const next = { ...patch };
  if (next.resolved === true) {
    next.track_handle = null;
    next.status = "ongoing";
  }
  if (next.resolved === false) {
    if (next.track_handle == null && current && !current.track_handle) {
      next.track_handle = "immediate";
    }
    if (next.status === "ongoing") next.status = "tracking";
  }
  return next;
}

export function migrateProblemRow(node: GraphNodeRow): GraphNodeRow {
  if (node.resolved) {
    return { ...node, track_handle: null };
  }
  if (!node.track_handle) {
    return { ...node, track_handle: "immediate" };
  }
  return node;
}
