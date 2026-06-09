"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import { renderWidgetView } from "@/components/stats/StatsWidgets";
import type { DashboardStats } from "@/lib/stats/aggregate";
import type { WidgetInstance } from "@/lib/stats/dashboard-config";
import {
  buildGridCells,
  compactEmptyRows,
  gridItemStyle,
  maxOccupiedRow,
  moveWidgetTo,
  sizeToSpan,
  type GridAnchor,
} from "@/lib/stats/grid-layout";
import type { ViewTimeScope } from "@/lib/stats/dashboard-views";
import { DashboardWidgetFrame } from "@/components/stats/DashboardWidgetFrame";
import { STATS_HOME } from "@/lib/navigation/return-to";
import { buildWidgetView } from "@/lib/stats/widget-query";
import { useDashboardCollapse } from "@/lib/stats/use-dashboard-collapse";
import { cn } from "@/lib/utils";

const LONG_PRESS_MS = 480;

function WidgetGridCell({
  instance,
  stats,
  viewScope,
  editing,
  isMoving,
  onContextMenu,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  children,
}: {
  instance: WidgetInstance;
  stats: DashboardStats;
  viewScope?: ViewTimeScope | null;
  editing: boolean;
  isMoving: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  onPointerCancel?: () => void;
  children?: React.ReactNode;
}) {
  const sectionId = `widget-${instance.instanceId}`;
  const { collapsed } = useDashboardCollapse(sectionId);
  const view = buildWidgetView(instance, stats, viewScope);
  const { rowSpan } = sizeToSpan(instance.size);

  return (
    <div
      style={{
        ...gridItemStyle(
          instance.row,
          instance.col,
          instance.size,
          collapsed
        ),
        minHeight: collapsed ? undefined : `${rowSpan * 7.5}rem`,
      }}
      className={cn(
        "relative",
        collapsed && "self-start",
        isMoving && "z-20 ring-2 ring-amber-400 ring-offset-2",
        editing && !collapsed && "ring-1 ring-[#BFDBFE]/60"
      )}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onPointerCancel={onPointerCancel}
    >
      {editing && !collapsed && (
        <p className="pointer-events-none absolute bottom-1 left-2 text-[9px] text-slate-400">
          右键编辑 · 长按拖动
        </p>
      )}
      <DashboardWidgetFrame sectionId={sectionId} title={view.title}>
        {renderWidgetView(instance, view, {
          interactive: !editing,
          dense: instance.size === "1x1",
          returnTo: STATS_HOME,
        })}
      </DashboardWidgetFrame>
      {children}
    </div>
  );
}

type Props = {
  instances: WidgetInstance[];
  stats: DashboardStats;
  editing: boolean;
  onAddAt: (anchor: GridAnchor) => void;
  onEdit: (instance: WidgetInstance) => void;
  onRemove: (instanceId: string) => void;
  onMove: (instances: WidgetInstance[]) => void;
  onEnterEditMode?: () => void;
  viewScope?: ViewTimeScope | null;
};

export function DashboardGrid({
  instances,
  stats,
  editing,
  onAddAt,
  onEdit,
  onRemove,
  onMove,
  onEnterEditMode,
  viewScope,
}: Props) {
  const placed = useMemo(
    () => compactEmptyRows(instances),
    [instances]
  );
  const cells = useMemo(
    () => buildGridCells(placed, editing),
    [placed, editing]
  );
  const [movingId, setMovingId] = useState<string | null>(null);
  const [widgetMenu, setWidgetMenu] = useState<{
    x: number;
    y: number;
    instance: WidgetInstance;
  } | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clearPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  const handleSlotClick = (anchor: GridAnchor) => {
    if (movingId) {
      const next = moveWidgetTo(placed, movingId, anchor);
      if (next) onMove(next);
      setMovingId(null);
      return;
    }
    onAddAt(anchor);
  };

  const startLongPress = (instanceId: string) => {
    clearPress();
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setMovingId(instanceId);
    }, LONG_PRESS_MS);
  };

  const totalRows = useMemo(() => {
    const contentRows = maxOccupiedRow(placed);
    if (!editing) return Math.max(contentRows, 1);
    let slotMax = contentRows;
    for (const cell of cells) {
      if (cell.kind === "slot") slotMax = Math.max(slotMax, cell.row + 1);
    }
    return Math.max(slotMax, 2);
  }, [placed, cells, editing]);

  return (
    <div className="space-y-2">
      {editing && movingId && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
          移动模式：点击空白格放置组件，或点「取消移动」
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setMovingId(null)}
          >
            取消移动
          </button>
        </p>
      )}

      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3 ${
          editing ? "rounded-2xl bg-slate-100/70 p-3" : ""
        }`}
        style={{
          gridAutoRows: "minmax(2.25rem, auto)",
          gridTemplateRows: `repeat(${totalRows}, minmax(2.25rem, auto))`,
        }}
      >
        {cells.map((cell) => {
          if (cell.kind === "slot") {
            const highlight = !!movingId;
            return (
              <button
                key={`slot-${cell.row}-${cell.col}`}
                type="button"
                onClick={() => handleSlotClick({ row: cell.row, col: cell.col })}
                style={gridItemStyle(cell.row, cell.col, "1x1")}
                className={`flex min-h-[7.5rem] flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                  highlight
                    ? "border-amber-400 bg-amber-50/80 text-amber-600"
                    : "border-[#CBD5E1] bg-white/90 text-slate-400 hover:border-[#3B82F6] hover:bg-blue-50/50 hover:text-[#3B82F6]"
                }`}
              >
                <span className="text-3xl font-light leading-none">+</span>
                <span className="mt-1.5 text-[10px]">添加组件</span>
              </button>
            );
          }

          const { instance } = cell;
          const isMoving = movingId === instance.instanceId;

          return (
            <WidgetGridCell
              key={instance.instanceId}
              instance={instance}
              stats={stats}
              viewScope={viewScope}
              editing={editing}
              isMoving={isMoving}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWidgetMenu({
                  x: e.clientX,
                  y: e.clientY,
                  instance,
                });
              }}
              onPointerDown={
                editing
                  ? () => startLongPress(instance.instanceId)
                  : undefined
              }
              onPointerUp={editing ? clearPress : undefined}
              onPointerLeave={editing ? clearPress : undefined}
              onPointerCancel={editing ? clearPress : undefined}
            />
          );
        })}
      </div>

      {widgetMenu && (
        <ContextMenu
          x={widgetMenu.x}
          y={widgetMenu.y}
          onClose={() => setWidgetMenu(null)}
          items={[
            {
              type: "action",
              label: "编辑组件",
              onClick: () => {
                if (!editing) onEdit(widgetMenu.instance);
                else onEdit(widgetMenu.instance);
              },
            },
            ...(editing
              ? [
                  {
                    type: "action" as const,
                    label: "删除组件",
                    danger: true,
                    onClick: () => onRemove(widgetMenu.instance.instanceId),
                  },
                ]
              : [
                  {
                    type: "action" as const,
                    label: "编辑当前视图",
                    onClick: () => onEnterEditMode?.(),
                  },
                  {
                    type: "action" as const,
                    label: "编辑组件",
                    onClick: () => onEdit(widgetMenu.instance),
                  },
                ]),
          ]}
        />
      )}
    </div>
  );
}
