import { loadLocal, saveLocal } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import type { TriageRecord } from "./types";

const KEY = "workshop-triage-records";

export function loadTriageRecords(): TriageRecord[] {
  return loadLocal<TriageRecord[]>(KEY, []).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getTriageRecord(id: string): TriageRecord | undefined {
  return loadTriageRecords().find((r) => r.id === id);
}

export function saveTriageRecord(record: TriageRecord): TriageRecord[] {
  const all = loadTriageRecords();
  const idx = all.findIndex((r) => r.id === record.id);
  const next =
    idx >= 0
      ? all.map((r) => (r.id === record.id ? record : r))
      : [record, ...all];
  saveLocal(KEY, next);
  return next;
}

export type CreateTriageRecordInput = Omit<TriageRecord, "id" | "createdAt">;

export function createTriageRecord(
  input: CreateTriageRecordInput
): TriageRecord {
  const record: TriageRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveTriageRecord(record);
  ensureEntityHasSeed({
    entityType: "triage",
    entityId: record.id,
    title: record.summary || record.rawText,
    stage: "home",
  });
  return record;
}

export function patchTriageTarget(
  id: string,
  targetEntityType: string,
  targetEntityId: string
): void {
  const existing = getTriageRecord(id);
  if (!existing) return;
  saveTriageRecord({
    ...existing,
    targetEntityType,
    targetEntityId,
  });
  const stageMap: Record<string, "thinking" | "decisions" | "goals" | "track"> =
    {
      thinking_session: "thinking",
      decision: "decisions",
      goal: "goals",
      graph_node: "track",
    };
  const stage = stageMap[targetEntityType];
  if (stage) {
    ensureEntityHasSeed({
      entityType: targetEntityType,
      entityId: targetEntityId,
      title: existing.summary || existing.rawText,
      stage,
      parentEntityType: "triage",
      parentEntityId: id,
    });
  }
}
