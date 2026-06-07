import { Suspense } from "react";
import { GraphClient } from "@/components/graph/GraphClient";

export default function GraphPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}
    >
      <GraphClient />
    </Suspense>
  );
}
