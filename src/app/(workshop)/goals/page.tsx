import { Suspense } from "react";
import { GoalsClient } from "@/components/goals/GoalsClient";

export default function GoalsPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}
    >
      <GoalsClient />
    </Suspense>
  );
}
