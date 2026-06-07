"use client";

import Link from "next/link";
import { getTheoryById } from "@/lib/theories/theory-store";
import { theoryDisplayTitle } from "@/lib/theories/helpers";
import {
  THEORY_STATUS_COLORS,
  THEORY_STATUS_LABELS,
} from "@/lib/theories/labels";
import type { CanvasModelPanelCorner, CanvasTheoryPanel } from "./types";

const CORNER_CLASS: Record<CanvasModelPanelCorner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

type Props = {
  panel: CanvasTheoryPanel;
  onChange: (panel: CanvasTheoryPanel) => void;
  onRemove: () => void;
};

export function CanvasTheoryPanelWidget({ panel, onChange, onRemove }: Props) {
  const theory = getTheoryById(panel.theoryId);
  if (!theory) return null;

  return (
    <div
      className={`absolute z-20 flex max-h-[min(42vh,320px)] w-[min(38vw,360px)] min-w-[240px] flex-col overflow-hidden rounded-xl border border-violet-200 bg-white shadow-lg ${CORNER_CLASS[panel.corner]}`}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-violet-100 bg-violet-50/80 px-2 py-1">
        <span className="text-[10px] text-violet-500">理论</span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
          {theoryDisplayTitle(theory)}
        </p>
        <button
          type="button"
          onClick={() => onChange({ ...panel, collapsed: !panel.collapsed })}
          className="rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-white"
        >
          {panel.collapsed ? "展开" : "折叠"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      {!panel.collapsed && (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${THEORY_STATUS_COLORS[theory.status]}`}
          >
            {THEORY_STATUS_LABELS[theory.status]}
          </span>
          <p className="mt-2 text-xs leading-relaxed text-slate-700">
            {theory.statement}
          </p>
          {theory.steps.length > 0 && (
            <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[11px] text-slate-600">
              {theory.steps.map((s) => (
                <li key={s.id}>{s.content || "…"}</li>
              ))}
            </ol>
          )}
          {theory.applicableWhen && (
            <p className="mt-2 text-[10px] text-slate-500">
              适用：{theory.applicableWhen}
            </p>
          )}
          <Link
            href={`/theories/${theory.id}`}
            className="mt-3 inline-block text-[10px] text-[#4338CA] hover:underline"
          >
            打开理论详情 →
          </Link>
        </div>
      )}
    </div>
  );
}
