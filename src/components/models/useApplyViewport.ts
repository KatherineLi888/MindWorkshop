"use client";

import { useEffect, useRef, useState } from "react";
import {
  defaultLayoutHint,
  getApplyLayoutHint,
  type ApplyLayoutHint,
  type ApplyViewportTier,
} from "@/lib/models/model-apply-layout";
import type { ModelConfig, ModelKind } from "@/lib/models/types";

export function useApplyViewport(
  kind: ModelKind,
  config: ModelConfig,
  tier: ApplyViewportTier = "full"
) {
  const ref = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState<ApplyLayoutHint>(() =>
    defaultLayoutHint(kind, config, tier)
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      setHint(getApplyLayoutHint(rect.width, rect.height, kind, config, tier));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [kind, config, tier]);

  return { ref, hint };
}
