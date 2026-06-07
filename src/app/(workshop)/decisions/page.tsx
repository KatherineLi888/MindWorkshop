import { Suspense } from "react";
import { DecisionsClient } from "@/components/decision/DecisionsClient";

export default function DecisionsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}
    >
      <DecisionsClient />
    </Suspense>
  );
}
