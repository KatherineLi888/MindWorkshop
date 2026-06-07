import type { FlowStage } from "@/lib/flow/types";
import { birthSeed, ensureSeedForEntity } from "./lifecycle";
import { buildSeedTitle, isUnnamedSeedTitle } from "./naming";
import { getSeedIdForEntity, loadSeeds, upsertSeed } from "./storage";
import type { IdeaSeed, SeedStage } from "./types";

const ENTITY_DEFAULT_STAGE: Record<string, SeedStage> = {
  triage: "home",
  inbox_manual: "inbox",
  thinking_session: "thinking",
  decision: "decisions",
  goal: "goals",
  graph_node: "track",
  model_application: "model",
  thinking_model: "model",
  theory: "theory",
  canvas_document: "canvas",
  review_record: "review",
};

export function flowStageToSeedStage(
  stage: FlowStage,
  entityType?: string
): SeedStage {
  if (entityType === "inbox_manual") return "inbox";
  return stage as SeedStage;
}

/** 确保实体已绑定种子；无则自动创建（默认「未命名种子」） */
export function ensureEntityHasSeed(input: {
  entityType: string;
  entityId: string;
  title?: string;
  stage?: SeedStage;
  parentEntityType?: string;
  parentEntityId?: string;
}): IdeaSeed {
  const existingId = getSeedIdForEntity(input.entityType, input.entityId);
  const stage =
    input.stage ??
    ENTITY_DEFAULT_STAGE[input.entityType] ??
    ("home" as SeedStage);

  if (existingId) {
    const seed = loadSeeds().find((s) => s.id === existingId);
    if (
      seed &&
      input.title?.trim() &&
      isUnnamedSeedTitle(seed.title)
    ) {
      const first = seed.events[0];
      return upsertSeed({
        ...seed,
        title: buildSeedTitle({
          stage: first?.stage ?? stage,
          entityType: first?.entityType ?? input.entityType,
          detail: input.title,
        }),
      });
    }
    return seed!;
  }

  if (input.parentEntityType && input.parentEntityId) {
    return ensureSeedForEntity({
      title: input.title,
      entityType: input.entityType,
      entityId: input.entityId,
      stage,
      parentEntityType: input.parentEntityType,
      parentEntityId: input.parentEntityId,
    });
  }

  return birthSeed({
    title: input.title,
    entityType: input.entityType,
    entityId: input.entityId,
    stage,
  });
}

export function getSeedForEntity(
  entityType: string,
  entityId: string
): IdeaSeed | null {
  const seedId = getSeedIdForEntity(entityType, entityId);
  if (!seedId) return null;
  return loadSeeds().find((s) => s.id === seedId) ?? null;
}
