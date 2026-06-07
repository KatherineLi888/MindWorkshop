import { getChildNodes } from "@/lib/thinking/text-board";
import type { ThoughtNode, ThoughtSession } from "./types";
import { upsertNode } from "./storage";

export function findAnswerUnderQuestion(
  nodes: ThoughtNode[],
  questionId: string
): ThoughtNode | undefined {
  return getChildNodes(nodes, questionId).find((c) => c.type === "answer");
}

/** 在问题下填写或创建唯一回答节点（各视图共用） */
export function fillOrCreateAnswer(
  session: ThoughtSession,
  questionId: string,
  text: string,
  marksProgress: boolean
): ThoughtSession {
  const trimmed = text.trim();
  if (!trimmed) return session;

  const existing = findAnswerUnderQuestion(session.nodes, questionId);
  if (existing) {
    return upsertNode(session, {
      ...existing,
      content: trimmed,
      marksProgress,
    });
  }

  return upsertNode(session, {
    id: crypto.randomUUID(),
    type: "answer",
    content: trimmed,
    parentIds: [questionId],
    marksProgress,
    createdAt: new Date().toISOString(),
  });
}
