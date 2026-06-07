"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { MarkdownPreview } from "./markdown";
import { TAG_LABELS, type CanvasNodeData } from "./types";
import { getTheoryById } from "@/lib/theories/theory-store";
import { theoryDisplayTitle } from "@/lib/theories/helpers";

type CardNodeProps = NodeProps<CanvasNodeData> & {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function CardNode({
  id,
  data,
  selected,
  onEdit,
  onDelete,
}: CardNodeProps) {
  return (
    <div
      className={`min-h-[80px] min-w-[150px] max-w-[280px] rounded-lg border bg-white px-3 py-2 shadow-sm transition-shadow ${
        selected
          ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/30"
          : "border-[#E2E8F0]"
      }`}
      style={{ backgroundColor: data.color }}
      onDoubleClick={() => onEdit(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (confirm(`删除节点「${data.title}」？`)) onDelete(id);
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-slate-300 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-slate-300 !bg-white"
      />

      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{data.title || "未命名"}</span>
        <span className="shrink-0 rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-slate-500">
          {TAG_LABELS[data.tag]}
        </span>
      </div>

      {!data.collapsed && data.content && (
        <div className="mb-1 max-h-24 overflow-hidden text-xs text-slate-600">
          <MarkdownPreview
            source={
              data.content.length > 400
                ? `${data.content.slice(0, 400)}\n\n…`
                : data.content
            }
          />
        </div>
      )}

      {data.relations.length > 0 && (
        <div className="mt-1 border-t border-black/5 pt-1">
          <p className="text-[10px] text-slate-400">关联到</p>
          <ul className="text-[11px] text-slate-600">
            {data.relations.map((r, i) => (
              <li key={i}>· {r}</li>
            ))}
          </ul>
        </div>
      )}

      {(data.theoryRefs?.length ?? 0) > 0 && (
        <div className="mt-1 border-t border-violet-100 pt-1">
          <p className="text-[10px] text-violet-400">理论</p>
          <ul className="text-[11px] text-violet-700">
            {data.theoryRefs!.map((r) => {
              const t = getTheoryById(r.theoryId);
              return (
                <li key={r.theoryId}>
                  ◈ {r.label || (t ? theoryDisplayTitle(t) : r.theoryId)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
