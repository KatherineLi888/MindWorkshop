"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ModelApplicationFlowRow } from "@/components/models/ModelApplicationFlowRow";
import { useModels } from "@/components/models/ModelsContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MODEL_KIND_LABELS } from "@/lib/models/types";

export function ModelsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const triageId = searchParams.get("triage");
  const triageTitle = searchParams.get("title");
  const { models, applications, deleteApplication } = useModels();
  const [selectedModelId, setSelectedModelId] = useState(models[0]?.id ?? "");

  const startApply = () => {
    if (!selectedModelId) return;
    router.push(`/models/apply?model=${selectedModelId}`);
  };

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <PageHeader
        title="思维模型"
        description="选择模型进行套用，记录会展示在下方。待验证的洞察请先入「理论库」。"
        subModule={{ label: "理论库", href: "/theories" }}
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      {triageTitle && (
        <p className="text-xs text-slate-500">
          梳理主题：<span className="font-medium text-slate-700">{triageTitle}</span>
        </p>
      )}

      <Card className="bg-white">
        <p className="text-xs font-medium text-slate-600">开始套用</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className="min-w-[200px] flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#6366F1]"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{MODEL_KIND_LABELS[m.kind]}）
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            onClick={startApply}
            disabled={!selectedModelId}
          >
            开始套用
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-medium text-slate-800">套用记录</h2>
        {applications.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            还没有套用记录，选一个模型开始吧
          </p>
        ) : (
          <ul className="space-y-3">
            {applications.map((app) => (
              <li key={app.id}>
                <ModelApplicationFlowRow
                  application={app}
                  onDelete={() => deleteApplication(app.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
