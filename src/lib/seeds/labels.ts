import { FLOW_STAGE_LABELS } from "@/lib/flow/types";
import type { SeedEventAction, SeedStage } from "./types";

export const SEED_STAGE_LABELS: Record<SeedStage, string> = {
  ...FLOW_STAGE_LABELS,
  review: "复盘",
  home: "首页",
  model: "模型",
  theory: "理论",
  canvas: "画布",
  inbox: "收集箱",
};

export const SEED_ACTION_LABELS: Record<SeedEventAction, string> = {
  born: "诞生",
  entered: "进入",
  jumped: "跳入",
  loopback: "回转",
  abandoned: "放弃",
  ended: "结束",
};

export function seedStageLabel(stage: SeedStage): string {
  return SEED_STAGE_LABELS[stage] ?? stage;
}
