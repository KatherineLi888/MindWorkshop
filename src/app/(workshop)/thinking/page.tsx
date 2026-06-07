import { Suspense } from "react";
import { ThinkingClient } from "@/components/thinking/ThinkingClient";
import { ThinkingMethodsProvider } from "@/components/thinking/ThinkingMethodsContext";

export default function ThinkingPage() {
  return (
    <ThinkingMethodsProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}>
        <ThinkingClient />
      </Suspense>
    </ThinkingMethodsProvider>
  );
}
