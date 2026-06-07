import { getChildNodes } from "./text-board";
import type { ThoughtNode, ThoughtSession } from "./types";

export type ThoughtSessionSummary = {
  /** 当前阶段性结论（最新 conclusion / merge） */
  conclusion: string | null;
  /** 卡在哪一步 */
  stageLabel: string;
  /** 当前待答问题 */
  currentQuestion: string | null;
  /** 是否有未答问题 */
  hasOpenQuestions: boolean;
};

function latestByType(
  nodes: ThoughtNode[],
  types: ThoughtNode["type"][]
): ThoughtNode | null {
  let latest: ThoughtNode | null = null;
  for (const n of nodes) {
    if (!types.includes(n.type)) continue;
    if (!latest || n.createdAt > latest.createdAt) latest = n;
  }
  return latest;
}

function findOpenQuestions(session: ThoughtSession): ThoughtNode[] {
  const { nodes } = session;
  return nodes
    .filter((n) => n.type === "question")
    .filter((n) => {
      const answers = getChildNodes(nodes, n.id).filter(
        (c) => c.type === "answer"
      );
      return answers.length === 0;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function summarizeThoughtSession(
  session: ThoughtSession
): ThoughtSessionSummary {
  const conclusionNode = latestByType(session.nodes, ["conclusion", "merge"]);
  const openQuestions = findOpenQuestions(session);
  const latestOpen = openQuestions[0] ?? null;

  let stageLabel = "推进中";
  if (conclusionNode && !latestOpen) {
    stageLabel = "已有结论 · 待跳入决策";
  } else if (latestOpen) {
    stageLabel = "提问中";
  } else if (session.nodes.length <= 1) {
    stageLabel = "刚开始";
  }

  return {
    conclusion: conclusionNode?.content.trim() || null,
    stageLabel,
    currentQuestion: latestOpen?.content.trim() || null,
    hasOpenQuestions: openQuestions.length > 0,
  };
}
