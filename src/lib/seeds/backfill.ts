import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadApplications } from "@/lib/models/application-store";
import { loadModelLibrary } from "@/lib/models/model-library-store";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { loadTheories } from "@/lib/theories/theory-store";
import { loadReviewRecords } from "@/lib/review/storage";
import { loadTriageRecords } from "@/lib/triage/storage";
import type { DecisionRow, GoalRow, GraphNodeRow } from "@/types/database";
import { ensureEntityHasSeed } from "./ensure";
import { loadSeedEntityMap } from "./storage";

/** 为历史数据补建缺失种子 */
export function backfillMissingSeeds(): number {
  if (typeof window === "undefined") return 0;
  let created = 0;
  const before = new Set(Object.keys(loadSeedEntityMap()));

  const touch = (
    entityType: string,
    entityId: string,
    title?: string,
    stage?: Parameters<typeof ensureEntityHasSeed>[0]["stage"]
  ) => {
    const key = `${entityType}:${entityId}`;
    if (before.has(key)) return;
    ensureEntityHasSeed({ entityType, entityId, title, stage });
    before.add(key);
    created++;
  };

  for (const r of loadTriageRecords()) {
    touch("triage", r.id, r.summary || r.rawText, "home");
  }

  const inbox = loadLocal<{ id: string; title: string }[]>(
    LOCAL_KEYS.inbox,
    []
  );
  for (const i of inbox) {
    touch("inbox_manual", i.id, i.title, "inbox");
  }

  for (const s of loadThoughtSessions()) {
    touch("thinking_session", s.id, s.title, "thinking");
  }

  const decisions = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
  for (const d of decisions) {
    touch("decision", d.id, d.title, "decisions");
  }

  const goals = loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []);
  for (const g of goals) {
    touch("goal", g.id, g.title, "goals");
  }

  const nodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  for (const n of nodes.filter((x) => x.node_type === "problem")) {
    touch("graph_node", n.id, n.problem_focus || n.title, "track");
  }

  for (const m of loadModelLibrary().filter((x) => !x.builtin)) {
    touch("thinking_model", m.id, m.name, "model");
  }

  for (const a of loadApplications()) {
    touch(
      "model_application",
      a.id,
      a.scenario || a.modelName,
      "model"
    );
  }

  for (const r of loadReviewRecords()) {
    touch("review_record", r.id, r.title, "review");
  }

  for (const t of loadTheories()) {
    touch("theory", t.id, t.title || t.statement, "theory");
  }

  return created;
}
