import { loadThoughtSessions } from "./storage";
import type { ThoughtNode, ThoughtSession } from "./types";

export type MethodUsageRecord = {
  nodeId: string;
  sessionId: string;
  sessionTitle: string;
  methodId: string;
  methodShort: string;
  question: string;
  parentPreview: string;
  parentType: string;
  answerPreview: string | null;
  createdAt: string;
};

function findAnswerForQuestion(
  questionId: string,
  nodes: ThoughtNode[]
): string | null {
  const answer = nodes.find(
    (n) => n.type === "answer" && n.parentIds.includes(questionId)
  );
  if (!answer) return null;
  const text = answer.content.trim();
  return text || null;
}

export function getParentPreview(
  node: ThoughtNode,
  byId: Map<string, ThoughtNode>,
  sessionTitle: string
): { text: string; type: string } {
  const parentId = node.parentIds[0];
  if (!parentId) {
    return { text: sessionTitle, type: "topic" };
  }
  const parent = byId.get(parentId);
  if (!parent) return { text: "（未知上级）", type: "unknown" };
  return {
    text: parent.content.trim() || "（空）",
    type: parent.type,
  };
}

export function collectMethodUsages(
  methodId: string,
  methodShort: string,
  sessions = loadThoughtSessions()
): MethodUsageRecord[] {
  const list: MethodUsageRecord[] = [];

  for (const session of sessions) {
    const byId = new Map(session.nodes.map((n) => [n.id, n]));
    for (const node of session.nodes) {
      if (node.type !== "question" || node.method !== methodId) continue;
      const parent = getParentPreview(node, byId, session.title);
      list.push({
        nodeId: node.id,
        sessionId: session.id,
        sessionTitle: session.title,
        methodId,
        methodShort,
        question: node.content.trim() || "（空）",
        parentPreview: parent.text,
        parentType: parent.type,
        answerPreview: findAnswerForQuestion(node.id, session.nodes),
        createdAt: node.createdAt,
      });
    }
  }

  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function countMethodUsages(
  methodId: string,
  methodShort: string,
  sessions = loadThoughtSessions()
): number {
  return collectMethodUsages(methodId, methodShort, sessions).length;
}

export function findSessionById(
  sessionId: string,
  sessions = loadThoughtSessions()
): ThoughtSession | undefined {
  return sessions.find((s) => s.id === sessionId);
}
