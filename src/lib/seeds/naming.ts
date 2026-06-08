import { UNNAMED_SEED_TITLE } from "./constants";
import type { SeedStage } from "./types";

/** 新种子：优先使用用户自定义名称 */
export function buildSeedTitle(input: {
  stage: SeedStage;
  entityType: string;
  detail?: string;
}): string {
  const detail = input.detail?.trim();
  if (detail) {
    return detail.length > 80 ? `${detail.slice(0, 80)}…` : detail;
  }
  return UNNAMED_SEED_TITLE;
}

/** 从旧版自动标题中提取用户内容（兼容历史数据） */
export function seedDisplayTitle(title: string): string {
  if (!title?.trim() || title === UNNAMED_SEED_TITLE) return UNNAMED_SEED_TITLE;
  const quoted = title.match(/「([^」]+)」/);
  if (quoted?.[1]) return quoted[1];
  if (title.startsWith("起自")) return UNNAMED_SEED_TITLE;
  return title;
}

/** 无阶段信息时的兜底名 */
export function fallbackSeedTitle(): string {
  return UNNAMED_SEED_TITLE;
}

export function isUnnamedSeedTitle(title: string): boolean {
  return !title?.trim() || title === UNNAMED_SEED_TITLE;
}
