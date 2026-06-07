"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type FunnelTier = {
  id: string;
  label: string;
  count: number;
  color: string;
  href?: string;
  /** 从上一层到本层的流失（引线标注在漏斗右侧接缝） */
  seamLoss?: {
    fromLabel: string;
    toLabel: string;
    lossRate: number;
    dropped: number;
  };
};

type Props = {
  tiers: FunnelTier[];
  /** 每层上沿宽度%，首尾定义整体轮廓；层与层在接缝处对齐 */
  widthBounds?: number[];
  layerHeight?: number;
  size?: "main" | "mini";
  className?: string;
};

const DEFAULT_BOUNDS = [100, 76, 54, 32, 16];

/** 漏斗右缘接缝点：外层容器宽度的百分比（漏斗占中间 4/6） */
function seamRightPct(topWidth: number): number {
  return 50 + topWidth / 3;
}

function SeamLossCallout({
  seamLoss,
  top,
  topWidth,
}: {
  seamLoss: NonNullable<FunnelTier["seamLoss"]>;
  top: number;
  topWidth: number;
}) {
  const anchorX = seamRightPct(topWidth);

  return (
    <div
      className="pointer-events-none absolute right-0 z-20 flex -translate-y-1/2 items-center gap-1.5"
      style={{ top, left: `${anchorX}%` }}
      aria-hidden
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500 ring-2 ring-white" />
      <span className="h-px min-w-[10px] flex-1 border-t border-dashed border-amber-300/90" />
      <span className="shrink-0 rounded-md border border-amber-200/80 bg-amber-50/95 px-1.5 py-0.5 text-right leading-tight shadow-sm">
        <span className="block text-[9px] font-medium text-amber-800/90">
          {seamLoss.fromLabel} → {seamLoss.toLabel}
        </span>
        <span className="block text-[10px] font-semibold tabular-nums text-amber-700">
          流失 {seamLoss.lossRate}%
          {seamLoss.dropped > 0 && (
            <span className="ml-0.5 font-normal text-amber-600/80">
              · 漏 {seamLoss.dropped}
            </span>
          )}
        </span>
      </span>
    </div>
  );
}

function tierClipPath(topWidth: number, bottomWidth: number): string {
  const topLeft = (100 - topWidth) / 2;
  const topRight = topLeft + topWidth;
  const bottomLeft = (100 - bottomWidth) / 2;
  const bottomRight = bottomLeft + bottomWidth;
  return `polygon(${topLeft}% 0%, ${topRight}% 0%, ${bottomRight}% 100%, ${bottomLeft}% 100%)`;
}

function TierBlock({
  tier,
  topWidth,
  bottomWidth,
  height,
  size,
}: {
  tier: FunnelTier;
  topWidth: number;
  bottomWidth: number;
  height: number;
  size: "main" | "mini";
}) {
  const clip = tierClipPath(topWidth, bottomWidth);

  return (
    <div className="group relative w-full" style={{ height }}>
      <div
        className="absolute inset-0 transition group-hover:brightness-110"
        style={{
          backgroundColor: tier.color,
          clipPath: clip,
        }}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-white",
          size === "main" ? "gap-5" : ""
        )}
      >
        {size === "main" ? (
          <div className="flex items-baseline gap-5">
            <span className="text-base font-semibold leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              {tier.label}
            </span>
            <span className="text-3xl font-bold tabular-nums leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              {tier.count}
            </span>
          </div>
        ) : (
          <span className="text-xs font-bold tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]">
            {tier.count}
          </span>
        )}
      </div>
      {tier.href && (
        <Link
          href={tier.href}
          className="absolute inset-0 z-20 block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          aria-label={`${tier.label} ${tier.count}`}
        />
      )}
    </div>
  );
}

export function FunnelStack({
  tiers,
  widthBounds = DEFAULT_BOUNDS,
  layerHeight,
  size = "main",
  className,
}: Props) {
  const h = layerHeight ?? (size === "main" ? 56 : 28);
  const bounds =
    widthBounds.length >= tiers.length + 1
      ? widthBounds
      : DEFAULT_BOUNDS.slice(0, tiers.length + 1);

  if (size === "mini") {
    return (
      <div className={cn("mx-auto w-full max-w-[100px]", className)}>
        {tiers.map((tier, idx) => {
          const topW = bounds[idx];
          const bottomW = bounds[idx + 1] ?? bounds[idx] - 12;

          return (
            <TierBlock
              key={tier.id}
              tier={tier}
              topWidth={topW}
              bottomWidth={bottomW}
              height={h}
              size={size}
            />
          );
        })}
      </div>
    );
  }

  const totalHeight = tiers.length * h;

  return (
    <div
      className={cn("relative w-full", className)}
      style={{ minHeight: totalHeight }}
    >
      {/* 六等分：左右各留 1/6，漏斗占中间 4/6 */}
      <div className="mx-auto w-4/6">
        {tiers.map((tier, idx) => {
          const topW = bounds[idx];
          const bottomW = bounds[idx + 1] ?? bounds[idx] - 12;

          return (
            <TierBlock
              key={tier.id}
              tier={tier}
              topWidth={topW}
              bottomWidth={bottomW}
              height={h}
              size={size}
            />
          );
        })}
      </div>

      {tiers.map((tier, idx) => {
        if (idx === 0 || !tier.seamLoss) return null;

        return (
          <SeamLossCallout
            key={`seam-${tier.id}`}
            seamLoss={tier.seamLoss}
            top={idx * h}
            topWidth={bounds[idx]}
          />
        );
      })}
    </div>
  );
}
