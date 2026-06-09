import { loadLocal, saveLocal } from "@/lib/local-store";

export const DRAFT_KEYS = {
  goalShell: "workshop-draft-goal-shell",
  goalSmart: "workshop-draft-goal-smart",
  reviewNew: "workshop-draft-review-new",
  aiChat: "workshop-draft-ai-chat",
} as const;

export function saveDraft<T>(key: string, data: T): void {
  saveLocal(key, { data, updatedAt: new Date().toISOString() });
}

export function loadDraft<T>(key: string): T | null {
  const raw = loadLocal<{ data?: T } | null>(key, null);
  return raw?.data ?? null;
}

export function clearDraft(key: string): void {
  saveLocal(key, null);
}
