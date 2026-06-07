import { loadLocal, saveLocal } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import type { ReviewRecord } from "./types";

const KEY = "workshop-review-records";

export function loadReviewRecords(): ReviewRecord[] {
  return loadLocal<ReviewRecord[]>(KEY, []).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveReviewRecord(record: ReviewRecord): ReviewRecord[] {
  const all = loadReviewRecords();
  const idx = all.findIndex((r) => r.id === record.id);
  const next =
    idx >= 0
      ? all.map((r) => (r.id === record.id ? record : r))
      : [record, ...all];
  saveLocal(KEY, next);
  return next;
}

export function createReviewRecord(
  input: Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">
): ReviewRecord {
  const now = new Date().toISOString();
  const record: ReviewRecord = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  saveReviewRecord(record);
  ensureEntityHasSeed({
    entityType: "review_record",
    entityId: record.id,
    title: record.title,
    stage: "review",
  });
  return record;
}

export function updateReviewRecord(
  id: string,
  patch: Partial<ReviewRecord>
): ReviewRecord | null {
  const all = loadReviewRecords();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: ReviewRecord = {
    ...all[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveReviewRecord(next);
  return next;
}
