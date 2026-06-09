import { loadLocal, saveLocal } from "@/lib/local-store";

const KEY = "workshop-dashboard-collapsed";

export function loadCollapsedSections(): Record<string, boolean> {
  return loadLocal<Record<string, boolean>>(KEY, {});
}

export function isSectionCollapsed(sectionId: string): boolean {
  return !!loadCollapsedSections()[sectionId];
}

export function setSectionCollapsed(sectionId: string, collapsed: boolean) {
  const all = loadCollapsedSections();
  if (collapsed) all[sectionId] = true;
  else delete all[sectionId];
  saveLocal(KEY, all);
}

export function toggleSectionCollapsed(sectionId: string): boolean {
  const next = !isSectionCollapsed(sectionId);
  setSectionCollapsed(sectionId, next);
  return next;
}
