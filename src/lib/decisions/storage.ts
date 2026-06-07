import { tagsFromFlowState } from "@/lib/decision-tree/tags";
import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { createClient, isCloudEnabled } from "@/lib/supabase/client";
import type { DecisionRow } from "@/types/database";
import type { FlowAnswers } from "@/lib/decision-tree/flow";
import type { DecisionTags } from "@/lib/decision-tree/tags";
import type { DecisionNoteEntry } from "@/lib/decisions/notes";
import { getDecisionNotes } from "@/lib/decisions/notes";

function normalizeRow(row: DecisionRow): DecisionRow {
  const flow = row.flow_state ?? {};
  const derived = tagsFromFlowState(flow);

  return {
    ...row,
    tag_executor: derived.tag_executor,
    tag_horizon: derived.tag_horizon,
    tag_outcome: derived.tag_outcome,
    archived_at: row.archived_at ?? null,
    manual_conclusion: row.manual_conclusion ?? null,
    manual_goal: row.manual_goal ?? null,
    decision_notes: getDecisionNotes(row),
  };
}

export function normalizeDecisionList(rows: DecisionRow[]): DecisionRow[] {
  return rows.map(normalizeRow);
}

export async function loadAllDecisions(): Promise<DecisionRow[]> {
  if (!isCloudEnabled()) {
    return normalizeDecisionList(
      loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, [])
    );
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .order("created_at", { ascending: false });
  return normalizeDecisionList((data as DecisionRow[]) ?? []);
}

export function buildDecisionRow(input: {
  id: string;
  user_id: string;
  title: string;
  source: "active" | "passive";
  pathSummary: string;
  finalAction: string;
  answers: FlowAnswers;
  tags: DecisionTags;
  manual_conclusion: string;
  manual_goal: string;
}): DecisionRow {
  const now = new Date().toISOString();
  return {
    id: input.id,
    user_id: input.user_id,
    title: input.title,
    source: input.source,
    path_summary: input.pathSummary,
    final_action: input.finalAction,
    flow_state: input.answers,
    background: null,
    constraints: null,
    personal_notes: null,
    flow_confirmed: true,
    tag_executor: input.tags.tag_executor,
    tag_horizon: input.tags.tag_horizon,
    tag_outcome: input.tags.tag_outcome,
    manual_conclusion: input.manual_conclusion.trim() || null,
    manual_goal: input.manual_goal.trim() || null,
    decision_notes: [],
    archived_at: null,
    created_at: now,
    updated_at: now,
  };
}

export async function persistDecision(row: DecisionRow): Promise<void> {
  if (!isCloudEnabled()) {
    const prev = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
    saveLocal(LOCAL_KEYS.decisions, [row, ...prev.map(normalizeRow)]);
    ensureEntityHasSeed({
      entityType: "decision",
      entityId: row.id,
      title: row.title,
      stage: "decisions",
    });
    return;
  }
  const supabase = createClient();
  await supabase.from("decisions").insert({
    user_id: row.user_id,
    title: row.title,
    source: row.source,
    path_summary: row.path_summary,
    final_action: row.final_action,
    flow_state: row.flow_state,
    flow_confirmed: row.flow_confirmed,
    tag_executor: row.tag_executor,
    tag_horizon: row.tag_horizon,
    tag_outcome: row.tag_outcome,
    archived_at: row.archived_at,
    manual_conclusion: row.manual_conclusion,
    manual_goal: row.manual_goal,
    decision_notes: row.decision_notes ?? [],
  });
}

export async function updateDecisionNotes(
  id: string,
  notes: DecisionNoteEntry[]
): Promise<DecisionRow[]> {
  const updated_at = new Date().toISOString();

  if (!isCloudEnabled()) {
    const prev = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
    const next = prev.map((d) =>
      d.id === id ? { ...d, decision_notes: notes, updated_at } : d
    );
    saveLocal(LOCAL_KEYS.decisions, next);
    return normalizeDecisionList(next);
  }

  const supabase = createClient();
  await supabase
    .from("decisions")
    .update({ decision_notes: notes, updated_at })
    .eq("id", id);
  return loadAllDecisions();
}

export async function updateDecisionManualFields(
  id: string,
  manual_conclusion: string | null,
  manual_goal: string | null
): Promise<DecisionRow[]> {
  const updated_at = new Date().toISOString();

  if (!isCloudEnabled()) {
    const prev = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
    const next = prev.map((d) =>
      d.id === id
        ? {
            ...d,
            manual_conclusion: manual_conclusion?.trim() || null,
            manual_goal: manual_goal?.trim() || null,
            updated_at,
          }
        : d
    );
    saveLocal(LOCAL_KEYS.decisions, next);
    return normalizeDecisionList(next);
  }

  const supabase = createClient();
  await supabase
    .from("decisions")
    .update({
      manual_conclusion: manual_conclusion?.trim() || null,
      manual_goal: manual_goal?.trim() || null,
      updated_at,
    })
    .eq("id", id);
  return loadAllDecisions();
}

export async function setDecisionArchived(
  id: string,
  archived: boolean
): Promise<DecisionRow[]> {
  const at = archived ? new Date().toISOString() : null;

  if (!isCloudEnabled()) {
    const prev = normalizeDecisionList(
      loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, [])
    );
    const next = prev.map((d) =>
      d.id === id ? { ...d, archived_at: at, updated_at: new Date().toISOString() } : d
    );
    saveLocal(LOCAL_KEYS.decisions, next);
    return next;
  }

  const supabase = createClient();
  await supabase
    .from("decisions")
    .update({ archived_at: at, updated_at: new Date().toISOString() })
    .eq("id", id);
  return loadAllDecisions();
}
