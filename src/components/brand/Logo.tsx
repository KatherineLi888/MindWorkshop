"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "lockup" | "icon";
type Scheme = "scheme1" | "scheme2" | "scheme3";

const SVG_SRC: Record<Scheme, Record<Variant, string>> = {
  scheme1: {
    lockup: "/logo/scheme1-transparent.svg",
    icon: "/logo/scheme1-icon-transparent.svg",
  },
  scheme2: {
    lockup: "/logo/scheme2-transparent.svg",
    icon: "/logo/scheme2-transparent.svg",
  },
  scheme3: {
    lockup: "/logo/scheme3-transparent.svg",
    icon: "/logo/scheme3-transparent.svg",
  },
};

const PNG_FALLBACK: Record<Variant, string> = {
  lockup: "/logo.png",
  icon: "/logo.png",
};

type Props = {
  variant?: Variant;
  scheme?: Scheme;
  className?: string;
};

export function Logo({
  variant = "lockup",
  scheme = "scheme1",
  className,
}: Props) {
  const [src, setSrc] = useState(SVG_SRC[scheme][variant]);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "font-semibold tracking-tight text-slate-800",
          variant === "lockup" ? "text-sm leading-tight" : "text-xs",
          className
        )}
      >
        {variant === "lockup" ? (
          <>
            思绪工坊
            <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
              Mind Workshop
            </span>
          </>
        ) : (
          "思"
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={variant === "icon" ? "思绪工坊" : "思绪工坊 · Mind Workshop"}
      className={cn(
        variant === "lockup" ? "h-8 w-auto max-w-[11rem]" : "h-7 w-7 object-contain",
        className
      )}
      decoding="async"
      onError={() => {
        if (src.endsWith(".png")) {
          setFailed(true);
        } else {
          setSrc(PNG_FALLBACK[variant]);
        }
      }}
    />
  );
}
