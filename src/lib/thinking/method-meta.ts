import { loadLocal, saveLocal } from "@/lib/local-store";

const STORAGE_KEY = "workshop-thinking-method-meta";

export type UsageAnnotation = {
  nodeId: string;
  sessionId: string;
  starred?: boolean;
  pinned?: boolean;
  note?: string;
};

export type MethodInspiration = {
  id: string;
  methodId: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
};

export type MethodMetaStore = {
  usageAnnotations: UsageAnnotation[];
  inspirations: MethodInspiration[];
};

const EMPTY: MethodMetaStore = { usageAnnotations: [], inspirations: [] };

export function loadMethodMeta(): MethodMetaStore {
  return loadLocal<MethodMetaStore>(STORAGE_KEY, EMPTY);
}

export function saveMethodMeta(store: MethodMetaStore) {
  saveLocal(STORAGE_KEY, store);
}

function usageKey(sessionId: string, nodeId: string) {
  return `${sessionId}:${nodeId}`;
}

export function getUsageAnnotation(
  sessionId: string,
  nodeId: string,
  store = loadMethodMeta()
): UsageAnnotation | undefined {
  return store.usageAnnotations.find(
    (a) => a.sessionId === sessionId && a.nodeId === nodeId
  );
}

export function upsertUsageAnnotation(
  patch: UsageAnnotation,
  store = loadMethodMeta()
): MethodMetaStore {
  const idx = store.usageAnnotations.findIndex(
    (a) => a.sessionId === patch.sessionId && a.nodeId === patch.nodeId
  );
  const next = { ...store, usageAnnotations: [...store.usageAnnotations] };
  if (idx >= 0) next.usageAnnotations[idx] = { ...next.usageAnnotations[idx], ...patch };
  else next.usageAnnotations.push(patch);
  saveMethodMeta(next);
  return next;
}

export function toggleUsageFlag(
  sessionId: string,
  nodeId: string,
  flag: "starred" | "pinned",
  store = loadMethodMeta()
): MethodMetaStore {
  const existing = getUsageAnnotation(sessionId, nodeId, store);
  const nextVal = !(existing?.[flag] ?? false);
  return upsertUsageAnnotation(
    {
      sessionId,
      nodeId,
      starred: flag === "starred" ? nextVal : existing?.starred,
      pinned: flag === "pinned" ? nextVal : existing?.pinned,
      note: existing?.note,
    },
    store
  );
}

export function addInspiration(
  methodId: string,
  content: string,
  store = loadMethodMeta()
): MethodMetaStore {
  const next: MethodMetaStore = {
    ...store,
    inspirations: [
      {
        id: crypto.randomUUID(),
        methodId,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      },
      ...store.inspirations,
    ],
  };
  saveMethodMeta(next);
  return next;
}

export function toggleInspirationPin(
  id: string,
  store = loadMethodMeta()
): MethodMetaStore {
  const next = {
    ...store,
    inspirations: store.inspirations.map((i) =>
      i.id === id ? { ...i, pinned: !i.pinned } : i
    ),
  };
  saveMethodMeta(next);
  return next;
}

export function removeInspiration(
  id: string,
  store = loadMethodMeta()
): MethodMetaStore {
  const next = {
    ...store,
    inspirations: store.inspirations.filter((i) => i.id !== id),
  };
  saveMethodMeta(next);
  return next;
}

export function getInspirationsForMethod(
  methodId: string,
  store = loadMethodMeta()
): MethodInspiration[] {
  return store.inspirations
    .filter((i) => i.methodId === methodId)
    .sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinB !== pinA) return pinB - pinA;
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export function sortUsagesWithMeta<T extends { sessionId: string; nodeId: string }>(
  usages: T[],
  store = loadMethodMeta()
): T[] {
  return [...usages].sort((a, b) => {
    const aa = getUsageAnnotation(a.sessionId, a.nodeId, store);
    const ab = getUsageAnnotation(b.sessionId, b.nodeId, store);
    const pinA = aa?.pinned ? 1 : 0;
    const pinB = ab?.pinned ? 1 : 0;
    if (pinB !== pinA) return pinB - pinA;
    const starA = aa?.starred ? 1 : 0;
    const starB = ab?.starred ? 1 : 0;
    if (starB !== starA) return starB - starA;
    return 0;
  });
}
