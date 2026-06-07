"use client";

import {
  EMPHASIS_PRESETS,
  type ThoughtNodeEmphasis,
} from "@/lib/thinking/node-appearance";

type Props = {
  value?: ThoughtNodeEmphasis;
  onChange: (emphasis: ThoughtNodeEmphasis | undefined) => void;
  compact?: boolean;
};

export function ThinkingNodeEmphasisPicker({
  value,
  onChange,
  compact,
}: Props) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <p className="text-[10px] font-medium text-slate-500">强调样式</p>
      <div className="flex flex-wrap gap-1">
        {EMPHASIS_PRESETS.map((preset) => {
          const active =
            preset.id === "none" ? !value : value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() =>
                onChange(
                  preset.id === "none"
                    ? undefined
                    : (preset.id as ThoughtNodeEmphasis)
                )
              }
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                active
                  ? "border-[#6366F1] bg-[#EEF2FF] text-[#4338CA]"
                  : "border-[#E8ECF0] bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span
                className="inline-flex h-3 w-3 items-center justify-center rounded-sm border border-[#E2E8F0] text-[8px] font-bold leading-none"
                style={{
                  backgroundColor:
                    preset.kind === "bg" ? preset.color : "#FFFFFF",
                  color:
                    preset.kind === "text" ? preset.color : THINK_TEXT_FALLBACK,
                }}
              >
                {preset.kind === "text" ? "A" : null}
              </span>
              {!compact && <span>{preset.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const THINK_TEXT_FALLBACK = "#475569";
