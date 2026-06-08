"use client";

import { seedOriginLabel, seedOriginStampStyle } from "@/lib/seeds/origin";
import type { IdeaSeed } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

type Props = {
  seed: IdeaSeed;
  className?: string;
};

/** 印章式来源标签 */
export function SeedOriginStamp({ seed, className }: Props) {
  const label = seedOriginLabel(seed);
  const style = seedOriginStampStyle(seed);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded border px-1.5 py-0.5",
        "text-[9px] font-medium ring-1",
        style.bg,
        style.text,
        style.ring,
        className
      )}
      title={`起自${label}`}
    >
      <span className="opacity-70" aria-hidden>
        ◈
      </span>
      {label}
    </span>
  );
}
