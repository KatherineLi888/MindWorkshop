import { isFunnelConfig, isStageConfig } from "./helpers";
import type { ModelConfig, ModelKind } from "./types";

export type ApplyViewportTier = "full" | "pane" | "panel";

export type ApplyLayoutHint = {
  width: number;
  height: number;
  aspect: number;
  tier: ApplyViewportTier;
  compact: boolean;
  /** 宽扁视角（如上下分屏的单栏） */
  isWide: boolean;
  /** 高窄视角（如左右分屏的单栏） */
  isTall: boolean;
  stageLayout: "horizontal" | "grid-2x2" | "vertical";
  stageGridCols: number;
  funnelLayout: "tapered" | "equal-rows";
};

export function getApplyLayoutHint(
  width: number,
  height: number,
  kind: ModelKind,
  config: ModelConfig,
  tier: ApplyViewportTier = "full"
): ApplyLayoutHint {
  const aspect = width / Math.max(height, 1);
  const compact = width < 400 || height < 260 || tier === "panel";
  const isWide = aspect >= 1.05;
  const isTall = aspect < 0.92;

  let stageLayout: ApplyLayoutHint["stageLayout"] = "horizontal";
  let stageGridCols = 1;
  let funnelLayout: ApplyLayoutHint["funnelLayout"] = "tapered";

  if (isStageConfig(config)) {
    const n = config.stages.length;
    const shortPane = height < 340;
    if (isWide || (tier === "pane" && (shortPane || !isTall))) {
      stageLayout = "horizontal";
      stageGridCols = n;
    } else if (isTall && n === 4) {
      stageLayout = "grid-2x2";
      stageGridCols = 2;
    } else if (isTall && n > 3) {
      stageLayout = "grid-2x2";
      stageGridCols = 2;
    } else if (isTall) {
      stageLayout = "vertical";
      stageGridCols = 1;
    } else {
      stageLayout = "horizontal";
      stageGridCols = n;
    }
  }

  if (isFunnelConfig(config)) {
    funnelLayout = isTall && !isWide ? "equal-rows" : "tapered";
  }

  return {
    width,
    height,
    aspect,
    tier,
    compact,
    isWide,
    isTall,
    stageLayout,
    stageGridCols,
    funnelLayout,
  };
}

export function defaultLayoutHint(
  kind: ModelKind,
  config: ModelConfig,
  tier: ApplyViewportTier = "full"
): ApplyLayoutHint {
  return getApplyLayoutHint(800, 600, kind, config, tier);
}
