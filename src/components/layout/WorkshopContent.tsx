"use client";

import { BackNavButton } from "@/components/layout/BackNavButton";

export function WorkshopContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="hidden shrink-0 border-b border-[#F1F5F9] bg-[#FAFBFC]/80 px-4 py-2 md:block">
        <BackNavButton />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
