import { Suspense } from "react";
import { ArchiveHub } from "@/components/archive/ArchiveHub";

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-400">加载归档箱…</div>
      }
    >
      <ArchiveHub />
    </Suspense>
  );
}
