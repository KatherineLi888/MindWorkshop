import { loadLocal, saveLocal } from "@/lib/local-store";
import {
  ensureEntityHasSeed,
  flowStageToSeedStage,
} from "@/lib/seeds/ensure";
import { propagateSeedOnJump } from "@/lib/seeds/lifecycle";
import { flowEntityKey, type FlowStage } from "./types";

const JUMPS_KEY = "workshop-flow-jumps";
const ENTRIES_KEY = "workshop-flow-entries";

export type FlowJump = {
  id: string;
  fromEntityType: string;
  fromEntityId: string;
  fromStage: FlowStage;
  toEntityType: string;
  toEntityId: string;
  toStage: FlowStage;
  createdAt: string;
};

export type FlowEntry = {
  entityKey: string;
  entityType: string;
  entityId: string;
  entryStage: FlowStage;
  createdAt: string;
};

export function loadFlowJumps(): FlowJump[] {
  return loadLocal<FlowJump[]>(JUMPS_KEY, []);
}

export function loadFlowEntries(): FlowEntry[] {
  return loadLocal<FlowEntry[]>(ENTRIES_KEY, []);
}

function saveFlowJumps(jumps: FlowJump[]) {
  saveLocal(JUMPS_KEY, jumps);
}

function saveFlowEntries(entries: FlowEntry[]) {
  saveLocal(ENTRIES_KEY, entries);
}

export function registerFlowEntry(
  entityType: string,
  entityId: string,
  entryStage: FlowStage
): FlowEntry {
  const key = flowEntityKey(entityType, entityId);
  const existing = loadFlowEntries().find((e) => e.entityKey === key);
  if (existing) return existing;
  const row: FlowEntry = {
    entityKey: key,
    entityType,
    entityId,
    entryStage,
    createdAt: new Date().toISOString(),
  };
  saveFlowEntries([row, ...loadFlowEntries()]);
  ensureEntityHasSeed({
    entityType,
    entityId,
    stage: flowStageToSeedStage(entryStage, entityType),
  });
  return row;
}

export function recordFlowJump(input: {
  fromEntityType: string;
  fromEntityId: string;
  fromStage: FlowStage;
  toEntityType: string;
  toEntityId: string;
  toStage: FlowStage;
}): FlowJump {
  const jump: FlowJump = {
    id: crypto.randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  saveFlowJumps([jump, ...loadFlowJumps()]);
  propagateSeedOnJump({
    fromEntityType: input.fromEntityType,
    fromEntityId: input.fromEntityId,
    fromStage: input.fromStage,
    toEntityType: input.toEntityType,
    toEntityId: input.toEntityId,
    toStage: input.toStage,
  });
  registerFlowEntry(input.toEntityType, input.toEntityId, input.toStage);
  return jump;
}

export function countStrictJump(toStage: FlowStage): number {
  const jumps = loadFlowJumps();
  const prev: Partial<Record<FlowStage, FlowStage>> = {
    thinking: "inbox",
    decisions: "thinking",
    goals: "decisions",
    track: "goals",
  };
  const fromStage = prev[toStage];
  if (!fromStage) return 0;
  const ids = new Set<string>();
  for (const j of jumps) {
    if (j.fromStage === fromStage && j.toStage === toStage) {
      ids.add(j.toEntityId);
    }
  }
  return ids.size;
}
