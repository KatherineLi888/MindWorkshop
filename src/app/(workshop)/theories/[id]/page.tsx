import { Suspense } from "react";
import { TheoryDetailClient } from "@/components/theories/TheoryDetailClient";
import { TheoriesProvider } from "@/components/theories/TheoriesContext";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TheoryDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <TheoriesProvider>
      <Suspense fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}>
        <TheoryDetailClient theoryId={id} />
      </Suspense>
    </TheoriesProvider>
  );
}
