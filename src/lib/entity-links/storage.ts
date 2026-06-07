import { STORAGE_KEY, type VaultState } from "@/app/canvas/types";
import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadApplications } from "@/lib/models/application-store";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import type { EntityLinkRow, EntityType, GraphNodeRow } from "@/types/database";

export type LinkTarget = {
  type: EntityType;
  id: string;
  title: string;
};

function loadVaultDocuments(): { id: string; title: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const vault = JSON.parse(raw) as VaultState;
    return Object.values(vault.documents).map((d) => ({
      id: d.id,
      title: d.name,
    }));
  } catch {
    return [];
  }
}

export async function loadLinkTargets(): Promise<LinkTarget[]> {
  const list: LinkTarget[] = [];

  const [decisions, goals] = await Promise.all([
    loadAllDecisions(),
    loadAllGoals(),
  ]);

  decisions
    .filter((d) => !d.archived_at)
    .forEach((d) =>
      list.push({ type: "decision", id: d.id, title: d.title })
    );
  goals.forEach((g) =>
    list.push({ type: "goal", id: g.id, title: g.title })
  );

  if (!isCloudEnabled()) {
    const nodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
    nodes.forEach((n) =>
      list.push({ type: "graph_node", id: n.id, title: n.title })
    );
  } else {
    const supabase = createClient();
    const { data: nodes } = await supabase
      .from("graph_nodes")
      .select("id, title")
      .limit(80);
    nodes?.forEach((n) =>
      list.push({ type: "graph_node", id: n.id, title: n.title })
    );
  }

  loadThoughtSessions().forEach((s) =>
    list.push({ type: "thinking_session", id: s.id, title: s.title })
  );

  loadApplications().forEach((a) =>
    list.push({
      type: "model_application",
      id: a.id,
      title: a.scenario || a.modelName,
    })
  );

  loadVaultDocuments().forEach((d) =>
    list.push({ type: "canvas_document", id: d.id, title: d.title })
  );

  return list;
}

function loadLocalLinks(): EntityLinkRow[] {
  return loadLocal<EntityLinkRow[]>(LOCAL_KEYS.entityLinks, []);
}

function saveLocalLinks(links: EntityLinkRow[]) {
  saveLocal(LOCAL_KEYS.entityLinks, links);
}

export async function loadEntityLinksTo(
  toType: EntityType,
  toId: string
): Promise<EntityLinkRow[]> {
  if (!isCloudEnabled()) {
    return loadLocalLinks().filter(
      (l) => l.to_type === toType && l.to_id === toId
    );
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("entity_links")
    .select("*")
    .eq("to_type", toType)
    .eq("to_id", toId);
  return (data as EntityLinkRow[]) ?? [];
}

export async function loadEntityLinksFor(
  fromType: EntityType,
  fromId: string
): Promise<EntityLinkRow[]> {
  if (!isCloudEnabled()) {
    return loadLocalLinks().filter(
      (l) => l.from_type === fromType && l.from_id === fromId
    );
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("entity_links")
    .select("*")
    .eq("from_type", fromType)
    .eq("from_id", fromId);
  return (data as EntityLinkRow[]) ?? [];
}

export async function persistEntityLink(input: {
  fromType: EntityType;
  fromId: string;
  toType: EntityType;
  toId: string;
}): Promise<boolean> {
  if (input.fromType === input.toType && input.fromId === input.toId) {
    return false;
  }

  const now = new Date().toISOString();

  if (!isCloudEnabled()) {
    const prev = loadLocalLinks();
    const dup = prev.some(
      (l) =>
        l.from_type === input.fromType &&
        l.from_id === input.fromId &&
        l.to_type === input.toType &&
        l.to_id === input.toId
    );
    if (dup) return true;
    const row: EntityLinkRow = {
      id: crypto.randomUUID(),
      user_id: "local",
      from_type: input.fromType,
      from_id: input.fromId,
      to_type: input.toType,
      to_id: input.toId,
      created_at: now,
    };
    saveLocalLinks([row, ...prev]);
    return true;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  await supabase.from("entity_links").insert({
    user_id: user.id,
    from_type: input.fromType,
    from_id: input.fromId,
    to_type: input.toType,
    to_id: input.toId,
  });
  return true;
}

export async function resolveLinkTargetTitle(
  type: EntityType,
  id: string
): Promise<string> {
  const targets = await loadLinkTargets();
  return targets.find((t) => t.type === type && t.id === id)?.title ?? id;
}
