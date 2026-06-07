"use client";

import { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "reactflow";
import type { EdgeLabelData } from "./types";

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  selected,
}: EdgeProps<EdgeLabelData>) {
  const { setEdges } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? "");

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const saveLabel = () => {
    setEdges((edges) =>
      edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, label: draft } } : e
      )
    );
    setEditing(false);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
        }}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 12}px)`,
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setDraft(data?.label ?? "");
            setEditing(true);
          }}
        >
          {editing ? (
            <input
              autoFocus
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs shadow-sm outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => e.key === "Enter" && saveLabel()}
            />
          ) : (
            data?.label && (
              <span className="rounded bg-white/90 px-1.5 py-0.5 text-xs text-slate-600 shadow-sm">
                {data.label}
              </span>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
