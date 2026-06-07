import { persistEntityLink } from "@/lib/entity-links/storage";
import { createThoughtSession } from "@/lib/thinking/storage";
import type { EntityType } from "@/types/database";
import { canFlowJump } from "./transitions";
import { recordFlowJump, registerFlowEntry } from "./pipeline-storage";
import type { FlowStage } from "./types";

function inboxLinkType(): EntityType {
  return "inbox";
}

export async function jumpFromInbox(input: {
  inboxItemId: string;
  title: string;
  toStage: FlowStage;
}): Promise<{ href: string; createdId?: string }> {
  const { inboxItemId, title, toStage } = input;
  if (!canFlowJump("inbox", toStage)) {
    throw new Error("不允许的跳入");
  }

  registerFlowEntry("inbox_manual", inboxItemId, "inbox");

  switch (toStage) {
    case "thinking": {
      const session = createThoughtSession(title);
      await persistEntityLink({
        fromType: inboxLinkType(),
        fromId: inboxItemId,
        toType: "thinking_session",
        toId: session.id,
      });
      recordFlowJump({
        fromEntityType: "inbox_manual",
        fromEntityId: inboxItemId,
        fromStage: "inbox",
        toEntityType: "thinking_session",
        toEntityId: session.id,
        toStage: "thinking",
      });
      return { href: `/thinking?session=${session.id}`, createdId: session.id };
    }
    case "decisions":
      return {
        href: `/decisions?new=1&title=${encodeURIComponent(title)}&fromInbox=${inboxItemId}`,
      };
    case "goals":
      return {
        href: `/goals?type=near&title=${encodeURIComponent(title)}&fromInbox=${inboxItemId}`,
      };
    case "track":
      return {
        href: `/graph?title=${encodeURIComponent(title)}&fromInbox=${inboxItemId}`,
      };
    default:
      throw new Error("未知目标");
  }
}

export async function linkInboxJumpTarget(
  inboxItemId: string,
  toStage: FlowStage,
  toEntityType: EntityType,
  toEntityId: string
): Promise<void> {
  registerFlowEntry("inbox_manual", inboxItemId, "inbox");
  await persistEntityLink({
    fromType: inboxLinkType(),
    fromId: inboxItemId,
    toType: toEntityType,
    toId: toEntityId,
  });
  recordFlowJump({
    fromEntityType: "inbox_manual",
    fromEntityId: inboxItemId,
    fromStage: "inbox",
    toEntityType: toEntityType,
    toEntityId: toEntityId,
    toStage: toStage,
  });
}

export function jumpFromThinkingHref(
  sessionId: string,
  title: string
): string {
  return `/decisions?new=1&title=${encodeURIComponent(title)}&fromThinking=${sessionId}`;
}

export async function linkThinkingToDecision(
  sessionId: string,
  decisionId: string
): Promise<void> {
  registerFlowEntry("thinking_session", sessionId, "thinking");
  await persistEntityLink({
    fromType: "thinking_session",
    fromId: sessionId,
    toType: "decision",
    toId: decisionId,
  });
  recordFlowJump({
    fromEntityType: "thinking_session",
    fromEntityId: sessionId,
    fromStage: "thinking",
    toEntityType: "decision",
    toEntityId: decisionId,
    toStage: "decisions",
  });
}

export function jumpFromDecisionHref(
  decisionId: string,
  title: string
): string {
  return `/goals?type=near&title=${encodeURIComponent(title)}&fromDecision=${decisionId}`;
}

export async function linkDecisionToGoal(
  decisionId: string,
  goalId: string
): Promise<void> {
  registerFlowEntry("decision", decisionId, "decisions");
  await persistEntityLink({
    fromType: "decision",
    fromId: decisionId,
    toType: "goal",
    toId: goalId,
  });
  recordFlowJump({
    fromEntityType: "decision",
    fromEntityId: decisionId,
    fromStage: "decisions",
    toEntityType: "goal",
    toEntityId: goalId,
    toStage: "goals",
  });
}

export function jumpFromGoalHref(goalId: string, title: string): string {
  return `/graph?title=${encodeURIComponent(title)}&fromGoal=${goalId}`;
}

export async function linkGoalToTrack(
  goalId: string,
  nodeId: string
): Promise<void> {
  registerFlowEntry("goal", goalId, "goals");
  await persistEntityLink({
    fromType: "goal",
    fromId: goalId,
    toType: "graph_node",
    toId: nodeId,
  });
  recordFlowJump({
    fromEntityType: "goal",
    fromEntityId: goalId,
    fromStage: "goals",
    toEntityType: "graph_node",
    toEntityId: nodeId,
    toStage: "track",
  });
}

export function jumpFromDecisionToTrackHref(
  decisionId: string,
  title: string
): string {
  return `/graph?title=${encodeURIComponent(title)}&fromDecision=${decisionId}`;
}

export async function linkDecisionToTrack(
  decisionId: string,
  nodeId: string
): Promise<void> {
  registerFlowEntry("decision", decisionId, "decisions");
  await persistEntityLink({
    fromType: "decision",
    fromId: decisionId,
    toType: "graph_node",
    toId: nodeId,
  });
  recordFlowJump({
    fromEntityType: "decision",
    fromEntityId: decisionId,
    fromStage: "decisions",
    toEntityType: "graph_node",
    toEntityId: nodeId,
    toStage: "track",
  });
}

export async function jumpFromTrack(input: {
  nodeId: string;
  title: string;
  toStage: FlowStage;
}): Promise<{ href: string; createdId?: string }> {
  const { nodeId, title, toStage } = input;
  if (!canFlowJump("track", toStage)) {
    throw new Error("不允许的回转");
  }

  registerFlowEntry("graph_node", nodeId, "track");

  switch (toStage) {
    case "thinking": {
      const session = createThoughtSession(title);
      await persistEntityLink({
        fromType: "graph_node",
        fromId: nodeId,
        toType: "thinking_session",
        toId: session.id,
      });
      recordFlowJump({
        fromEntityType: "graph_node",
        fromEntityId: nodeId,
        fromStage: "track",
        toEntityType: "thinking_session",
        toEntityId: session.id,
        toStage: "thinking",
      });
      return { href: `/thinking?session=${session.id}`, createdId: session.id };
    }
    case "decisions":
      return {
        href: `/decisions?new=1&title=${encodeURIComponent(title)}&fromTrack=${nodeId}`,
      };
    case "goals":
      return {
        href: `/goals?type=near&title=${encodeURIComponent(title)}&fromTrack=${nodeId}`,
      };
    default:
      throw new Error("未知回转目标");
  }
}

export async function linkTrackToDecision(
  nodeId: string,
  decisionId: string
): Promise<void> {
  registerFlowEntry("graph_node", nodeId, "track");
  await persistEntityLink({
    fromType: "graph_node",
    fromId: nodeId,
    toType: "decision",
    toId: decisionId,
  });
  recordFlowJump({
    fromEntityType: "graph_node",
    fromEntityId: nodeId,
    fromStage: "track",
    toEntityType: "decision",
    toEntityId: decisionId,
    toStage: "decisions",
  });
}

export async function linkTrackToGoal(
  nodeId: string,
  goalId: string
): Promise<void> {
  registerFlowEntry("graph_node", nodeId, "track");
  await persistEntityLink({
    fromType: "graph_node",
    fromId: nodeId,
    toType: "goal",
    toId: goalId,
  });
  recordFlowJump({
    fromEntityType: "graph_node",
    fromEntityId: nodeId,
    fromStage: "track",
    toEntityType: "goal",
    toEntityId: goalId,
    toStage: "goals",
  });
}
