import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { moveThinkingSessionToTrash } from "@/lib/trash/storage";
import type { ThoughtNode, ThoughtSession } from "./types";

function normalizeSession(session: ThoughtSession): ThoughtSession {
  if (!session.nodes?.length) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    return {
      ...session,
      nodes: [
        {
          id,
          type: "topic",
          content: session.title || "未命名",
          parentIds: [],
          marksProgress: false,
          createdAt: now,
        },
      ],
    };
  }
  const hasRoot = session.nodes.some(
    (n) => n.type === "topic" && n.parentIds.length === 0
  );
  if (hasRoot) {
    return {
      ...session,
      editorView: session.editorView ?? "text",
      textChildLayout: session.textChildLayout ?? {},
    };
  }
  const first = session.nodes[0];
  return {
    ...session,
    nodes: [
      { ...first, type: "topic", parentIds: [] },
      ...session.nodes.slice(1),
    ],
  };
}

export function loadThoughtSessions(): ThoughtSession[] {
  return loadLocal<ThoughtSession[]>(LOCAL_KEYS.thinking, []).map(
    normalizeSession
  );
}

export function saveThoughtSessions(sessions: ThoughtSession[]) {
  saveLocal(LOCAL_KEYS.thinking, sessions);
}

export function createThoughtSession(
  title: string,
  options?: { sourceTriageId?: string }
): ThoughtSession {
  const now = new Date().toISOString();
  const rootId = crypto.randomUUID();
  const session: ThoughtSession = {
    id: crypto.randomUUID(),
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
    editorView: "text",
    textChildLayout: {},
    sourceTriageId: options?.sourceTriageId,
    nodes: [
      {
        id: rootId,
        type: "topic",
        content: title.trim(),
        parentIds: [],
        marksProgress: false,
        createdAt: now,
      },
    ],
  };
  const all = loadThoughtSessions();
  saveThoughtSessions([session, ...all]);
  return session;
}

export function updateThoughtSession(
  session: ThoughtSession
): ThoughtSession[] {
  const next = { ...session, updatedAt: new Date().toISOString() };
  const all = loadThoughtSessions().map((s) =>
    s.id === session.id ? next : s
  );
  saveThoughtSessions(all);
  return all;
}

export function deleteThoughtSession(id: string): ThoughtSession[] {
  const all = loadThoughtSessions();
  const target = all.find((s) => s.id === id);
  if (target) moveThinkingSessionToTrash(target);
  const next = all.filter((s) => s.id !== id);
  saveThoughtSessions(next);
  return next;
}

export function restoreThoughtSession(session: ThoughtSession): ThoughtSession[] {
  const all = loadThoughtSessions();
  if (all.some((s) => s.id === session.id)) return all;
  saveThoughtSessions([session, ...all]);
  return [session, ...all];
}

export function getRootId(session: ThoughtSession): string {
  const root = session.nodes.find(
    (n) => n.type === "topic" && n.parentIds.length === 0
  );
  return root?.id ?? session.nodes[0]?.id ?? "";
}

export function deleteThoughtNode(
  session: ThoughtSession,
  nodeId: string
): ThoughtSession {
  const root = session.nodes.find(
    (n) => n.type === "topic" && n.parentIds.length === 0
  );
  if (!root || nodeId === root.id) return session;

  const toDelete = new Set<string>();
  const collect = (id: string) => {
    if (toDelete.has(id)) return;
    toDelete.add(id);
    for (const n of session.nodes) {
      if (n.parentIds.includes(id)) collect(n.id);
    }
  };
  collect(nodeId);

  let nodes = session.nodes.filter((n) => !toDelete.has(n.id));
  nodes = nodes.filter((n) => {
    if (
      (n.type === "merge" || n.type === "conclusion") &&
      n.parentIds.length >= 2
    ) {
      return n.parentIds.every(
        (p) => !toDelete.has(p) && nodes.some((x) => x.id === p)
      );
    }
    return true;
  });

  const childOrder = { ...session.childOrder };
  for (const [pid, ids] of Object.entries(childOrder)) {
    if (toDelete.has(pid)) {
      delete childOrder[pid];
      continue;
    }
    childOrder[pid] = ids.filter((id) => !toDelete.has(id));
  }

  const textChildLayout = { ...session.textChildLayout };
  for (const id of toDelete) {
    delete textChildLayout[id];
  }

  return {
    ...session,
    nodes,
    childOrder,
    textChildLayout,
    updatedAt: new Date().toISOString(),
  };
}

export function upsertNode(
  session: ThoughtSession,
  node: ThoughtNode
): ThoughtSession {
  const exists = session.nodes.some((n) => n.id === node.id);
  const nodes = exists
    ? session.nodes.map((n) => (n.id === node.id ? node : n))
    : [...session.nodes, node];
  return { ...session, nodes, updatedAt: new Date().toISOString() };
}
