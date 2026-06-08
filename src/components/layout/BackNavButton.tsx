"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  parseReturnTo,
  returnButtonLabel,
} from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

const btnClass = cn(
  "inline-flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5",
  "text-xs font-medium text-slate-600 transition",
  "hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-slate-800 active:scale-[0.98]"
);

function BackNavInner({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const returnTo = parseReturnTo(searchParams);
  if (!returnTo) return null;

  return (
    <Link href={returnTo} className={cn(btnClass, className)}>
      ← {returnButtonLabel(returnTo)}
    </Link>
  );
}

/** 全局统一：当 URL 含 returnTo 时显示返回按钮 */
export function BackNavButton({ className }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <BackNavInner className={className} />
    </Suspense>
  );
}
