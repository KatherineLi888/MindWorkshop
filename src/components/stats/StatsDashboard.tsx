"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardEditBar } from "@/components/stats/DashboardEditBar";
import { DashboardGrid } from "@/components/stats/DashboardGrid";
import { DashboardViewSwitcher } from "@/components/stats/DashboardViewSwitcher";
import { WidgetComposer } from "@/components/stats/WidgetComposer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { Button } from "@/components/ui/button";
import { AUTH_ENABLED } from "@/lib/config";
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
  viewTimeLabel,
  viewTimeScope,
  type DashboardViewsStore,
} from "@/lib/stats/dashboard-views";
import {
  autoPlaceInstances,
  compactEmptyRows,
  insertInstanceAt,
  type GridAnchor,
} from "@/lib/stats/grid-layout";

export function StatsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [viewsStore, setViewsStore] = useState<DashboardViewsStore>(() =>
    loadDashboardViews()
  );
  const activeView = useMemo(
    () => getActiveView(viewsStore),
    [viewsStore]
  );
  const [savedLayout, setSavedLayout] = useState<DashboardLayout>(() =>
    cloneLayout(activeView.layout)
  );
  const [draftLayout, setDraftLayout] = useState<DashboardLayout | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState<WidgetInstance | null>(
    null
  );
  const [addAnchor, setAddAnchor] = useState<GridAnchor | null>(null);

  const viewScope = useMemo(
    () => viewTimeScope(activeView),
    [activeView]
  );

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
    const withLayout = layout
      ? updateActiveViewLayout(next, layout)
      : next;
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

  const exportRows = useMemo(() => {
    if (!stats) return [];
    return [
      { 指标: "进行中决策", 数值: stats.kpis.decisions },
      { 指标: "推进中目标", 数值: stats.kpis.activeGoals },
      { 指标: "思考会话", 数值: stats.kpis.thinkingSessions },
      { 指标: "模型套用", 数值: stats.kpis.modelApplies },
      { 指标: "画布文档", 数值: stats.kpis.canvasDocs },
      { 指标: "图谱节点", 数值: stats.kpis.graphNodes },
      { 指标: "收集箱", 数值: stats.kpis.inboxItems },
      ...stats.goalProgress.map((g) => ({
        指标: `目标·${g.name}`,
        数值: `${g.progress}%`,
      })),
    ];
  }, [stats]);

  const startEdit = () => {
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

  const openAddAt = (anchor: GridAnchor) => {
    setEditingInstance(null);
    setAddAnchor(anchor);
    setComposerOpen(true);
  };

  const openEdit = (instance: WidgetInstance) => {
    setEditingInstance(instance);
    setAddAnchor(null);
    setComposerOpen(true);
  };

  const saveInstance = (instance: WidgetInstance) => {
    if (!draftLayout) return;
    const idx = draftLayout.instances.findIndex(
      (i) => i.instanceId === instance.instanceId
    );
    if (idx >= 0) {
      const instances = [...draftLayout.instances];
      instances[idx] = instance;
      setDraftLayout({ instances });
      return;
    }
    if (addAnchor) {
      const next = insertInstanceAt(
        draftLayout.instances,
        instance,
        addAnchor
      );
      if (next) setDraftLayout({ instances: next });
    }
  };

  const removeInstance = (instanceId: string) => {
    if (!draftLayout) return;
    setDraftLayout({
      instances: compactEmptyRows(
        draftLayout.instances.filter((i) => i.instanceId !== instanceId)
      ),
    });
  };

  if (loading || !stats) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-sm text-slate-400">加载统计数据…</p>
      </div>
    );
  }

  const hasVisible = placedInstances.length > 0;

  return (
    <div
      className={`mx-auto max-w-7xl space-y-6 p-4 lg:p-6 ${editing ? "pb-36 md:pb-28" : ""}`}
    >
      <PageHeader
        title="统计仪表盘"
        description={
          editing
            ? `正在编辑「${activeView.label}」· 点格子「+」添加组件`
            : `${activeView.label} · ${viewTimeLabel(activeView)} · ${placedInstances.length} 个组件${!AUTH_ENABLED ? "（本地模式）" : ""}`
        }
        actions={
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Link
              href="/home/funnel"
              className="text-xs text-[#3B82F6] hover:underline"
            >
              流程漏斗 →
            </Link>
            <DashboardViewSwitcher
              store={viewsStore}
              disabled={editing}
              onChange={handleSwitchView}
            />
            {editing ? (
              <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-medium text-[#1D4ED8]">
                编辑中
              </span>
            ) : (
              <>
                <Button size="sm" variant="secondary" onClick={startEdit}>
                  编辑组件
                </Button>
                <ExportExcelButton
                  rows={exportRows}
                  fileName={`stats-${activeView.id}.xlsx`}
                />
              </>
            )}
          </div>
        }
      />

      {!hasVisible && !editing ? (
        <div className="rounded-xl border border-dashed border-[#E2E8F0] py-20 text-center">
          <p className="text-sm text-slate-500">
            「{activeView.label}」还没有组件
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="primary"
            onClick={startEdit}
          >
            开始布置
          </Button>
        </div>
      ) : (
        <DashboardGrid
          instances={placedInstances}
          stats={stats}
          editing={editing}
          viewScope={viewScope}
          onAddAt={openAddAt}
          onEdit={openEdit}
          onRemove={removeInstance}
          onMove={(instances) => {
            if (draftLayout) setDraftLayout({ instances });
          }}
        />
      )}

      {editing && draftLayout && (
        <DashboardEditBar
          onReset={() =>
            setDraftLayout(cloneLayout(getActiveView(viewsStore).layout))
          }
          onCancel={cancelEdit}
          onDone={finishEdit}
        />
      )}

      {composerOpen && stats && draftLayout && (
        <WidgetComposer
          stats={stats}
          initial={editingInstance}
          anchor={addAnchor}
          layoutInstances={draftLayout.instances}
          viewScope={viewScope}
          onSave={saveInstance}
          onClose={closeComposer}
        />
      )}
    </div>
  );
}
