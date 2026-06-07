import { loadLocal, saveLocal } from "@/lib/local-store";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/lib/supabase/user";
import type { IdeaSeed } from "./types";

const SEEDS_KEY = "workshop-idea-seeds";
const MAP_KEY = "workshop-seed-entity-map";

export async function syncSeedToCloud(seed: IdeaSeed): Promise<void> {
  if (!isCloudEnabled()) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const supabase = createClient();
  await supabase.from("idea_seeds").upsert(
    {
      id: seed.id,
      user_id: userId,
      seed_data: seed,
      created_at: seed.createdAt,
      updated_at: seed.updatedAt,
    },
    { onConflict: "id" }
  );
}

export async function syncSeedEntityMapToCloud(): Promise<void> {
  if (!isCloudEnabled()) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const map = loadLocal<Record<string, string>>(MAP_KEY, {});
  const rows = Object.entries(map).map(([entity_key, seed_id]) => ({
    user_id: userId,
    entity_key,
    seed_id,
  }));
  if (!rows.length) return;
  const supabase = createClient();
  await supabase.from("seed_entity_links").upsert(rows, {
    onConflict: "user_id,entity_key",
  });
}

export async function syncAllSeedsToCloud(seeds: IdeaSeed[]): Promise<void> {
  if (!isCloudEnabled() || !seeds.length) return;
  const userId = await getCurrentUserId();
  if (!userId || userId === "local") return;
  const supabase = createClient();
  await supabase.from("idea_seeds").upsert(
    seeds.map((s) => ({
      id: s.id,
      user_id: userId,
      seed_data: s,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    })),
    { onConflict: "id" }
  );
}

export function saveSeedsWithCloudSync(seeds: IdeaSeed[]) {
  saveLocal(SEEDS_KEY, seeds);
  void syncAllSeedsToCloud(seeds);
}
