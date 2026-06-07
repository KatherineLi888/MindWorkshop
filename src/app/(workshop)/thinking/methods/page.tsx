import { Suspense } from "react";
import { ThinkingMethodsProvider } from "@/components/thinking/ThinkingMethodsContext";
import { ThinkingMethodsManager } from "@/components/thinking/ThinkingMethodsManager";

export default function ThinkingMethodsPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <ThinkingMethodsProvider>
        <ThinkingMethodsManager />
      </ThinkingMethodsProvider>
    </Suspense>
  );
}