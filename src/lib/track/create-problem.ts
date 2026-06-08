import { saveTrackProblem } from "./save-problem";
import type { GraphNodeRow } from "@/types/database";

type CreateProblemInput = {
  title: string;
  anchorType: "goal" | "decision" | "goal_kr";
  anchorId: string;
  problemFocus?: string;
  solutionApproach?: string;
  resolutionPlan?: string;
  background?: string;
};

export async function createLocalTrackProblem(
  input: CreateProblemInput
): Promise<GraphNodeRow> {
  return saveTrackProblem({
    problemFocus: input.problemFocus?.trim() || input.title.trim(),
    solutionApproach: input.solutionApproach?.trim() ?? "",
    resolutionPlan: input.resolutionPlan?.trim() ?? "",
    anchorType: input.anchorType,
    anchorId: input.anchorId,
    background: input.background,
  });
}
