"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ThinkingMap } from "@/components/thinking/ThinkingMap";
import {
  ThinkingNodeCanvasHud,
  type CanvasHudEditorProps,
} from "@/components/thinking/ThinkingNodeCanvasHud";
import { Button } from "@/components/ui/button";
import {
  computeFitView,
  graphContentBounds,
  graphViewportSize,
  layoutThoughtNodes,
} from "@/lib/thinking/layout";
import {
  THINK_LAYOUT_GAP_MAX,
  THINK_LAYOUT_GAP_MIN,
  loadThinkingLayoutPrefs,
  saveThinkingLayoutPrefs,
  type ThinkingLayoutPrefs,
} from "@/lib/thinking/layout-prefs";
import { nodeCenterY } from "@/lib/thinking/node-metrics";
import { cn } from "@/lib/utils";
import type { ThoughtNodeEmphasis } from "@/lib/thinking/node-appearance";
import type { ThoughtNode } from "@/lib/thinking/types";

type Props = {
  nodes: ThoughtNode[];
  rootId: string;
  childOrder?: Record<string, string[]>;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  className?: string;
  lastFocusedId: string;
  editorHud: Omit<CanvasHudEditorProps, "nodeLayout" | "canAddMethod">;
  onSetEmphasis?: (
    nodeId: string,
    emphasis: ThoughtNodeEmphasis | undefined
  ) => void;
};

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;

export function ThinkingMapViewport({
  nodes,
  rootId,
  childOrder,
  selectedIds,
  onSelect,
  className,
  lastFocusedId,
  editorHud,
  onSetEmphasis,
}: Props) {
  const [layoutPrefs, setLayoutPrefs] = useState<ThinkingLayoutPrefs>(() =>
    loadThinkingLayoutPrefs()
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 0 });
  const [fullscreen, setFullscreen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const pinchStart = useRef<{
    dist: number;
    zoom: number;
  } | null>(null);
  const prevRootId = useRef(rootId);

  const { siblingGap, autoFit } = layoutPrefs;

  const pos = useMemo(
    () =>
      layoutThoughtNodes(nodes, rootId, { siblingGap, childOrder }),
    [nodes, rootId, siblingGap, childOrder]
  );

  const graphSize = useMemo(() => graphViewportSize(pos), [pos]);
  const contentBounds = useMemo(() => graphContentBounds(pos), [pos]);

  const nodesSignature = useMemo(
    () => nodes.map((n) => `${n.id}:${n.parentIds.join("+")}`).join("|"),
    [nodes]
  );

  const { actionNode } = editorHud;
  const anchorId =
    selectedIds.size >= 2
      ? lastFocusedId && selectedIds.has(lastFocusedId)
        ? lastFocusedId
        : [...selectedIds][0]
      : actionNode?.id ?? null;

  const nodeLayout = anchorId ? pos.get(anchorId) ?? null : null;

  const canAddMethod = Boolean(
    actionNode &&
      (actionNode.type === "topic" ||
        actionNode.type === "answer" ||
        actionNode.type === "merge")
  );

  const canvasW = graphSize.w * zoom + 120;
  const canvasH = graphSize.h * zoom + 80;

  const clampZoom = (z: number) =>
    Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const updateLayoutPrefs = useCallback((patch: Partial<ThinkingLayoutPrefs>) => {
    setLayoutPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveThinkingLayoutPrefs(next);
      return next;
    });
  }, []);

  const centerOnSpine = useCallback(
    (z: number) => {
      const el = scrollRef.current;
      if (!el || !rootId) return;
      const layout = pos.get(rootId);
      const root = nodes.find((n) => n.id === rootId);
      if (!root || !layout) return;

      const rootCenterY = nodeCenterY(layout.y, root);
      const graphW = graphSize.w;
      const viewH = el.clientHeight;
      const viewW = el.clientWidth;

      setPan({
        x: Math.max(40, (viewW - graphW * z) / 2),
        y: Math.max(20, viewH / 2 - rootCenterY * z),
      });

      el.scrollLeft = 0;
      el.scrollTop = 0;
    },
    [nodes, rootId, pos, graphSize.w]
  );

  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewW = el.clientWidth;
    const viewH = el.clientHeight;
    if (viewW <= 0 || viewH <= 0) return;

    const { zoom: fitZoom, pan: fitPan } = computeFitView(
      contentBounds,
      viewW,
      viewH,
      { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, padding: 36 }
    );

    setZoom(fitZoom);
    setPan(fitPan);
    el.scrollLeft = 0;
    el.scrollTop = 0;
  }, [contentBounds]);

  const resetView = useCallback(() => {
    setZoom(1);
    requestAnimationFrame(() => centerOnSpine(1));
  }, [centerOnSpine]);

  useEffect(() => {
    const isNewSession = prevRootId.current !== rootId;
    prevRootId.current = rootId;
    requestAnimationFrame(() => {
      if (autoFit || isNewSession) {
        fitToScreen();
      } else {
        centerOnSpine(zoom);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId]);

  useEffect(() => {
    if (!autoFit) return;
    requestAnimationFrame(() => fitToScreen());
  }, [nodesSignature, siblingGap, autoFit, fitToScreen]);

  useEffect(() => {
    if (!autoFit) return;
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => fitToScreen());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [autoFit, fitToScreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  const onWheel = useCallback((e: WheelEvent) => {
    if (!scrollRef.current?.contains(e.target as Node)) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.006;
      setZoom((z) => clampZoom(z * (1 + delta)));
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  const startPan = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-thinking-hud]")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const movePan = (e: React.PointerEvent) => {
    if (!panStart.current) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  };

  const endPan = () => {
    panStart.current = null;
  };

  const touchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStart.current = {
        dist: touchDistance(e.touches),
        zoom,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchStart.current) return;
    e.preventDefault();
    const dist = touchDistance(e.touches);
    if (pinchStart.current.dist < 1) return;
    const ratio = dist / pinchStart.current.dist;
    setZoom(clampZoom(pinchStart.current.zoom * ratio));
  };

  const onTouchEnd = () => {
    pinchStart.current = null;
  };

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-[#EEF1F5] bg-white/90 px-2 py-1.5">
      <Button
        size="sm"
        variant="ghost"
        type="button"
        onClick={() => setZoom((z) => clampZoom(z + 0.15))}
        title="放大"
      >
        +
      </Button>
      <Button
        size="sm"
        variant="ghost"
        type="button"
        onClick={() => setZoom((z) => clampZoom(z - 0.15))}
        title="缩小"
      >
        −
      </Button>
      <span className="min-w-[3rem] text-center text-[10px] tabular-nums text-slate-500">
        {Math.round(zoom * 100)}%
      </span>
      <Button size="sm" variant="ghost" type="button" onClick={resetView}>
        重置
      </Button>
      <Button size="sm" variant="secondary" type="button" onClick={fitToScreen}>
        适应屏幕
      </Button>
      <Button
        size="sm"
        variant="secondary"
        type="button"
        onClick={() => setFullscreen((f) => !f)}
      >
        {fullscreen ? "退出全屏" : "全屏"}
      </Button>

      <div className="ml-1 flex items-center gap-1.5 border-l border-[#EEF1F5] pl-2">
        <label
          htmlFor="think-gap"
          className="shrink-0 text-[10px] text-slate-500"
          title="多分支时兄弟子树之间的垂直间距"
        >
          分支间距
        </label>
        <input
          id="think-gap"
          type="range"
          min={THINK_LAYOUT_GAP_MIN}
          max={THINK_LAYOUT_GAP_MAX}
          step={4}
          value={siblingGap}
          onChange={(e) =>
            updateLayoutPrefs({ siblingGap: Number(e.target.value) })
          }
          className="h-1 w-20 cursor-pointer accent-[#6366F1]"
        />
        <span className="w-7 text-[10px] tabular-nums text-slate-500">
          {siblingGap}
        </span>
      </div>

      <label className="flex cursor-pointer items-center gap-1 text-[10px] text-slate-500">
        <input
          type="checkbox"
          checked={autoFit}
          onChange={(e) => updateLayoutPrefs({ autoFit: e.target.checked })}
          className="rounded border-slate-300"
        />
        自动适应
      </label>

      <span className="ml-auto hidden text-[10px] text-slate-400 lg:inline">
        可左右滑动 · Ctrl+滚轮缩放 · 拖空白平移
      </span>
    </div>
  );

  const scrollCanvas = (
    <div
      ref={scrollRef}
      className={cn(
        "min-h-0 flex-1 overflow-auto bg-[#FAFBFC]",
        className
      )}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="relative"
        style={{
          width: canvasW,
          height: canvasH,
          minWidth: canvasW,
          minHeight: canvasH,
        }}
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <div
          className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{
            width: graphSize.w,
            height: graphSize.h,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <ThinkingMap
            nodes={nodes}
            rootId={rootId}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onSetEmphasis={onSetEmphasis}
            siblingGap={siblingGap}
            embedded
          />
          <div data-thinking-hud className="pointer-events-none absolute inset-0">
            <div className="pointer-events-auto">
              <ThinkingNodeCanvasHud
                {...editorHud}
                nodeLayout={nodeLayout}
                canAddMethod={canAddMethod}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[90] flex flex-col bg-white">
        {toolbar}
        {scrollCanvas}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E8ECF0]">
      {toolbar}
      {scrollCanvas}
    </div>
  );
}
