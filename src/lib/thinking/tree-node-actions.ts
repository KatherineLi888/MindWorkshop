import { getChildNodes } from "@/lib/thinking/text-board";
import type { ThoughtNode } from "@/lib/thinking/types";

export function treeChildParent(
  node: ThoughtNode,
  nodes: ThoughtNode[]
): { parentId: string; parentNode: ThoughtNode } {
  if (node.type === "answer" || node.type === "topic") {
    return { parentId: node.id, parentNode: node };
  }
  if (node.type === "question") {
    const ans = getChildNodes(nodes, node.id).find((c) => c.type === "answer");
    if (ans) return { parentId: ans.id, parentNode: ans };
    return { parentId: node.id, parentNode: node };
  }
  return { parentId: node.id, parentNode: node };
}

export function canAddTreeSibling(node: ThoughtNode): boolean {
  return node.type !== "answer" && node.type !== "topic";
}

export function treeNodePathToRoot(
  nodes: ThoughtNode[],
  nodeId: string,
  sessionRootId: string
): ThoughtNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const path: ThoughtNode[] = [];
  const visiting = new Set<string>();
  let cur = byId.get(nodeId);
  while (cur && !visiting.has(cur.id)) {
    visiting.add(cur.id);
    path.unshift(cur);
    if (cur.id === sessionRootId) break;
    const parent = cur.parentIds.find((p) => byId.has(p));
    cur = parent ? byId.get(parent) : undefined;
  }
  return path;
}

export function treeNodeLabel(node: ThoughtNode): string {
  const t = node.content.trim();
  if (!t) return node.type === "topic" ? "主题" : "（空）";
  return t.length > 20 ? `${t.slice(0, 20)}…` : t;
}
