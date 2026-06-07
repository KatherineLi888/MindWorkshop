import type { FlowStage } from "@/lib/flow/types";
import { buildEventSummary } from "./event-summary";
import { seedStageLabel } from "./labels";
import { buildSeedTitle, isUnnamedSeedTitle } from "./naming";
import {
  appendSeedEvent,
  bindEntityToSeed,
  getSeedIdForEntity,
  loadSeeds,
  upsertSeed,
} from "./storage";
import type { IdeaSeed, SeedEventAction, SeedLifeEvent, SeedStage } from "./types";

function withSummary(
  event: Omit<SeedLifeEvent, "id" | "createdAt" | "summary">,
  prev?: SeedLifeEvent
): Omit<SeedLifeEvent, "id" | "createdAt"> {
  return {
    ...event,
    summary: buildEventSummary(
      { ...event, id: "", createdAt: "" },
      prev
    ),
  };
}

export function birthSeed(input: {
  title?: string;
  entityType: string;
  entityId: string;
  stage: SeedStage;
  source?: "home" | "manual" | "inbox" | "model" | "canvas";
}): IdeaSeed {
  const now = new Date().toISOString();
  const bornEvent = withSummary({
    stage: input.stage,
    entityType: input.entityType,
    entityId: input.entityId,
    label: seedStageLabel(input.stage),
    action: "born",
  });
  const seed: IdeaSeed = {
    id: crypto.randomUUID(),
    title: buildSeedTitle({
      stage: input.stage,
      entityType: input.entityType,
      detail: input.title,
    }),
    status: "active",
    events: [
      {
        ...bornEvent,
        id: crypto.randomUUID(),
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  upsertSeed(seed);
  bindEntityToSeed(input.entityType, input.entityId, seed.id);
  return seed;
}

export function ensureSeedForEntity(input: {
  title: string;
  entityType: string;
  entityId: string;
  stage: SeedStage;
  parentEntityType?: string;
  parentEntityId?: string;
}): IdeaSeed {
  const existing = getSeedIdForEntity(input.entityType, input.entityId);
  if (existing) {
    const seed = loadSeeds().find((s) => s.id === existing);
    if (seed) return seed;
  }

  if (input.parentEntityType && input.parentEntityId) {
    const parentSeed = getSeedIdForEntity(
      input.parentEntityType,
      input.parentEntityId
    );
    if (parentSeed) {
      bindEntityToSeed(input.entityType, input.entityId, parentSeed);
      const parent = loadSeeds().find((s) => s.id === parentSeed)!;
      const prev = parent.events[parent.events.length - 1];
      appendSeedEvent(
        parentSeed,
        withSummary(
          {
            stage: input.stage,
            entityType: input.entityType,
            entityId: input.entityId,
            label: seedStageLabel(input.stage),
            action: "entered",
          },
          prev
        )
      );
      return loadSeeds().find((s) => s.id === parentSeed)!;
    }
  }

  return birthSeed({
    title: input.title,
    entityType: input.entityType,
    entityId: input.entityId,
    stage: input.stage,
  });
}

function maybeRenameUnnamed(seedId: string, detail?: string) {
  if (!detail?.trim()) return;
  const seed = loadSeeds().find((s) => s.id === seedId);
  if (!seed || !isUnnamedSeedTitle(seed.title)) return;
  const first = seed.events[0];
  if (!first) return;
  upsertSeed({
    ...seed,
    title: buildSeedTitle({
      stage: first.stage,
      entityType: first.entityType,
      detail,
    }),
  });
}

export function propagateSeedOnJump(input: {
  fromEntityType: string;
  fromEntityId: string;
  fromStage: FlowStage;
  toEntityType: string;
  toEntityId: string;
  toStage: FlowStage;
  title?: string;
}) {
  const parentSeed = getSeedIdForEntity(
    input.fromEntityType,
    input.fromEntityId
  );
  const action: SeedEventAction =
    input.fromStage === "track" ? "loopback" : "jumped";

  if (parentSeed) {
    bindEntityToSeed(input.toEntityType, input.toEntityId, parentSeed);
    const parent = loadSeeds().find((s) => s.id === parentSeed)!;
    const prev = parent.events[parent.events.length - 1];
    appendSeedEvent(
      parentSeed,
      withSummary(
        {
          stage: input.toStage,
          entityType: input.toEntityType,
          entityId: input.toEntityId,
          label: seedStageLabel(input.toStage),
          action,
        },
        prev
      )
    );
    maybeRenameUnnamed(parentSeed, input.title);
    return;
  }

  ensureSeedForEntity({
    title: input.title,
    entityType: input.toEntityType,
    entityId: input.toEntityId,
    stage: input.toStage,
    parentEntityType: input.fromEntityType,
    parentEntityId: input.fromEntityId,
  });
}

export function endSeedForEntity(
  entityType: string,
  entityId: string,
  reason: string
) {
  const seedId = getSeedIdForEntity(entityType, entityId);
  if (!seedId) return;
  const seed = loadSeeds().find((s) => s.id === seedId);
  if (!seed || seed.status === "ended") return;
  const now = new Date().toISOString();
  const prev = seed.events[seed.events.length - 1];
  const ended = withSummary(
    {
      stage: prev?.stage ?? "decisions",
      entityType,
      entityId,
      label: "归档",
      action: "ended",
    },
    prev
  );
  upsertSeed({
    ...seed,
    status: "ended",
    endReason: reason,
    events: [
      ...seed.events,
      { ...ended, id: crypto.randomUUID(), createdAt: now },
    ],
    updatedAt: now,
  });
}
