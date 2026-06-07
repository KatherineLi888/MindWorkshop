"use client";

import { useMemo, useState } from "react";
import { loadTheories } from "@/lib/theories/theory-store";
import { theoryDisplayTitle } from "@/lib/theories/helpers";
import {
  THEORY_INTENT_LABELS,
  THEORY_STATUS_LABELS,
} from "@/lib/theories/labels";
import type { CanvasModelPanelCorner } from "./types";

type Props = {
  open: boolean;
  title?: string;
  showCorner?: boolean;
  onCancel: () => void;
  onConfirm: (opts: { theoryId: string; theoryTitle: string; corner: CanvasModelPanelCorner }) => void;
};

const CORNERS: { id: CanvasModelPanelCorner; label: string }[] = [
  { id: "top-left", label: "左上角" },
  { id: "top-right", label: "右上角" },
  { id: "bottom-left", label: "左下角" },
  { id: "bottom-right", label: "右下角" },
];

export function PickTheoryDialog({
  open,
  title = "引用理论",
  showCorner = false,
  onCancel,
  onConfirm,
}: Props) {
  const theories = useMemo(() => loadTheories(), [open]);
  const [selectedId, setSelectedId] = useState(theories[0]?.id ?? "");
  const [corner, setCorner] = useState<CanvasModelPanelCorner>("bottom-right");

  if (!open) return null;

  const selected = theories.find((t) => t.id === selectedId) ?? theories[0];

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#EEF1F5] px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            从理论库选取，在画布上作为待验证参考
          </p>
        </div>

        {theories.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400">
            理论库为空，请先在「理论」模块收录
          </p>
        ) : (
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {theories.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`mb-1 w-full rounded-lg px-3 py-2 text-left ${
                    t.id === selectedId
                      ? "bg-[#EEF2FF] text-[#4338CA]"
                      : "hover:bg-[#FAFBFC] text-slate-700"
                  }`}
                >
                  <p className="text-xs font-medium">{theoryDisplayTitle(t)}</p>
                  <p className="line-clamp-2 text-[10px] text-slate-400">
                    {THEORY_STATUS_LABELS[t.status]} · {THEORY_INTENT_LABELS[t.intent]}
                    {t.statement ? ` · ${t.statement}` : ""}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t border-[#EEF1F5] px-4 py-3">
          {showCorner && theories.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500">显示位置</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {CORNERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCorner(c.id)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] ${
                      corner === c.id
                        ? "bg-[#EEF2FF] text-[#4338CA]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                onConfirm({
                  theoryId: selected.id,
                  theoryTitle: theoryDisplayTitle(selected),
                  corner,
                });
              }}
              className="rounded-lg bg-[#4338CA] px-3 py-1.5 text-xs text-white hover:bg-[#3730A3] disabled:opacity-50"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
