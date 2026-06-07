import { loadLocal, saveLocal } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { DEFAULT_BUILTIN_MODELS } from "./defaults";
import { createStoredModel, freshIdsForConfig } from "./helpers";
import type { StoredModel } from "./types";

const STORAGE_KEY = "workshop-model-library";
const LEGACY_USER_KEY = "workshop-user-models";

type LegacyRow = StoredModel & { derivedFromPresetId?: string };

function migrateLegacyUserModels(): StoredModel[] {
  const legacy = loadLocal<LegacyRow[] | null>(LEGACY_USER_KEY, null);
  if (!legacy?.length) return [];
  return legacy.map((m) => ({
    ...m,
    builtin: false,
    tags: m.tags ?? [],
    source: m.source ?? "",
  }));
}

function ensureBuiltins(saved: StoredModel[]): StoredModel[] {
  const next = [...saved];
  for (const d of DEFAULT_BUILTIN_MODELS) {
    if (!next.some((m) => m.id === d.id)) {
      next.push({ ...d });
    }
  }
  return next;
}

export function loadModelLibrary(): StoredModel[] {
  const saved = loadLocal<StoredModel[] | null>(STORAGE_KEY, null);
  if (saved?.length) {
    return ensureBuiltins(saved);
  }

  const migrated = migrateLegacyUserModels();
  const initial = [...DEFAULT_BUILTIN_MODELS.map((m) => ({ ...m })), ...migrated];
  saveModelLibrary(initial);
  return initial;
}

export function saveModelLibrary(models: StoredModel[]) {
  saveLocal(STORAGE_KEY, models);
}

export function getModelById(
  id: string,
  stored = loadModelLibrary()
): StoredModel | undefined {
  return stored.find((m) => m.id === id);
}

export function upsertModel(
  model: StoredModel,
  stored = loadModelLibrary()
): StoredModel[] {
  const idx = stored.findIndex((m) => m.id === model.id);
  const next = [...stored];
  const row = { ...model, updatedAt: new Date().toISOString() };
  if (idx >= 0) next[idx] = row;
  else {
    next.unshift(row);
    if (!row.builtin) {
      ensureEntityHasSeed({
        entityType: "thinking_model",
        entityId: row.id,
        title: row.name,
        stage: "model",
      });
    }
  }
  saveModelLibrary(next);
  return next;
}

export function removeModel(
  id: string,
  stored = loadModelLibrary()
): StoredModel[] {
  const target = stored.find((m) => m.id === id);
  if (target?.builtin) return stored;
  const next = stored.filter((m) => m.id !== id);
  saveModelLibrary(next);
  return next;
}

export function duplicateModel(
  source: StoredModel,
  newName: string
): StoredModel {
  const copy = freshIdsForConfig({
    ...source,
    id: `model-${crypto.randomUUID()}`,
    name: newName,
    builtin: false,
  });
  return createStoredModel({
    name: copy.name,
    kind: copy.kind,
    description: copy.description,
    applicableScenarios: copy.applicableScenarios,
    inspirations: copy.inspirations,
    usageNotes: copy.usageNotes,
    config: copy.config,
    tags: [...source.tags],
    source: source.source,
  });
}

export function resetModelLibrary(): StoredModel[] {
  const customs = loadModelLibrary().filter((m) => !m.builtin);
  const next = [...DEFAULT_BUILTIN_MODELS.map((m) => ({ ...m })), ...customs];
  saveModelLibrary(next);
  return next;
}
