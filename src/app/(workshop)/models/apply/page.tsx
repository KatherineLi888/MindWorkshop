"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { ModelApplyWorkspace } from "@/components/models/ModelApplyWorkspace";
import { ModelsProvider, useModels } from "@/components/models/ModelsContext";
import { Button } from "@/components/ui/button";

function ApplyContent() {
  const params = useSearchParams();
  const modelId = params.get("model");
  const { getModel } = useModels();

  if (!modelId) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">请从模型列表选择要套用的模型。</p>
        <Link href="/models">
          <Button className="mt-2" size="sm" variant="ghost">
            返回
          </Button>
        </Link>
      </div>
    );
  }

  const model = getModel(modelId);
  if (!model) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">未找到该模型。</p>
        <Link href="/models">
          <Button className="mt-2" size="sm" variant="ghost">
            返回
          </Button>
        </Link>
      </div>
    );
  }

  return <ModelApplyWorkspace model={model} />;
}

export default function ApplyModelPage() {
  return (
    <ModelsProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">加载中…</div>}>
        <ApplyContent />
      </Suspense>
    </ModelsProvider>
  );
}
