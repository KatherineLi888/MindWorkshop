import { STORAGE_KEY, type VaultState } from "@/app/canvas/types";
import { loadLocal, LOCAL_KEYS, saveLocal } from "@/lib/local-store";
import { dispatchCloudSynced } from "@/lib/cloud-sync-events";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import type { ThoughtSession } from "@/lib/thinking/types";
import type { IdeaSeed } from "@/lib/seeds/types";
import type {
  DecisionRow,
  EntityLinkRow,
  GoalRow,
  GraphNodeRow,
} from "@/types/database";

const MIGRATED_KEY = "workshop-cloud-migrated-user";

export type MigrateResult = {
  ok: boolean;
  message: string;
  counts: Record<string, number>;
};

function isMigratedForUser(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(MIGRATED_KEY) === userId;
}

function markMigrated(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MIGRATED_KEY, userId);
}

function withUserId<T extends { user_id: string }>(
  rows: T[],
  userId: string
): T[] {
  return rows.map((r) => ({ ...r, user_id: userId }));
}

const MISC_KEYS = [
  "workshop-model-library",
  "workshop-theory-library",
  "workshop-model-applications",
  "workshop-review-records",
  "workshop-triage-records",
  "workshop-triage-logic",
  "workshop-flow-jumps",
  "workshop-flow-entries",
  "workshop-flow-block-meta",
  "workshop-goal-activities",
  "workshop-goal-challenges",
  "workshop-stats-dashboard-v2",
  "workshop-stats-dashboard-views-v1",
] as const;

/** 将本机 localStorage 数据一次性上传到当前登录账号 */
export async function migrateLocalToCloud(
  force = false
): Promise<MigrateResult> {
  if (!isCloudEnabled()) {
    return { ok: false, message: "云端未启用", counts: {} };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "未登录", counts: {} };
  }

  if (!force && isMigratedForUser(user.id)) {
    return { ok: true, message: "本机数据已同步过", counts: {} };
  }

  const counts: Record<string, number> = {};
  const userId = user.id;

  const decisions = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
  if (decisions.length) {
    const rows = withUserId(decisions, userId).map((d) => ({
      id: d.id,
      user_id: userId,
      title: d.title,
      source: d.source,
      path_summary: d.path_summary,
      final_action: d.final_action,
      flow_state: d.flow_state,
      background: d.background,
      constraints: d.constraints,
      personal_notes: d.personal_notes,
      flow_confirmed: d.flow_confirmed,
      tag_executor: d.tag_executor,
      tag_horizon: d.tag_horizon,
      tag_outcome: d.tag_outcome,
      archived_at: d.archived_at,
      manual_conclusion: d.manual_conclusion,
      manual_goal: d.manual_goal,
      decision_notes: d.decision_notes ?? [],
      created_at: d.created_at,
      updated_at: d.updated_at,
    }));
    await supabase.from("decisions").upsert(rows, { onConflict: "id" });
    counts.decisions = rows.length;
  }

  const goals = loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []);
  if (goals.length) {
    const rows = withUserId(goals, userId).map((g) => ({
      id: g.id,
      user_id: userId,
      title: g.title,
      goal_type: g.goal_type,
      progress: g.progress,
      smart_current: g.smart_current,
      execution: g.execution ?? {},
      created_at: g.created_at,
      updated_at: g.updated_at,
    }));
    await supabase.from("goals").upsert(rows, { onConflict: "id" });
    counts.goals = rows.length;
  }

  const graphNodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  if (graphNodes.length) {
    const rows = withUserId(graphNodes, userId).map((n) => ({
      id: n.id,
      user_id: userId,
      node_type: n.node_type,
      title: n.title,
      background: n.background ?? "",
      status: n.status,
      position_x: n.position_x,
      position_y: n.position_y,
      created_at: n.created_at,
      updated_at: n.updated_at,
    }));
    await supabase.from("graph_nodes").upsert(rows, { onConflict: "id" });
    counts.graph_nodes = rows.length;
  }

  const graphEdges = loadLocal<
    {
      id: string;
      user_id: string;
      source_id: string;
      target_id: string;
      label?: string;
      created_at: string;
    }[]
  >(LOCAL_KEYS.graphEdges, []);
  if (graphEdges.length) {
    const rows = withUserId(graphEdges, userId).map((e) => ({
      id: e.id,
      user_id: userId,
      source_id: e.source_id,
      target_id: e.target_id,
      label: e.label ?? "",
      created_at: e.created_at,
    }));
    await supabase.from("graph_edges").upsert(rows, { onConflict: "id" });
    counts.graph_edges = rows.length;
  }

  const links = loadLocal<EntityLinkRow[]>(LOCAL_KEYS.entityLinks, []);
  if (links.length) {
    const rows = withUserId(links, userId).map((l) => ({
      id: l.id,
      user_id: userId,
      from_type: l.from_type,
      from_id: l.from_id,
      to_type: l.to_type,
      to_id: l.to_id,
      created_at: l.created_at,
    }));
    await supabase.from("entity_links").upsert(rows, { onConflict: "id" });
    counts.entity_links = rows.length;
  }

  const inbox = loadLocal<
    { id: string; title: string; item_type: string; created_at: string }[]
  >(LOCAL_KEYS.inbox, []);
  if (inbox.length) {
    const rows = inbox.map((item) => ({
      id: item.id,
      user_id: userId,
      item_type: item.item_type,
      title: item.title,
      payload: {},
      created_at: item.created_at,
    }));
    await supabase.from("inbox_items").upsert(rows, { onConflict: "id" });
    counts.inbox_items = rows.length;
  }

  const settings = loadLocal<{ openai_api_key?: string }>(
    LOCAL_KEYS.settings,
    {}
  );
  if (settings.openai_api_key) {
    await supabase.from("user_settings").upsert({
      user_id: userId,
      openai_api_key: settings.openai_api_key,
      updated_at: new Date().toISOString(),
    });
    counts.user_settings = 1;
  }

  const thinking = loadLocal<ThoughtSession[]>(LOCAL_KEYS.thinking, []);
  if (thinking.length) {
    const rows = thinking.map((s) => ({
      id: s.id,
      user_id: userId,
      title: s.title,
      session_data: {
        nodes: s.nodes,
        editorView: s.editorView,
        textChildLayout: s.textChildLayout,
        childOrder: s.childOrder,
        sourceTriageId: s.sourceTriageId,
      },
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));
    await supabase.from("thinking_sessions").upsert(rows, { onConflict: "id" });
    counts.thinking_sessions = rows.length;
  }

  const seeds = loadLocal<IdeaSeed[]>("workshop-idea-seeds", []);
  if (seeds.length) {
    const rows = seeds.map((s) => ({
      id: s.id,
      user_id: userId,
      seed_data: s,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));
    await supabase.from("idea_seeds").upsert(rows, { onConflict: "id" });
    counts.idea_seeds = rows.length;
  }

  const seedMap = loadLocal<Record<string, string>>(
    "workshop-seed-entity-map",
    {}
  );
  const mapRows = Object.entries(seedMap).map(([entity_key, seed_id]) => ({
    user_id: userId,
    entity_key,
    seed_id,
  }));
  if (mapRows.length) {
    await supabase.from("seed_entity_links").upsert(mapRows, {
      onConflict: "user_id,entity_key",
    });
    counts.seed_entity_links = mapRows.length;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const vault = JSON.parse(raw) as VaultState;
      const { data: existing } = await supabase
        .from("canvas_vaults")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        await supabase
          .from("canvas_vaults")
          .update({
            vault_data: vault,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("canvas_vaults").insert({
          user_id: userId,
          name: "默认画布库",
          vault_data: vault,
        });
      }
      counts.canvas_vaults = 1;
    }
  } catch {
    /* ignore */
  }

  let miscCount = 0;
  for (const key of MISC_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      await supabase.from("user_misc_data").upsert(
        {
          user_id: userId,
          data_key: key,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,data_key" }
      );
      miscCount++;
    } catch {
      /* ignore */
    }
  }
  if (miscCount) counts.user_misc_data = miscCount;

  markMigrated(userId);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return {
    ok: true,
    message: total > 0 ? `已上传 ${total} 条记录到云端` : "本机暂无待同步数据",
    counts,
  };
}

/** 从云端拉取数据写入本机缓存（供同步模块读取） */
export async function hydrateFromCloud(): Promise<void> {
  if (!isCloudEnabled() || typeof window === "undefined") return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const userId = user.id;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (goals?.length) {
    saveLocal(LOCAL_KEYS.goals, goals);
  }

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (decisions?.length) {
    saveLocal(LOCAL_KEYS.decisions, decisions);
  }

  const { data: graphNodes } = await supabase
    .from("graph_nodes")
    .select("*")
    .eq("user_id", userId);
  if (graphNodes?.length) {
    saveLocal(LOCAL_KEYS.graphNodes, graphNodes);
  }

  const { data: graphEdges } = await supabase
    .from("graph_edges")
    .select("*")
    .eq("user_id", userId);
  if (graphEdges?.length) {
    saveLocal(LOCAL_KEYS.graphEdges, graphEdges);
  }

  const { data: links } = await supabase
    .from("entity_links")
    .select("*")
    .eq("user_id", userId);
  if (links?.length) {
    saveLocal(LOCAL_KEYS.entityLinks, links);
  }

  const { data: thinking } = await supabase
    .from("thinking_sessions")
    .select("*")
    .eq("user_id", userId);
  if (thinking?.length) {
    const sessions: ThoughtSession[] = thinking.map((row) => {
      const d = row.session_data as Partial<ThoughtSession>;
      return {
        id: row.id,
        title: row.title,
        nodes: d.nodes ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        editorView: d.editorView,
        textChildLayout: d.textChildLayout,
        childOrder: d.childOrder,
        sourceTriageId: d.sourceTriageId,
      };
    });
    saveLocal(LOCAL_KEYS.thinking, sessions);
  }

  const { data: seeds } = await supabase
    .from("idea_seeds")
    .select("*")
    .eq("user_id", userId);
  if (seeds?.length) {
    const list = seeds.map((r) => r.seed_data as IdeaSeed);
    saveLocal("workshop-idea-seeds", list);
  }

  const { data: seedLinks } = await supabase
    .from("seed_entity_links")
    .select("*")
    .eq("user_id", userId);
  if (seedLinks?.length) {
    const map: Record<string, string> = {};
    for (const row of seedLinks) {
      map[row.entity_key] = row.seed_id;
    }
    saveLocal("workshop-seed-entity-map", map);
  }

  const { data: misc } = await supabase
    .from("user_misc_data")
    .select("*")
    .eq("user_id", userId);
  misc?.forEach((row) => {
    try {
      localStorage.setItem(row.data_key, JSON.stringify(row.data));
    } catch {
      /* ignore */
    }
  });

  const { data: vaults } = await supabase
    .from("canvas_vaults")
    .select("vault_data")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (vaults?.vault_data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vaults.vault_data));
    } catch {
      /* ignore */
    }
  }

  dispatchCloudSynced();
}

/** 登录后：先上传本机数据，再拉取云端合并 */
export async function onAccountLogin(): Promise<MigrateResult> {
  const result = await migrateLocalToCloud();
  await hydrateFromCloud();
  return result;
}
