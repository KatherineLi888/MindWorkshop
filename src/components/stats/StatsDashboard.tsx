"use client";

import { useEffect, useMemo, useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import { AddDashboardViewDialog } from "@/components/stats/AddDashboardViewDialog";
import { DashboardEditBar } from "@/components/stats/DashboardEditBar";
import { DashboardActiveGoals } from "@/components/stats/DashboardActiveGoals";
import { DashboardFunnelPanel } from "@/components/stats/DashboardFunnelPanel";
import { DashboardGrid } from "@/components/stats/DashboardGrid";
import {
  DashboardPeriodBrief,
  periodOverviewSummary,
} from "@/components/stats/DashboardPeriodBrief";
import { DashboardQuickActions } from "@/components/stats/DashboardQuickActions";
import { DashboardSection } from "@/components/stats/DashboardSection";
import { DashboardTodayFeed } from "@/components/stats/DashboardTodayFeed";
import { DashboardViewSwitcher } from "@/components/stats/DashboardViewSwitcher";
import { WidgetComposer } from "@/components/stats/WidgetComposer";
import { MODULE_INTRO } from "@/lib/module-copy";
import { loadDashboardStats, type DashboardStats } from "@/lib/stats/aggregate";
import {
  cloneLayout,
  type DashboardLayout,
  type WidgetInstance,
} from "@/lib/stats/dashboard-config";
import {
  getActiveView,
  loadDashboardViews,
  saveDashboardViews,
  updateActiveViewLayout,
  viewTimeScope,
  type DashboardViewsStore,
} from "@/lib/stats/dashboard-views";
import {
  autoPlaceInstances,
  compactEmptyRows,
  insertInstanceAt,
  type GridAnchor,
} from "@/lib/stats/grid-layout";
import {
  firstEmptyAnchor,
  layoutForBuiltinView,
} from "@/lib/stats/period-layouts";

export function StatsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viewsStore, setViewsStore] = useState<DashboardViewsStore>(() =>
    loadDashboardViews()
  );
  const activeView = useMemo(() => getActiveView(viewsStore), [viewsStore]);
  const [savedLayout, setSavedLayout] = useState<DashboardLayout>(() =>
    cloneLayout(activeView.layout)
  );
  const [draftLayout, setDraftLayout] = useState<DashboardLayout | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [addViewOpen, setAddViewOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WidgetInstance | null>(
    null
  );
  const [addAnchor, setAddAnchor] = useState<GridAnchor | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const viewScope = useMemo(() => viewTimeScope(activeView), [activeView]);
  const isDayLayout = activeView.timePreset === "today";
  const isWeekLayout = activeView.id === "week";
  const isMonthLayout = activeView.id === "month";
  const showFunnel = !isDayLayout;
  const quickPreset = isDayLayout
    ? "today"
    : isWeekLayout
      ? "week"
      : isMonthLayout
        ? "month"
        : "month";

  const displayLayout = editing && draftLayout ? draftLayout : savedLayout;
  const placedInstances = useMemo(
    () => compactEmptyRows(autoPlaceInstances(displayLayout.instances)),
    [displayLayout.instances]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await loadDashboardStats();
      if (alive) {
        setStats(data);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persistViews = (next: DashboardViewsStore, layout?: DashboardLayout) => {
    const withLayout = layout ? updateActiveViewLayout(next, layout) : next;
    saveDashboardViews(withLayout);
    setViewsStore(withLayout);
    if (layout) setSavedLayout(cloneLayout(layout));
  };

  const handleSwitchView = (next: DashboardViewsStore) => {
    if (editing) return;
    const view = getActiveView(next);
    saveDashboardViews(next);
    setViewsStore(next);
    setSavedLayout(cloneLayout(view.layout));
  };

  const startEdit = () => {
    if (isDayLayout) return;
    setDraftLayout(cloneLayout(savedLayout));
    setEditing(true);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setEditingInstance(null);
    setAddAnchor(null);
  };

  const finishEdit = () => {
    if (!draftLayout) return;
    const normalized = {
      instances: compactEmptyRows(autoPlaceInstances(draftLayout.instances)),
    };
    persistViews(viewsStore, normalized);
    setEditing(false);
    setDraftLayout(null);
    closeComposer();
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraftLayout(null);
    closeComposer();
  };

  const openAddWidget = (anchor?: GridAnchor) => {
    if (isDayLayout) return;
    if (!editing) {
      setDraftLayout(cloneLayout(savedLayout));
      setEditing(true);
    }
    const layout = draftLayout ?? savedLayout;
    setEditingInstance(null);
    setAddAnchor(anchor ?? firstEmptyAnchor(layout));
    setComposerOpen(true);
  };

  const openEdit = (instance: WidgetInstance) => {
    if (!draftLayout) setDraftLayout(cloneLayout(savedLayout));
    if (!editing) setEditing(true);
    setEditingInstance(instance);
    setAddAnchor(null);
    setComposerOpen(true);
  };

  const saveInstance = (instance: WidgetInstance) => {
    const base = draftLayout ?? cloneLayout(savedLayout);
    const idx = base.instances.findIndex(
      (i) => i.instanceId === instance.instanceId
    );
    if (idx >= 0) {
      const instances = [...base.instances];
      instances[idx] = instance;
      setDraftLayout({ instances });
      if (!editing) setEditing(true);
      return;
    }
    if (addAnchor) {
      const next = insertInstanceAt(base.instances, instance, addAnchor);
      if (next) {
        setDraftLayout({ instances: next });
        if (!editing) setEditing(true);
      }
    }
  };

  const removeInstance = (instanceId: string) => {
    const base = draftLayout ?? cloneLayout(savedLayout);
    setDraftLayout({
      instances: compactEmptyRows(
        base.instances.filter((i) => i.instanceId !== instanceId)
      ),
    });
    if (!editing) setEditing(true);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-slate-400">加载统计数据…</p>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-7xl space-y-4 p-4 lg:p-6 ${editing ? "pb-36 md:pb-28" : ""}`}
      onContextMenu={handleContextMenu}
      onClick={() => setContextMenu(null)}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            统计
          </h1>
          <p className="mt-1 text-sm text-slate-400">{MODULE_INTRO.stats}</p>
        </div>
        <DashboardViewSwitcher
          store={viewsStore}
          disabled={editing}
          onChange={handleSwitchView}
        />
      </div>

      {isDayLayout && (
        <DashboardSection
          sectionId="section-active-goals"
          title="今日重点"
          subtitle="点击展开 KR · 长按进入复盘"
          compact
        >
          <div className="p-4 sm:p-5">
            <DashboardActiveGoals goals={stats.raw.goals} />
          </div>
        </DashboardSection>
      )}

      {isDayLayout && (
        <DashboardSection sectionId="section-today-feed" title="今日动态" compact>
          <div className="p-3">
            <DashboardTodayFeed stats={stats} scope={viewScope} />
          </div>
        </DashboardSection>
      )}

      {isDayLayout && (
        <DashboardQuickActions preset="today" />
      )}

      {showFunnel && (
        <div className="space-y-4">
          {(isWeekLayout || isMonthLayout) && !editing && (
            <DashboardSection
              sectionId="section-period-overview"
              title={isWeekLayout ? "本周概览" : "本月概览"}
              subtitle="对比上周期产出与目标节奏"
              collapsedSummary={periodOverviewSummary(
                isWeekLayout ? "week" : "month",
                stats
              )}
              compact
            >
              <DashboardPeriodBrief
                preset={isWeekLayout ? "week" : "month"}
                stats={stats}
              />
            </DashboardSection>
          )}

          <DashboardSection sectionId="section-funnel" title="流程漏斗" bare compact>
            <DashboardFunnelPanel />
          </DashboardSection>

          {placedInstances.length === 0 && !editing ? (
            <DashboardSection
              sectionId="section-widgets-empty"
              title="数据组件"
              subtitle="右键可编辑当前视图或新增组件"
              compact
            >
              <div
                className="py-10 text-center"
                onContextMenu={handleContextMenu}
              >
                <p className="text-sm text-slate-500">
                  暂无组件，右键可编辑当前视图
                </p>
              </div>
            </DashboardSection>
          ) : (
            <DashboardSection
              sectionId="section-widgets"
              title="数据组件"
              subtitle={
                editing
                  ? "右键编辑 · 长按拖动"
                  : `${placedInstances.length} 个组件，点击标题可收起`
              }
              collapsedSummary={`${placedInstances.length} 个组件`}
              compact
              bare
            >
              <DashboardGrid
                instances={placedInstances}
                stats={stats}
                editing={editing}
                viewScope={viewScope}
                onAddAt={openAddWidget}
                onEdit={openEdit}
                onRemove={removeInstance}
                onEnterEditMode={startEdit}
                onMove={(instances) => {
                  setDraftLayout({ instances });
                  if (!editing) setEditing(true);
                }}
              />
            </DashboardSection>
          )}

          <DashboardQuickActions preset={quickPreset} />
        </div>
      )}

      {editing && draftLayout && (
        <DashboardEditBar
          onReset={() =>
            setDraftLayout(
              cloneLayout(
                layoutForBuiltinView(
                  activeView.builtin ? activeView.id : "week"
                )
              )
            )
          }
          onCancel={cancelEdit}
          onDone={finishEdit}
        />
      )}

      {composerOpen && stats && (draftLayout || savedLayout) && (
        <WidgetComposer
          stats={stats}
          initial={editingInstance}
          anchor={addAnchor}
          layoutInstances={(draftLayout ?? savedLayout).instances}
          viewScope={viewScope}
          onSave={saveInstance}
          onClose={closeComposer}
        />
      )}

      {addViewOpen && (
        <AddDashboardViewDialog
          store={viewsStore}
          onSave={(next) => {
            const view = getActiveView(next);
            persistViews(next);
            setSavedLayout(cloneLayout(view.layout));
          }}
          onClose={() => setAddViewOpen(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              type: "action",
              label: "编辑当前视图",
              onClick: () => startEdit(),
            },
            {
              type: "action",
              label: "新增视图",
              onClick: () => setAddViewOpen(true),
            },
            ...(editing
              ? [
                  { type: "separator" as const },
                  {
                    type: "action" as const,
                    label: "完成编辑",
                    onClick: () => finishEdit(),
                  },
                  {
                    type: "action" as const,
                    label: "取消编辑",
                    onClick: () => cancelEdit(),
                  },
                ]
              : []),
          ]}
        />
      )}
    </div>
  );
}
