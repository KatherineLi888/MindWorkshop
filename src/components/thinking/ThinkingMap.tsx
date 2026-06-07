"use client";

import { useMemo, useState } from "react";
import { ContextMenu } from "@/app/canvas/ContextMenu";
import {
  graphViewportSize,
  layoutThoughtNodes,
  thoughtEdgePath,
  type NodeLayout,
} from "@/lib/thinking/layout";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import {
  EMPHASIS_PRESETS,
  THINK_EDGE,
  resolveNodeAppearance,
  type ThoughtNodeEmphasis,
} from "@/lib/thinking/node-appearance";
import { nodeCenterY } from "@/lib/thinking/node-metrics";
import type { ThoughtNode } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

type Props = {
  nodes: ThoughtNode[];
  rootId: string;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onSetEmphasis?: (
    nodeId: string,
    emphasis: ThoughtNodeEmphasis | undefined
  ) => void;
  siblingGap?: number;
  embedded?: boolean;
  onPanStart?: (e: React.PointerEvent) => void;
  onPanMove?: (e: React.PointerEvent) => void;
  onPanEnd?: (e: React.PointerEvent) => void;
};

function edgePoint(
  layout: NodeLayout,
  node: ThoughtNode,
  side: "right" | "left"
) {
  const cy = nodeCenterY(layout.y, node);
  return side === "right"
    ? { x: layout.x + layout.w, y: cy }
    : { x: layout.x, y: cy };
}

function VerticalMethodLabel({
  label,
  color,
  fontFamily,
}: {
  label: string;
  color: string;
  fontFamily: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-0.5 py-2">
      {label.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          className="text-[14px] font-bold leading-none"
          style={{ color, fontFamily }}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export function ThinkingMap({
  nodes,
  rootId,
  selectedIds,
  onSelect,
  onSetEmphasis,
  siblingGap,
  embedded,
  onPanStart,
  onPanMove,
  onPanEnd,
}: Props) {
  const { getMethod } = useThinkingMethods();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  const pos = useMemo(
    () => layoutThoughtNodes(nodes, rootId, { siblingGap }),
    [nodes, rootId, siblingGap]
  );
  const byId = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes]
  );
  const { w, h } = useMemo(() => graphViewportSize(pos), [pos]);

  const edges = useMemo(() => {
    const list: { from: string; to: string }[] = [];
    for (const n of nodes) {
      for (const p of n.parentIds) {
        list.push({ from: p, to: n.id });
      }
    }
    return list;
  }, [nodes]);

  const handleNodePointer = (
    e: React.PointerEvent,
    nodeId: string
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    onSelect(nodeId, e.metaKey || e.ctrlKey);
  };

  const handleNodeContextMenu = (
    e: React.MouseEvent,
    nodeId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(nodeId, false);
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const contextNode = contextMenu
    ? byId.get(contextMenu.nodeId)
    : undefined;

  return (
    <div
      className={cn(
        !embedded && "overflow-auto rounded-xl border border-[#E8ECF0] bg-[#FAFBFC]"
      )}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="block"
        role="img"
        aria-label="思路脉络图"
        style={{ pointerEvents: "none" }}
      >
        <g style={{ pointerEvents: "auto" }}>
          <rect
            width={w}
            height={h}
            fill="transparent"
            style={{ cursor: "grab" }}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
            onPointerCancel={onPanEnd}
          />
          {edges.map((e) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            const na = byId.get(e.from);
            const nb = byId.get(e.to);
            if (!a || !b || !na || !nb) return null;
            const p1 = edgePoint(a, na, "right");
            const p2 = edgePoint(b, nb, "left");
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={thoughtEdgePath(p1.x, p1.y, p2.x, p2.y)}
                fill="none"
                stroke={THINK_EDGE}
                strokeWidth={1.5}
                strokeOpacity={0.9}
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {nodes.map((node) => {
            const layout = pos.get(node.id);
            if (!layout) return null;
            const selected = selectedIds.has(node.id);
            const appearance = resolveNodeAppearance(node, getMethod);
            const rail = appearance.methodRail;
            const railW = rail?.width ?? 0;
            const pad = appearance.isTopic || appearance.isMethodQuestion ? 8 : 6;
            const rx = appearance.isTopic ? 12 : appearance.isMethodQuestion ? 10 : 8;

            return (
              <g
                key={node.id}
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onPointerDown={(ev) => handleNodePointer(ev, node.id)}
                onContextMenu={(ev) => handleNodeContextMenu(ev, node.id)}
              >
                <rect
                  x={layout.x - pad}
                  y={layout.y - pad}
                  width={layout.w + pad * 2}
                  height={layout.h + pad * 2}
                  fill="transparent"
                />
                <rect
                  x={layout.x}
                  y={layout.y}
                  width={layout.w}
                  height={layout.h}
                  rx={rx}
                  fill={rail ? rail.contentBg : appearance.fill}
                  stroke={selected ? "#3B82F6" : appearance.stroke}
                  strokeWidth={selected ? 2.5 : appearance.strokeWidth}
                />
                {rail && (
                  <>
                    <rect
                      x={layout.x + 1}
                      y={layout.y + 1}
                      width={railW}
                      height={layout.h - 2}
                      rx={rx - 1}
                      fill={rail.railBg}
                      style={{ pointerEvents: "none" }}
                    />
                    <line
                      x1={layout.x + railW + 1}
                      y1={layout.y + 8}
                      x2={layout.x + railW + 1}
                      y2={layout.y + layout.h - 8}
                      stroke={rail.color}
                      strokeWidth={1}
                      strokeOpacity={0.35}
                      style={{ pointerEvents: "none" }}
                    />
                    <foreignObject
                      x={layout.x + 1}
                      y={layout.y + 1}
                      width={railW}
                      height={layout.h - 2}
                      style={{ pointerEvents: "none" }}
                    >
                      <div xmlns="http://www.w3.org/1999/xhtml" className="h-full">
                        <VerticalMethodLabel
                          label={rail.label}
                          color={rail.color}
                          fontFamily={appearance.fontFamily}
                        />
                      </div>
                    </foreignObject>
                  </>
                )}
                {node.marksProgress && (
                  <circle
                    cx={layout.x + layout.w - 10}
                    cy={layout.y + 10}
                    r={4}
                    fill="#6EE7B7"
                  />
                )}
                <foreignObject
                  x={layout.x + railW + 2}
                  y={layout.y + 2}
                  width={layout.w - railW - 4}
                  height={layout.h - 4}
                  style={{ pointerEvents: "none" }}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className="flex h-full flex-col px-2 py-1.5"
                    style={{
                      fontFamily: appearance.fontFamily,
                      color: appearance.text,
                      fontSize: appearance.fontSize,
                      fontWeight: appearance.fontWeight,
                      lineHeight: appearance.isTopic ? 1.4 : 1.35,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {appearance.showBadge && appearance.badge && (
                      <span className="mb-0.5 text-[9px] font-semibold leading-none text-slate-500">
                        {appearance.badge}
                      </span>
                    )}
                    <span className="flex-1 whitespace-pre-wrap">
                      {node.content.trim() || "（空）"}
                    </span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {contextMenu && contextNode && onSetEmphasis && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            ...EMPHASIS_PRESETS.map((preset) => ({
              type: "action" as const,
              label: preset.label,
              onClick: () =>
                onSetEmphasis(
                  contextMenu.nodeId,
                  preset.id === "none"
                    ? undefined
                    : (preset.id as ThoughtNodeEmphasis)
                ),
            })),
          ]}
        />
      )}

      {!embedded && (
        <p className="border-t border-[#EEF1F5] px-3 py-2 text-[10px] text-slate-400">
          从左到右推进 · 绿点=产生推进
          {" · 右键节点可设强调色"}
          {" · Ctrl+点击多选合并"}
        </p>
      )}
    </div>
  );
}
