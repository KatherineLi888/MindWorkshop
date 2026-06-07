"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ModelApplyCanvas } from "@/components/models/ModelApplyCanvas";
import { ModelPreview } from "@/components/models/ModelPreview";
import { resolveLibraryModel } from "@/lib/models/canvas-bridge";
import {
  createApplication,
  getApplicationsForModel,
  upsertApplication,
} from "@/lib/models/application-store";
import { SaveRecordDialog } from "./SaveRecordDialog";
import { normalizeModelData, type ModelData } from "./types";

type PanelView = "edit" | "display" | "records";

type Props = {
  data: ModelData;
  onChange: (data: ModelData) => void;
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
      className={`rounded px-2 py-0.5 text-xs ${
        active
          ? "bg-[#EEF2FF] font-medium text-[#4338CA]"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export function PaneModel({ data, onChange }: Props) {
  const normalized = useMemo(() => normalizeModelData(data), [data]);
  const model = resolveLibraryModel(normalized.libraryModelId);
  const [view, setView] = useState<PanelView>("edit");
  const [saveOpen, setSaveOpen] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const records = useMemo(
    () => (model ? getApplicationsForModel(model.id) : []),
    [model, savedToast]
  );

  if (!model) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500">未找到关联的模型</p>
      </div>
    );
  }

  const setValues = (slotId: string, value: string) => {
    onChange({
      ...normalized,
      mode: "apply",
      values: { ...normalized.values, [slotId]: value },
    });
  };

  const handleSaveRecord = (scenario: string, note: string) => {
    upsertApplication(
      createApplication({
        modelId: model.id,
        modelName: model.name,
        kind: model.kind,
        scenario,
        note,
        values: normalized.values,
        configSnapshot: model.config,
      })
    );
    setSaveOpen(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#E2E8F0] px-3 py-1.5">
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-medium text-slate-800">
          {model.name}
        </p>
        <TabBtn
          active={view === "edit"}
          onClick={() => {
            setView("edit");
            onChange({ ...normalized, mode: "apply" });
          }}
        >
          编辑
        </TabBtn>
        <TabBtn
          active={view === "display"}
          onClick={() => {
            setView("display");
            onChange({ ...normalized, mode: "display" });
          }}
        >
          展示
        </TabBtn>
        <TabBtn active={view === "records"} onClick={() => setView("records")}>
          记录{records.length > 0 ? ` ${records.length}` : ""}
        </TabBtn>
        {view === "edit" && (
          <button
            type="button"
            onClick={() => setSaveOpen(true)}
            className="shrink-0 rounded bg-blue-500 px-2 py-0.5 text-[10px] text-white hover:bg-blue-600"
          >
            保存
          </button>
        )}
        {savedToast && (
          <span className="text-[10px] text-green-600">已保存</span>
        )}
      </div>

      <div className="min-h-0 flex-1 bg-[#F8FAFC] p-1.5 md:p-2">
        {view === "edit" && (
          <ModelApplyCanvas
            tier="pane"
            config={model.config}
            values={normalized.values}
            onChange={setValues}
          />
        )}
        {view === "display" && (
          <div className="h-full rounded-xl border border-[#EEF1F5] bg-white p-2">
            <ModelPreview model={model} />
          </div>
        )}
        {view === "records" && (
          <div className="h-full overflow-y-auto">
            {records.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                暂无套用记录
              </p>
            ) : (
              <ul className="space-y-2">
                {records.map((rec) => (
                  <li
                    key={rec.id}
                    className="rounded-lg border border-[#E2E8F0] bg-white p-2.5"
                  >
                    <p className="text-sm font-medium text-slate-800">
                      {rec.scenario}
                    </p>
                    {rec.note && (
                      <p className="mt-0.5 text-xs text-slate-500">{rec.note}</p>
                    )}
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(rec.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <SaveRecordDialog
        open={saveOpen}
        frameworkName={model.name}
        onCancel={() => setSaveOpen(false)}
        onConfirm={handleSaveRecord}
      />
    </div>
  );
}
