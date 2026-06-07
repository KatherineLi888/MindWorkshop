import type {
  TextChildLayout,
  ThoughtNode,
  ThoughtSession,
} from "./types";

export type { TextChildLayout, ThinkingEditorView } from "./types";

export function getChildNodes(
  nodes: ThoughtNode[],
  parentId: string
): ThoughtNode[] {
  return nodes
    .filter((n) => n.parentIds.includes(parentId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getOrderedChildNodes(
  session: ThoughtSession,
  nodes: ThoughtNode[],
  parentId: string
): ThoughtNode[] {
  const children = getChildNodes(nodes, parentId);
  const order = session.childOrder?.[parentId];
  if (!order?.length) return children;

  const byId = new Map(children.map((c) => [c.id, c]));
  const ordered: ThoughtNode[] = [];
  for (const id of order) {
    const child = byId.get(id);
    if (child) {
      ordered.push(child);
      byId.delete(id);
    }
  }
  for (const child of children) {
    if (byId.has(child.id)) ordered.push(child);
  }
  return ordered;
}

export function moveChildToIndex(
  session: ThoughtSession,
  parentId: string,
  nodeId: string,
  toIndex: number
): ThoughtSession {
  const children = getOrderedChildNodes(session, session.nodes, parentId);
  const ids = children.map((c) => c.id);
  const fromIdx = ids.indexOf(nodeId);
  if (fromIdx < 0) return session;
  const clamped = Math.max(0, Math.min(toIndex, ids.length - 1));
  if (fromIdx === clamped) return session;
  ids.splice(fromIdx, 1);
  ids.splice(clamped, 0, nodeId);
  return {
    ...session,
    childOrder: {
      ...session.childOrder,
      [parentId]: ids,
    },
  };
}

export function reorderChildNode(
  session: ThoughtSession,
  parentId: string,
  nodeId: string,
  direction: -1 | 1
): ThoughtSession {
  const children = getOrderedChildNodes(session, session.nodes, parentId);
  const idx = children.findIndex((c) => c.id === nodeId);
  if (idx < 0) return session;
  const nextIdx = idx + direction;
  if (nextIdx < 0 || nextIdx >= children.length) return session;

  const ids = children.map((c) => c.id);
  [ids[idx], ids[nextIdx]] = [ids[nextIdx], ids[idx]];

  return {
    ...session,
    childOrder: {
      ...session.childOrder,
      [parentId]: ids,
    },
  };
}

export function getTextChildLayout(
  session: ThoughtSession,
  parentId: string,
  childCount: number
): TextChildLayout {
  const stored = session.textChildLayout?.[parentId];
  if (stored) return stored;
  if (childCount >= 2) return "split";
  return "vertical";
}

export function toggleTextChildLayout(
  session: ThoughtSession,
  parentId: string
): ThoughtSession {
  const children = getChildNodes(session.nodes, parentId);
  const current = getTextChildLayout(session, parentId, children.length);
  const next: TextChildLayout =
    current === "vertical" ? "split" : "vertical";
  return {
    ...session,
    textChildLayout: {
      ...session.textChildLayout,
      [parentId]: next,
    },
  };
}
