"use client";

import { Suspense } from "react";
import { ModelNewForm } from "@/components/models/ModelNewForm";
import { ModelsProvider } from "@/components/models/ModelsContext";

export default function NewModelPage() {
  return (
    <ModelsProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">加载中…</div>}>
        <ModelNewForm />
      </Suspense>
    </ModelsProvider>
  );
}
