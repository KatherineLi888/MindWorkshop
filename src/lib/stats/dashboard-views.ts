import { loadLocal, saveLocal } from "@/lib/local-store";
import {
  cloneLayout,
  DEFAULT_LAYOUT,
  loadDashboardLayout,
  type DashboardLayout,
  type TimeRange,
  type WidgetFilters,
} from "./dashboard-config";

const VIEWS_STORAGE_KEY = "workshop-stats-dashboard-views-v1";

export type DashboardView = {
  id: string;
  label: string;
  description?: string;
  /** 视图级时间范围，渲染时覆盖各组件的时间筛选 */
  timePreset: TimeRange;
  timeFrom?: string;
  timeTo?: string;
  layout: DashboardLayout;
  builtin?: boolean;
};

export type DashboardViewsStore = {
  activeViewId: string;
  views: DashboardView[];
};

export type ViewTimeScope = Pick<
  WidgetFilters,
  "timeRange" | "timeFrom" | "timeTo"
>;

export const VIEW_PRESET_LABELS: Record<
  "today" | "week" | "month",
  string
> = {
  today: "当日",
  week: "本周",
  month: "本月",
};

const BUILTIN_SPECS: Array<{
  id: string;
  label: string;
  description: string;
  timePreset: TimeRange;
}> = [
  {
    id: "day",
    label: "当日仪表盘",
    description: "聚焦今天的创建、更新与推进",
    timePreset: "today",
  },
  {
    id: "week",
    label: "本周仪表盘",
    description: "查看本周整体节奏与进展",
    timePreset: "week",
  },
  {
    id: "month",
    label: "本月仪表盘",
    description: "月度复盘与态势纵览",
    timePreset: "month",
  },
];

function createBuiltinViews(baseLayout: DashboardLayout): DashboardView[] {
  return BUILTIN_SPECS.map((spec) => ({
    ...spec,
    builtin: true,
    layout: cloneLayout(baseLayout),
  }));
}

export function viewTimeScope(view: DashboardView): ViewTimeScope {
  return {
    timeRange: view.timePreset,
    timeFrom: view.timeFrom,
    timeTo: view.timeTo,
  };
}

export function mergeViewFilters(
  filters: WidgetFilters,
  scope?: ViewTimeScope | null
): WidgetFilters {
  if (!scope?.timeRange || scope.timeRange === "all") return filters;
  return {
    ...filters,
    timeRange: scope.timeRange,
    timeFrom: scope.timeFrom,
    timeTo: scope.timeTo,
  };
}

export function loadDashboardViews(): DashboardViewsStore {
  const stored = loadLocal<DashboardViewsStore | null>(VIEWS_STORAGE_KEY, null);
  if (stored?.views?.length) {
    const views = stored.views.map((v) => ({
      ...v,
      layout: v.layout?.instances?.length
        ? v.layout
        : cloneLayout(DEFAULT_LAYOUT),
    }));
    const activeViewId = views.some((v) => v.id === stored.activeViewId)
      ? stored.activeViewId
      : views[0].id;
    return { activeViewId, views };
  }

  const legacyLayout = loadDashboardLayout();
  const views = createBuiltinViews(legacyLayout);
  const initial: DashboardViewsStore = { activeViewId: "day", views };
  saveDashboardViews(initial);
  return initial;
}

export function saveDashboardViews(store: DashboardViewsStore) {
  saveLocal(VIEWS_STORAGE_KEY, store);
}

export function getActiveView(store: DashboardViewsStore): DashboardView {
  return (
    store.views.find((v) => v.id === store.activeViewId) ?? store.views[0]
  );
}

export function switchActiveView(
  store: DashboardViewsStore,
  viewId: string
): DashboardViewsStore {
  if (!store.views.some((v) => v.id === viewId)) return store;
  return { ...store, activeViewId: viewId };
}

export function updateActiveViewLayout(
  store: DashboardViewsStore,
  layout: DashboardLayout
): DashboardViewsStore {
  return {
    ...store,
    views: store.views.map((v) =>
      v.id === store.activeViewId ? { ...v, layout } : v
    ),
  };
}

export function addCustomView(
  store: DashboardViewsStore,
  input: {
    label: string;
    timePreset: TimeRange;
    timeFrom?: string;
    timeTo?: string;
    cloneLayoutFrom?: DashboardLayout;
  }
): DashboardViewsStore {
  const base = input.cloneLayoutFrom ?? getActiveView(store).layout;
  const view: DashboardView = {
    id: crypto.randomUUID(),
    label: input.label.trim(),
    timePreset: input.timePreset,
    timeFrom: input.timeFrom,
    timeTo: input.timeTo,
    layout: cloneLayout(base),
    builtin: false,
  };
  return {
    activeViewId: view.id,
    views: [...store.views, view],
  };
}

export function removeCustomView(
  store: DashboardViewsStore,
  viewId: string
): DashboardViewsStore {
  const target = store.views.find((v) => v.id === viewId);
  if (!target || target.builtin) return store;
  const views = store.views.filter((v) => v.id !== viewId);
  if (!views.length) return store;
  const activeViewId =
    store.activeViewId === viewId ? views[0].id : store.activeViewId;
  return { activeViewId, views };
}

export function updateCustomViewMeta(
  store: DashboardViewsStore,
  viewId: string,
  patch: Partial<
    Pick<DashboardView, "label" | "timePreset" | "timeFrom" | "timeTo">
  >
): DashboardViewsStore {
  return {
    ...store,
    views: store.views.map((v) =>
      v.id === viewId ? { ...v, ...patch } : v
    ),
  };
}

export function viewTimeLabel(view: DashboardView): string {
  if (view.timePreset === "custom") {
    if (view.timeFrom && view.timeTo) {
      return `${view.timeFrom} ~ ${view.timeTo}`;
    }
    return "自定义周期";
  }
  if (view.timePreset === "today") return "当日";
  if (view.timePreset === "week") return "本周";
  if (view.timePreset === "month") return "本月";
  if (view.timePreset === "7d") return "近 7 日";
  return "全部时间";
}
