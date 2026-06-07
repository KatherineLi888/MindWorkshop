import type { FlowStage } from "./types";

/** 收集箱可跳入任意下游；其后每层只能跳入下一层 */
export const FLOW_JUMP_TARGETS: Record<FlowStage, FlowStage[]> = {
  inbox: ["thinking", "decisions", "goals", "track"],
  thinking: ["decisions"],
  decisions: ["goals", "track"],
  goals: ["track"],
  track: ["thinking", "decisions", "goals"],
};

export const FLOW_NEXT_STAGE: Partial<Record<FlowStage, FlowStage>> = {
  inbox: "thinking",
  thinking: "decisions",
  decisions: "goals",
  goals: "track",
};

export function canFlowJump(from: FlowStage, to: FlowStage): boolean {
  return FLOW_JUMP_TARGETS[from]?.includes(to) ?? false;
}

export function flowJumpButtonLabel(from: FlowStage, to: FlowStage): string {
  const labels: Record<FlowStage, string> = {
    thinking: "跳入思考",
    decisions: "跳入决策",
    goals: "跳入目标",
    track: "跳入追踪",
    inbox: "跳入收集箱",
  };
  if (from === "thinking" && to === "decisions") return "完成思考 · 跳入决策";
  if (from === "decisions" && to === "goals") return "完成决策 · 跳入目标";
  if (from === "goals" && to === "track") return "完成目标 · 跳入追踪";
  if (from === "decisions" && to === "track") return "记录结果 · 跳入追踪";
  if (from === "track" && to === "thinking") return "回转思考";
  if (from === "track" && to === "decisions") return "回转决策";
  if (from === "track" && to === "goals") return "回转目标";
  return labels[to] ?? `跳入${to}`;
}
