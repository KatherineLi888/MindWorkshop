import { loadLocal, saveLocal } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { createStoredTheory } from "./helpers";
import type { StoredTheory } from "./types";

const STORAGE_KEY = "workshop-theory-library";

export function loadTheories(): StoredTheory[] {
  return loadLocal<StoredTheory[]>(STORAGE_KEY, []);
}

export function saveTheories(theories: StoredTheory[]) {
  saveLocal(STORAGE_KEY, theories);
}

export function getTheoryById(
  id: string,
  stored = loadTheories()
): StoredTheory | undefined {
  return stored.find((t) => t.id === id);
}

export function upsertTheory(
  theory: StoredTheory,
  stored = loadTheories()
): StoredTheory[] {
  const idx = stored.findIndex((t) => t.id === theory.id);
  const next = [...stored];
  const row = { ...theory, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    next[idx] = row;
  } else {
    next.unshift(row);
    ensureEntityHasSeed({
      entityType: "theory",
      entityId: row.id,
      title: row.title || row.statement,
      stage: "theory",
    });
  }
  saveTheories(next);
  return next;
}

export function removeTheory(
  id: string,
  stored = loadTheories()
): StoredTheory[] {
  const next = stored.filter((t) => t.id !== id);
  saveTheories(next);
  return next;
}

export function addTheory(
  partial: Parameters<typeof createStoredTheory>[0]
): StoredTheory {
  const created = createStoredTheory(partial);
  upsertTheory(created);
  return created;
}
