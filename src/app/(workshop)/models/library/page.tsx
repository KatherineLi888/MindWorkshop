import { Suspense } from "react";
import { ModelsLibraryManager } from "@/components/models/ModelsLibraryManager";
import { ModelsProvider } from "@/components/models/ModelsContext";

export default function ModelsLibraryPage() {
  return (
    <ModelsProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">加载中…</div>}>
        <ModelsLibraryManager />
      </Suspense>
    </ModelsProvider>
  );
}
