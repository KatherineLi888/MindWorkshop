"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModelApplyCanvas } from "@/components/models/ModelApplyCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { emptySlotValues } from "@/lib/models/helpers";
import { MODEL_KIND_LABELS, type StoredModel } from "@/lib/models/types";
import { useModels } from "./ModelsContext";

type Props = {
  model: StoredModel;
};

export function ModelApplyWorkspace({ model }: Props) {
  const router = useRouter();
  const { createAndSaveApplication } = useModels();
  const [scenario, setScenario] = useState("");
  const [note, setNote] = useState("");
  const [values, setValues] = useState(() => emptySlotValues(model.config));
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!scenario.trim()) return;
    createAndSaveApplication({
      modelId: model.id,
      modelName: model.name,
      kind: model.kind,
      scenario: scenario.trim(),
      note: note.trim(),
      values,
      configSnapshot: model.config,
    });
    setSaved(true);
    setTimeout(() => {
      router.push("/models");
    }, 600);
  };

  const updateSlot = (slotId: string, value: string) => {
    setValues((prev) => ({ ...prev, [slotId]: value }));
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden p-4 lg:p-6">
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link href="/models">
          <Button variant="ghost" size="sm">
            ← 返回
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-slate-900">
            套用：{model.name}
          </h1>
          <p className="text-xs text-slate-500">
            {MODEL_KIND_LABELS[model.kind]}
            {model.description ? ` · ${model.description}` : ""}
          </p>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={save}
          disabled={!scenario.trim()}
        >
          保存套用记录
        </Button>
        {saved && <span className="text-xs text-green-600">已保存</span>}
      </div>

      <Card className="mt-3 shrink-0 bg-white p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[12rem] flex-1 text-xs font-medium text-slate-600">
            本次场景 *
            <Input
              className="mt-0.5 text-sm"
              placeholder="例如：本周待办优先级梳理"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
            />
          </label>
          <label className="min-w-[10rem] flex-1 text-xs text-slate-500">
            备注
            <Input
              className="mt-0.5 text-xs"
              placeholder="可选"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
      </Card>

      <div className="mt-3 min-h-0 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 md:p-4">
        <ModelApplyCanvas
          tier="full"
          config={model.config}
          values={values}
          onChange={updateSlot}
        />
      </div>
    </div>
  );
}
