import { loadLocal, saveLocal } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import type {
  ModelApplication,
  ModelConfig,
  ModelKind,
  ModelSlotValues,
} from "./types";

const STORAGE_KEY = "workshop-model-applications";

type LegacyApp = ModelApplication & {
  refId?: string;
  refType?: "preset" | "user";
};

function migrateApplications(raw: LegacyApp[]): ModelApplication[] {
  return raw.map((a) => ({
    id: a.id,
    modelId: a.modelId ?? a.refId ?? "",
    modelName: a.modelName,
    kind: a.kind,
    scenario: a.scenario,
    note: a.note,
    values: a.values,
    configSnapshot: a.configSnapshot,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));
}

export function loadApplications(): ModelApplication[] {
  const raw = loadLocal<LegacyApp[]>(STORAGE_KEY, []);
  return migrateApplications(raw);
}

export function saveApplications(apps: ModelApplication[]) {
  saveLocal(STORAGE_KEY, apps);
}

export function createApplication(input: {
  modelId: string;
  modelName: string;
  kind: ModelKind;
  scenario: string;
  note: string;
  values: ModelSlotValues;
  configSnapshot: ModelConfig;
}): ModelApplication {
  const now = new Date().toISOString();
  return {
    id: `app-${crypto.randomUUID()}`,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertApplication(app: ModelApplication): ModelApplication[] {
  const stored = loadApplications();
  const idx = stored.findIndex((a) => a.id === app.id);
  const next = [...stored];
  const row = { ...app, updatedAt: new Date().toISOString() };
  if (idx >= 0) next[idx] = row;
  else {
    next.unshift(row);
    ensureEntityHasSeed({
      entityType: "model_application",
      entityId: row.id,
      title: row.scenario.trim() || row.modelName,
      stage: "model",
    });
  }
  saveApplications(next);
  return next;
}

export function removeApplication(id: string): ModelApplication[] {
  const next = loadApplications().filter((a) => a.id !== id);
  saveApplications(next);
  return next;
}

export function getApplicationsForModel(modelId: string): ModelApplication[] {
  return loadApplications().filter((a) => a.modelId === modelId);
}

export function countApplicationsForModel(modelId: string): number {
  return getApplicationsForModel(modelId).length;
}
