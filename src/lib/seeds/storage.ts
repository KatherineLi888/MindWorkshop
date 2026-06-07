import { loadLocal, saveLocal } from "@/lib/local-store";
import { flowEntityKey } from "@/lib/flow/types";
import { saveSeedsWithCloudSync, syncSeedEntityMapToCloud } from "./cloud-sync";
import { partitionSeeds, spotlightGrowing } from "./classify";
import type { IdeaSeed, SeedLifeEvent, SeedSummary } from "./types";

const SEEDS_KEY = "workshop-idea-seeds";
const MAP_KEY = "workshop-seed-entity-map";

export function loadSeeds(): IdeaSeed[] {
  return loadLocal<IdeaSeed[]>(SEEDS_KEY, []).sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

function saveSeeds(seeds: IdeaSeed[]) {
  saveSeedsWithCloudSync(seeds);
}

export function loadSeedEntityMap(): Record<string, string> {
  return loadLocal<Record<string, string>>(MAP_KEY, {});
}

function saveSeedEntityMap(map: Record<string, string>) {
  saveLocal(MAP_KEY, map);
}

export function getSeedIdForEntity(
  entityType: string,
  entityId: string
): string | null {
  const map = loadSeedEntityMap();
  return map[flowEntityKey(entityType, entityId)] ?? null;
}

export function bindEntityToSeed(
  entityType: string,
  entityId: string,
  seedId: string
) {
  const map = loadSeedEntityMap();
  map[flowEntityKey(entityType, entityId)] = seedId;
  saveLocal(MAP_KEY, map);
  void syncSeedEntityMapToCloud();
}

export function upsertSeed(seed: IdeaSeed): IdeaSeed {
  const all = loadSeeds();
  const idx = all.findIndex((s) => s.id === seed.id);
  const next =
    idx >= 0
      ? all.map((s) => (s.id === seed.id ? seed : s))
      : [seed, ...all];
  saveSeeds(next);
  return seed;
}

export function appendSeedEvent(
  seedId: string,
  event: Omit<SeedLifeEvent, "id" | "createdAt">
): IdeaSeed | null {
  const all = loadSeeds();
  const idx = all.findIndex((s) => s.id === seedId);
  if (idx < 0) return null;
  const row = all[idx];
  const full: SeedLifeEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const updated: IdeaSeed = {
    ...row,
    events: [...row.events, full],
    updatedAt: new Date().toISOString(),
  };
  upsertSeed(updated);
  return updated;
}

export function getSeedById(id: string): IdeaSeed | undefined {
  return loadSeeds().find((s) => s.id === id);
}

export function buildSeedSummary(): SeedSummary {
  const seeds = loadSeeds();
  const parts = partitionSeeds(seeds);
  return {
    sprouting: parts.sprouting.length,
    growing: parts.growing.length,
    archived: parts.archived.length,
    spotlight: spotlightGrowing(seeds, 5),
    recent: parts.growing.slice(0, 4),
  };
}
