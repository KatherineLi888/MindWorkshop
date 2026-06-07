import { getOrderedChildNodes } from "@/lib/thinking/text-board";
import type { ThoughtNode, ThoughtSession } from "@/lib/thinking/types";

/** 新子节点应挂载的父 id（有回答时挂在回答下） */
export function resolveChildMountParentId(
  session: ThoughtSession,
  node: ThoughtNode
): string {
  if (node.type === "topic" || node.type === "answer") return node.id;
  if (node.type === "question") {
    const answer = getOrderedChildNodes(session, session.nodes, node.id).find(
      (c) => c.type === "answer"
    );
    return answer?.id ?? node.id;
  }
  return node.id;
}
