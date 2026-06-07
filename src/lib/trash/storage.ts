import { loadLocal, saveLocal } from "@/lib/local-store";
import type { ThoughtSession } from "@/lib/thinking/types";

const KEY = "workshop-recently-deleted";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export type TrashItem = {
  id: string;
  kind: "thinking_session";
  title: string;
  deletedAt: string;
  expiresAt: string;
  data: ThoughtSession;
};

function loadTrash(): TrashItem[] {
  return loadLocal<TrashItem[]>(KEY, []);
}

function saveTrash(items: TrashItem[]) {
  saveLocal(KEY, items);
}

function purgeExpired(items: TrashItem[]): TrashItem[] {
  const now = Date.now();
  return items.filter((i) => new Date(i.expiresAt).getTime() > now);
}

export function loadRecentlyDeleted(): TrashItem[] {
  const purged = purgeExpired(loadTrash());
  if (purged.length !== loadTrash().length) saveTrash(purged);
  return purged.sort(
    (a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
  );
}

export function moveThinkingSessionToTrash(session: ThoughtSession): void {
  const now = new Date();
  const item: TrashItem = {
    id: session.id,
    kind: "thinking_session",
    title: session.title,
    deletedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + RETENTION_MS).toISOString(),
    data: session,
  };
  const all = purgeExpired(loadTrash()).filter((i) => i.id !== session.id);
  saveTrash([item, ...all]);
}

export function restoreFromTrash(id: string): ThoughtSession | null {
  const all = loadTrash();
  const item = all.find((i) => i.id === id);
  if (!item) return null;
  saveTrash(all.filter((i) => i.id !== id));
  return item.data;
}

export function permanentlyDeleteFromTrash(id: string): void {
  saveTrash(loadTrash().filter((i) => i.id !== id));
}

export function getTrashRetentionDays(): number {
  return 7;
}
