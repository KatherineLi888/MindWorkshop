import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import { ensureEntityHasSeed } from "@/lib/seeds/ensure";
import { DEFAULT_GOAL_EXECUTION } from "@/lib/goals/types";
import { saveReviewRecord } from "@/lib/review/storage";
import type { AiMutation } from "@/lib/ai/tools";
import type { DecisionRow, GoalRow } from "@/types/database";

export function applyAiMutations(mutations: AiMutation[]) {
  if (!mutations.length || typeof window === "undefined") return;

  for (const m of mutations) {
    if (m.type === "create_goal") {
      const now = new Date().toISOString();
      const row: GoalRow = {
        id: m.id,
        user_id: "local",
        title: m.title,
        goal_type: m.goal_type,
        progress: 0,
        smart_current: {
          specific: m.title,
          measurable: "",
          achievable: "",
          relevant: "",
          timeBound: "",
        },
        execution: { ...DEFAULT_GOAL_EXECUTION },
        created_at: now,
        updated_at: now,
      };
      const prev = loadLocal<GoalRow[]>(LOCAL_KEYS.goals, []);
      saveLocal(LOCAL_KEYS.goals, [row, ...prev]);
      ensureEntityHasSeed({
        entityType: "goal",
        entityId: m.id,
        title: m.title,
        stage: "goals",
      });
    }

    if (m.type === "create_decision") {
      const now = new Date().toISOString();
      const row: DecisionRow = {
        id: m.id,
        user_id: "local",
        title: m.title,
        source: m.source,
        path_summary: "AI 创建草稿",
        final_action: "待完成决策树",
        flow_state: {},
        background: null,
        constraints: null,
        personal_notes: null,
        flow_confirmed: false,
        tag_executor: null,
        tag_horizon: null,
        tag_outcome: "proceed",
        manual_conclusion: null,
        manual_goal: null,
        decision_notes: [],
        archived_at: null,
        created_at: now,
        updated_at: now,
      };
      const prev = loadLocal<DecisionRow[]>(LOCAL_KEYS.decisions, []);
      saveLocal(LOCAL_KEYS.decisions, [row, ...prev]);
      ensureEntityHasSeed({
        entityType: "decision",
        entityId: m.id,
        title: m.title,
        stage: "decisions",
      });
    }

    if (m.type === "create_review") {
      const now = new Date().toISOString();
      saveReviewRecord({
        id: m.id,
        kind: m.kind,
        title: m.title,
        goalId: m.goalId,
        goalTitle: m.goalTitle,
        highlights: [],
        summary: m.summary,
        createdAt: now,
        updatedAt: now,
      });
      ensureEntityHasSeed({
        entityType: "review_record",
        entityId: m.id,
        title: m.title,
        stage: "review",
      });
    }
  }
}
