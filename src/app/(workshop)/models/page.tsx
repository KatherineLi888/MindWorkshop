import { Suspense } from "react";
import { ModelsClient } from "@/components/models/ModelsClient";
import { ModelsProvider } from "@/components/models/ModelsContext";

export default function ModelsPage() {
  return (
    <ModelsProvider>
      <Suspense
        fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}
      >
        <ModelsClient />
      </Suspense>
    </ModelsProvider>
  );
}
