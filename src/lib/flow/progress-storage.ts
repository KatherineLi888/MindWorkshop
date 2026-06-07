import { loadLocal, saveLocal } from "@/lib/local-store";
import {
  flowEntityKey,
  type FlowBlockMeta,
  type FlowStage,
} from "./types";

const KEY = "workshop-flow-block-meta";

function loadAll(): FlowBlockMeta[] {
  return loadLocal<FlowBlockMeta[]>(KEY, []);
}

function saveAll(items: FlowBlockMeta[]) {
  saveLocal(KEY, items);
}

export function getFlowBlockMeta(
  entityType: string,
  entityId: string
): FlowBlockMeta | undefined {
  const key = flowEntityKey(entityType, entityId);
  return loadAll().find((m) => m.entityKey === key);
}

export function setFlowBlockReason(input: {
  entityType: string;
  entityId: string;
  stage: FlowStage;
  blockReason: string | null;
  blockPending: boolean;
}): FlowBlockMeta {
  const key = flowEntityKey(input.entityType, input.entityId);
  const now = new Date().toISOString();
  const row: FlowBlockMeta = {
    entityKey: key,
    entityType: input.entityType,
    entityId: input.entityId,
    stage: input.stage,
    blockReason: input.blockPending ? null : input.blockReason?.trim() || null,
    blockPending: input.blockPending,
    updatedAt: now,
  };
  const all = loadAll();
  const idx = all.findIndex((m) => m.entityKey === key);
  const next = idx >= 0 ? all.map((m, i) => (i === idx ? row : m)) : [row, ...all];
  saveAll(next);
  return row;
}

export function loadFlowBlockMetaMap(): Map<string, FlowBlockMeta> {
  return new Map(loadAll().map((m) => [m.entityKey, m]));
}
