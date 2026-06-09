"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BackNavButton } from "@/components/layout/BackNavButton";
import { parseReturnTo } from "@/lib/navigation/return-to";

function ReturnNavBarInner() {
  const searchParams = useSearchParams();
  const returnTo = parseReturnTo(searchParams);
  if (!returnTo) return null;

  return (
    <div className="shrink-0 border-b border-[#F1F5F9] bg-[#FAFBFC]/95 px-4 py-2 backdrop-blur-sm">
      <BackNavButton />
    </div>
  );
}

/** 有 returnTo 时显示返回栏（电脑 + 手机） */
export function ReturnNavBar() {
  return (
    <Suspense fallback={null}>
      <ReturnNavBarInner />
    </Suspense>
  );
}
