import { Suspense } from "react";
import { TheoriesClient } from "@/components/theories/TheoriesClient";
import { TheoriesProvider } from "@/components/theories/TheoriesContext";

export default function TheoriesPage() {
  return (
    <TheoriesProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}>
        <TheoriesClient />
      </Suspense>
    </TheoriesProvider>
  );
}
