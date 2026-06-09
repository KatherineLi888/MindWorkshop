"use client";

import { useCallback, useState } from "react";
import { isSectionCollapsed, setSectionCollapsed } from "./dashboard-collapse";

export function useDashboardCollapse(sectionId: string) {
  const [collapsed, setCollapsed] = useState(() =>
    isSectionCollapsed(sectionId)
  );

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      setSectionCollapsed(sectionId, next);
      return next;
    });
  }, [sectionId]);

  return { collapsed, toggle };
}
