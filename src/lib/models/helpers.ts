import type {
  FunnelConfig,
  FunnelLevel,
  GridCell,
  GridConfig,
  ModelConfig,
  ModelKind,
  ModelSlotValues,
  QuadrantConfig,
  QuadrantRegion,
  StageConfig,
  StageItem,
  StoredModel,
} from "./types";

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function makeRegions(
  cols: number,
  rows: number,
  labels?: string[]
): QuadrantRegion[] {
  const count = cols * rows;
  return Array.from({ length: count }, (_, i) => ({
    id: uid("region"),
    label: labels?.[i] ?? `象限 ${i + 1}`,
    definition: "",
    traits: "",
  }));
}

export function makeStages(count: number, names?: string[]): StageItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("stage"),
    name: names?.[i] ?? `阶段 ${i + 1}`,
    description: "",
  }));
}

export function makeFunnelLevels(
  count: number,
  names?: string[]
): FunnelLevel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("level"),
    name: names?.[i] ?? `层级 ${i + 1}`,
    description: "",
  }));
}

export function makeGridCells(
  cols: number,
  rows: number,
  titles?: string[]
): GridCell[] {
  const count = cols * rows;
  return Array.from({ length: count }, (_, i) => ({
    id: uid("cell"),
    title: titles?.[i] ?? `区域 ${i + 1}`,
    definition: "",
  }));
}

export function createQuadrantConfig(
  cols = 2,
  rows = 2,
  opts?: Partial<{
    xAxis: { low: string; high: string };
    yAxis: { low: string; high: string };
    labels: string[];
  }>
): QuadrantConfig {
  return {
    cols,
    rows,
    xAxis: opts?.xAxis ?? { low: "低", high: "高" },
    yAxis: opts?.yAxis ?? { low: "低", high: "高" },
    regions: makeRegions(cols, rows, opts?.labels),
  };
}

export function createStageConfig(
  count = 3,
  names?: string[]
): StageConfig {
  return { stages: makeStages(count, names) };
}

export function createFunnelConfig(
  count = 4,
  names?: string[]
): FunnelConfig {
  return { levels: makeFunnelLevels(count, names) };
}

export function createGridConfig(
  cols: number,
  rows: number,
  titles?: string[]
): GridConfig {
  return { cols, rows, cells: makeGridCells(cols, rows, titles) };
}

export function createStoredModel(
  partial: Pick<StoredModel, "name" | "kind"> &
    Partial<
      Pick<
        StoredModel,
        | "description"
        | "applicableScenarios"
        | "inspirations"
        | "usageNotes"
        | "config"
        | "tags"
        | "source"
      >
    >
): StoredModel {
  const now = new Date().toISOString();
  const config = partial.config ?? defaultConfigForKind(partial.kind);
  return {
    id: `model-${crypto.randomUUID()}`,
    name: partial.name,
    description: partial.description ?? "",
    kind: partial.kind,
    applicableScenarios: partial.applicableScenarios ?? "",
    inspirations: partial.inspirations ?? "",
    usageNotes: partial.usageNotes ?? "",
    config,
    tags: partial.tags ?? [],
    source: partial.source ?? "",
    createdAt: now,
    updatedAt: now,
  };
}

export function freshIdsForConfig<T extends { config: ModelConfig }>(model: T): T {
  const copy = JSON.parse(JSON.stringify(model)) as T;
  const c = copy.config;
  if (isQuadrantConfig(c)) {
    c.regions = c.regions.map((r) => ({ ...r, id: uid("region") }));
  } else if (isStageConfig(c)) {
    c.stages = c.stages.map((s) => ({ ...s, id: uid("stage") }));
  } else if (isFunnelConfig(c)) {
    c.levels = c.levels.map((l) => ({ ...l, id: uid("level") }));
  } else if (isGridConfig(c)) {
    c.cells = c.cells.map((cell) => ({ ...cell, id: uid("cell") }));
  }
  return copy;
}

export function defaultConfigForKind(kind: ModelKind): ModelConfig {
  switch (kind) {
    case "quadrant":
      return createQuadrantConfig();
    case "stage":
      return createStageConfig(3);
    case "funnel":
      return createFunnelConfig(4);
    case "grid":
      return createGridConfig(2, 2);
  }
}

export function isQuadrantConfig(c: ModelConfig): c is QuadrantConfig {
  return "regions" in c && "xAxis" in c;
}

export function isStageConfig(c: ModelConfig): c is StageConfig {
  return "stages" in c;
}

export function isFunnelConfig(c: ModelConfig): c is FunnelConfig {
  return "levels" in c;
}

export function isGridConfig(c: ModelConfig): c is GridConfig {
  return "cells" in c && "cols" in c && !("xAxis" in c);
}

export type ModelSlot = {
  id: string;
  label: string;
  hint?: string;
};

export function getSlotsFromConfig(config: ModelConfig): ModelSlot[] {
  if (isQuadrantConfig(config)) {
    return config.regions.map((r) => ({
      id: r.id,
      label: r.label,
      hint: [r.definition, r.traits].filter(Boolean).join(" · "),
    }));
  }
  if (isStageConfig(config)) {
    return config.stages.map((s) => ({
      id: s.id,
      label: s.name,
      hint: s.description,
    }));
  }
  if (isFunnelConfig(config)) {
    return config.levels.map((l) => ({
      id: l.id,
      label: l.name,
      hint: l.description,
    }));
  }
  if (isGridConfig(config)) {
    return config.cells.map((c) => ({
      id: c.id,
      label: c.title,
      hint: c.definition,
    }));
  }
  return [];
}

export function emptySlotValues(config: ModelConfig): ModelSlotValues {
  return Object.fromEntries(getSlotsFromConfig(config).map((s) => [s.id, ""]));
}

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,，、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function formatTags(tags: string[]): string {
  return tags.join("、");
}
