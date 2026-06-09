"use client";

import { usePathname } from "next/navigation";
import { ReturnNavBar } from "@/components/layout/ReturnNavBar";
import { cn } from "@/lib/utils";

export function WorkshopContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullHeight = pathname === "/ai";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        fullHeight && "h-full overflow-hidden"
      )}
    >
      {!fullHeight && <ReturnNavBar />}
      <div
        className={cn(
          "min-h-0 flex-1",
          fullHeight ? "h-full overflow-hidden" : ""
        )}
      >
        {children}
      </div>
    </div>
  );
}
