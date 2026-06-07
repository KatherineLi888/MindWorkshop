import { SEED_ACTION_LABELS, seedStageLabel } from "./labels";
import type { SeedLifeEvent } from "./types";

export function buildEventSummary(
  event: SeedLifeEvent,
  prev?: SeedLifeEvent
): string {
  if (event.summary?.trim()) return event.summary.trim();

  const stage = seedStageLabel(event.stage);
  const action = SEED_ACTION_LABELS[event.action];

  switch (event.action) {
    case "born":
      return `在「${stage}」诞生`;
    case "entered":
      return `进入「${stage}」继续推进`;
    case "jumped":
      return prev
        ? `从「${seedStageLabel(prev.stage)}」跳入「${stage}」`
        : `跳入「${stage}」`;
    case "loopback":
      return `从追踪回转到「${stage}」`;
    case "abandoned":
      return `在「${stage}」放弃推进`;
    case "ended":
      return `在「${stage}」归档结束`;
    default:
      return `${stage} · ${action}`;
  }
}
