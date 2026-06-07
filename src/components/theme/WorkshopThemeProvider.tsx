"use client";

import { useEffect } from "react";
import {
  WORKSHOP_THEME_CHANGED,
  applyWorkshopTheme,
  loadWorkshopTheme,
  type WorkshopThemePrefs,
} from "@/lib/theme/workshop-theme";

/** 启动时应用主题，并监听设置页保存后的变更 */
export function WorkshopThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    applyWorkshopTheme(loadWorkshopTheme());

    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<WorkshopThemePrefs>).detail;
      if (detail) applyWorkshopTheme(detail);
      else applyWorkshopTheme(loadWorkshopTheme());
    };

    window.addEventListener(WORKSHOP_THEME_CHANGED, onThemeChange);
    return () => window.removeEventListener(WORKSHOP_THEME_CHANGED, onThemeChange);
  }, []);

  return children;
}
