import {
  createStageConfig,
  createStoredModel,
} from "@/lib/models/helpers";
import { upsertModel } from "@/lib/models/model-library-store";
import type { StoredModel } from "@/lib/models/types";
import { upsertTheory } from "./theory-store";
import type { StoredTheory } from "./types";

/** 将已验证理论升格为模型库中的阶段模型 */
export function promoteTheoryToModel(theory: StoredTheory): {
  model: StoredModel;
  theory: StoredTheory;
} {
  const stepLabels = theory.steps
    .map((s) => s.content.trim())
    .filter(Boolean);

  const config =
    stepLabels.length >= 2
      ? createStageConfig(stepLabels.length, stepLabels)
      : createStageConfig(3, ["理解", "验证", "应用"]);

  const model = createStoredModel({
    name: theory.title.trim() || theory.statement.trim().slice(0, 40) || "来自理论",
    kind: "stage",
    description: theory.statement,
    applicableScenarios: theory.applicableWhen,
    inspirations: theory.source,
    usageNotes: [
      theory.counterWhen ? `不适用场景：${theory.counterWhen}` : "",
      "由理论库升格而来，请在套用前确认边界是否仍适用。",
    ]
      .filter(Boolean)
      .join("\n"),
    config,
    tags: [...theory.tags, "来自理论"],
    source: theory.source,
  });

  upsertModel(model);

  const updated: StoredTheory = {
    ...theory,
    status: "promoted",
    promotedModelId: model.id,
    updatedAt: new Date().toISOString(),
  };
  upsertTheory(updated);

  return { model, theory: updated };
}
