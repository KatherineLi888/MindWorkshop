import { Suspense } from "react";
import { InboxClient } from "@/components/inbox/InboxClient";

export default function InboxPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-slate-400">加载中…</div>}
    >
      <InboxClient />
    </Suspense>
  );
}
