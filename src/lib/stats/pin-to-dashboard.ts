export type PinResult = { ok: true } | { ok: false; reason: string };

function pinEntitySync(
  type: "thinking_pin" | "decision_pin",
  entityId: string,
  title: string
): PinResult {
  if (typeof window === "undefined") {
    return { ok: false, reason: "请在浏览器中操作" };
  }

  // 延迟加载，避免 dashboard-config ↔ grid-layout 循环依赖在 SSR 时出错
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createWidgetInstance } = require("@/lib/stats/dashboard-config") as typeof import("@/lib/stats/dashboard-config");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { autoPlaceInstances, compactEmptyRows } = require("@/lib/stats/grid-layout") as typeof import("@/lib/stats/grid-layout");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadDashboardViews, saveDashboardViews } = require("@/lib/stats/dashboard-views") as typeof import("@/lib/stats/dashboard-views");

  const store = loadDashboardViews();
  const allView = store.views.find((v) => v.id === "all");
  if (!allView) return { ok: false, reason: "未找到「全部」视图" };

  const exists = allView.layout.instances.some(
    (i) =>
      i.type === type && i.filters.pinEntityIds?.includes(entityId)
  );
  if (exists) return { ok: false, reason: "已在仪表盘中显示" };

  const instance = createWidgetInstance(
    type,
    "2x1",
    { pinEntityIds: [entityId], timeRange: "all" },
    "cards",
    title
  );

  const next = compactEmptyRows(
    autoPlaceInstances([...allView.layout.instances, instance])
  );

  saveDashboardViews({
    ...store,
    views: store.views.map((v) =>
      v.id === "all" ? { ...v, layout: { instances: next } } : v
    ),
  });
  return { ok: true };
}

export function pinThinkingToDashboard(
  sessionId: string,
  title: string
): PinResult {
  return pinEntitySync("thinking_pin", sessionId, title);
}

export function pinDecisionToDashboard(
  decisionId: string,
  title: string
): PinResult {
  return pinEntitySync("decision_pin", decisionId, title);
}

export function isThinkingPinned(sessionId: string): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadDashboardViews } = require("@/lib/stats/dashboard-views") as typeof import("@/lib/stats/dashboard-views");
  const allView = loadDashboardViews().views.find((v) => v.id === "all");
  return (
    allView?.layout.instances.some(
      (i) =>
        i.type === "thinking_pin" &&
        i.filters.pinEntityIds?.includes(sessionId)
    ) ?? false
  );
}

export function isDecisionPinned(decisionId: string): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { loadDashboardViews } = require("@/lib/stats/dashboard-views") as typeof import("@/lib/stats/dashboard-views");
  const allView = loadDashboardViews().views.find((v) => v.id === "all");
  return (
    allView?.layout.instances.some(
      (i) =>
        i.type === "decision_pin" &&
        i.filters.pinEntityIds?.includes(decisionId)
    ) ?? false
  );
}
