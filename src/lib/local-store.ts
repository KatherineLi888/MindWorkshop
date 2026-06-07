/** 未启用登录时，各模块数据存 localStorage */

export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveLocal<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const LOCAL_KEYS = {
  decisions: "workshop-local-decisions",
  goals: "workshop-local-goals",
  graphNodes: "workshop-local-graph-nodes",
  graphEdges: "workshop-local-graph-edges",
  models: "workshop-local-models",
  inbox: "workshop-local-inbox",
  entityLinks: "workshop-entity-links",
  settings: "workshop-local-settings",
  thinking: "workshop-local-thinking",
  goalActivities: "workshop-goal-activities",
  goalChallenges: "workshop-goal-challenges",
  theories: "workshop-theory-library",
} as const;
