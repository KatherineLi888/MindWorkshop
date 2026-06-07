"use client";

import { useMemo, useState } from "react";
import { getLibraryModels } from "@/lib/models/canvas-bridge";
import { MODEL_KIND_LABELS } from "@/lib/models/types";
import type { CanvasModelPanelCorner, CanvasModelPanelMode } from "./types";

type Props = {
  open: boolean;
  title?: string;
  showCorner?: boolean;
  showMode?: boolean;
  onCancel: () => void;
  onConfirm: (opts: {
    libraryModelId: string;
    modelName: string;
    corner: CanvasModelPanelCorner;
    mode: CanvasModelPanelMode;
  }) => void;
};

const CORNERS: { id: CanvasModelPanelCorner; label: string }[] = [
  { id: "top-left", label: "左上角" },
  { id: "top-right", label: "右上角" },
  { id: "bottom-left", label: "左下角" },
  { id: "bottom-right", label: "右下角" },
];

export function PickModelDialog({
  open,
  title = "选择思维模型",
  showCorner = false,
  showMode = true,
  onCancel,
  onConfirm,
}: Props) {
  const models = useMemo(() => getLibraryModels(), [open]);
  const [selectedId, setSelectedId] = useState(models[0]?.id ?? "");
  const [corner, setCorner] = useState<CanvasModelPanelCorner>("top-right");
  const [mode, setMode] = useState<CanvasModelPanelMode>("apply");

  if (!open) return null;

  const selected = models.find((m) => m.id === selectedId) ?? models[0];

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
            从模型库选取，可套用填写或仅作展示参考
          </p>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {models.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`mb-1 w-full rounded-lg px-3 py-2 text-left ${
                  m.id === selectedId
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "hover:bg-[#FAFBFC] text-slate-700"
                }`}
              >
                <p className="text-xs font-medium">{m.name}</p>
                <p className="text-[10px] text-slate-400">
                  {MODEL_KIND_LABELS[m.kind]}
                  {m.description ? ` · ${m.description}` : ""}
                </p>
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-[#EEF1F5] px-4 py-3">
          {showMode && (
            <div>
              <p className="text-[10px] text-slate-500">使用方式</p>
              <div className="mt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setMode("apply")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] ${
                    mode === "apply"
                      ? "bg-[#EEF2FF] text-[#4338CA]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  套用（可填写）
                </button>
                <button
                  type="button"
                  onClick={() => setMode("display")}
                  className={`rounded-lg px-2.5 py-1 text-[10px] ${
                    mode === "display"
                      ? "bg-[#EEF2FF] text-[#4338CA]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  仅展示
                </button>
              </div>
            </div>
          )}
          {showCorner && (
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
                  libraryModelId: selected.id,
                  modelName: selected.name,
                  corner,
                  mode,
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
