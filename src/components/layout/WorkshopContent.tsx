"use client";

import { ReturnNavBar } from "@/components/layout/ReturnNavBar";

export function WorkshopContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ReturnNavBar />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
