"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ModelApplyCanvas } from "@/components/models/ModelApplyCanvas";
import { ModelPreview } from "@/components/models/ModelPreview";
import { resolveLibraryModel } from "@/lib/models/canvas-bridge";
import { getApplicationsForModel } from "@/lib/models/application-store";
import type { CanvasModelPanel, CanvasModelPanelCorner } from "./types";

const CORNER_CLASS: Record<CanvasModelPanelCorner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

type PanelView = "edit" | "display" | "records";

type Props = {
  panel: CanvasModelPanel;
  onChange: (panel: CanvasModelPanel) => void;
  onRemove: () => void;
};

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded px-2 py-0.5 text-[10px] ${
        active
          ? "bg-[#EEF2FF] font-medium text-[#4338CA]"
          : "text-slate-500 hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export function CanvasModelPanelWidget({ panel, onChange, onRemove }: Props) {
  const model = resolveLibraryModel(panel.libraryModelId);
  const [view, setView] = useState<PanelView>(
    panel.mode === "display" ? "display" : "edit"
  );

  const records = useMemo(
    () => (model ? getApplicationsForModel(model.id) : []),
    [model]
  );

  if (!model) return null;

  const setViewAndMode = (v: PanelView) => {
    setView(v);
    if (v === "edit") onChange({ ...panel, mode: "apply" });
    if (v === "display") onChange({ ...panel, mode: "display" });
  };

  return (
    <div
      className={`absolute z-20 flex h-[min(58vh,440px)] w-[min(46vw,520px)] min-w-[280px] flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-lg ${CORNER_CLASS[panel.corner]}`}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-[#EEF1F5] bg-slate-50/90 px-2 py-1">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-xs font-semibold text-slate-800">
          {model.name}
        </p>
        <TabBtn active={view === "edit"} onClick={() => setViewAndMode("edit")}>
          编辑
        </TabBtn>
        <TabBtn
          active={view === "display"}
          onClick={() => setViewAndMode("display")}
        >
          展示
        </TabBtn>
        <TabBtn
          active={view === "records"}
          onClick={() => setView("records")}
        >
          记录{records.length > 0 ? ` ${records.length}` : ""}
        </TabBtn>
        <button
          type="button"
          onClick={() => onChange({ ...panel, collapsed: !panel.collapsed })}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-white"
        >
          {panel.collapsed ? "展" : "收"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-red-500 hover:bg-red-50"
        >
          ✕
        </button>
      </div>

      {!panel.collapsed && (
        <div className="min-h-0 flex-1 bg-[#F8FAFC] p-1">
          {view === "edit" && (
            <ModelApplyCanvas
              tier="panel"
              config={model.config}
              values={panel.values}
              onChange={(slotId, value) =>
                onChange({
                  ...panel,
                  values: { ...panel.values, [slotId]: value },
                })
              }
            />
          )}
          {view === "display" && (
            <div className="h-full rounded-lg border border-[#EEF1F5] bg-white p-1">
              <ModelPreview model={model} />
            </div>
          )}
          {view === "records" && (
            <div className="h-full overflow-y-auto p-1.5">
              {records.length === 0 ? (
                <p className="py-6 text-center text-[10px] text-slate-400">
                  暂无记录
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {records.map((rec) => (
                    <li
                      key={rec.id}
                      className="rounded border border-[#EEF1F5] bg-white px-2 py-1.5"
                    >
                      <p className="truncate text-[10px] font-medium text-slate-700">
                        {rec.scenario}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {new Date(rec.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
