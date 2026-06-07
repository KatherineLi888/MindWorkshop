import { getModelById, loadModelLibrary } from "./model-library-store";
import { emptySlotValues, getSlotsFromConfig } from "./helpers";
import type { ModelConfig, ModelSlotValues, StoredModel } from "./types";

/** 旧画布 frameworkId → 模型库 id */
export const FRAMEWORK_TO_LIBRARY: Record<string, string> = {
  eisenhower: "eisenhower",
  swot: "swot",
  "stages-4": "stages-4",
  "stages-5": "stages-4",
  pdca: "pdca",
  "priority-3x3": "5w1h",
  "pros-cons": "pros-cons",
  "5w1h": "5w1h",
  "blank-2x2": "swot",
};

export function getLibraryModels(): StoredModel[] {
  return loadModelLibrary();
}

export function resolveLibraryModel(modelId: string): StoredModel | undefined {
  return getModelById(modelId) ?? getModelById(FRAMEWORK_TO_LIBRARY[modelId] ?? "");
}

export function createModelValues(
  config: ModelConfig,
  seed?: ModelSlotValues
): ModelSlotValues {
  const base = emptySlotValues(config);
  if (!seed) return base;
  const slots = getSlotsFromConfig(config);
  const out = { ...base };
  slots.forEach((s, i) => {
    if (seed[s.id] !== undefined) out[s.id] = seed[s.id];
    else {
      const legacyKey = Object.keys(seed)[i];
      if (legacyKey && seed[legacyKey]) out[s.id] = seed[legacyKey];
    }
  });
  return out;
}

export function migrateLegacyCells(
  cells: Array<{ id: string; content: string }>,
  config: ModelConfig
): ModelSlotValues {
  const slots = getSlotsFromConfig(config);
  const values = emptySlotValues(config);
  cells.forEach((cell, i) => {
    const slot = slots.find((s) => s.id === cell.id) ?? slots[i];
    if (slot) values[slot.id] = cell.content;
  });
  return values;
}
