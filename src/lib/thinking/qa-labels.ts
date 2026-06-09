import { getOrderedChildNodes } from "./text-board";
import type { ThoughtNode, ThoughtSession } from "./types";

export type QaRow = {
  questionId: string;
  answerId: string | null;
  depth: number;
  label: string;
  question: ThoughtNode;
  answer: ThoughtNode | null;
};

function levelLetter(depth: number): string {
  const idx = Math.max(0, Math.min(25, depth - 1));
  return String.fromCharCode(65 + idx);
}

function getAnswerNode(
  session: ThoughtSession,
  questionId: string
): ThoughtNode | null {
  return (
    getOrderedChildNodes(session, session.nodes, questionId).find(
      (c) => c.type === "answer"
    ) ?? null
  );
}

function collectFromParent(
  session: ThoughtSession,
  parentId: string,
  depth: number
): QaRow[] {
  const questions = getOrderedChildNodes(session, session.nodes, parentId).filter(
    (n) => n.type === "question"
  );

  const rows: QaRow[] = [];
  questions.forEach((question, index) => {
    const answer = getAnswerNode(session, question.id);
    const label = `${levelLetter(depth)}${index + 1}`;
    rows.push({
      questionId: question.id,
      answerId: answer?.id ?? null,
      depth,
      label,
      question,
      answer,
    });
    if (answer) {
      rows.push(...collectFromParent(session, answer.id, depth + 1));
    }
  });
  return rows;
}

export function buildQaRows(session: ThoughtSession, rootId: string): QaRow[] {
  if (!rootId) return [];
  return collectFromParent(session, rootId, 1);
}
