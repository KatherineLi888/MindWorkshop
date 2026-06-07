"use client";

import { useState } from "react";
import {
  isFunnelConfig,
  isGridConfig,
  isQuadrantConfig,
  isStageConfig,
} from "@/lib/models/helpers";
import {
  type ApplyLayoutHint,
  type ApplyViewportTier,
} from "@/lib/models/model-apply-layout";
import type { ModelConfig, ModelKind, ModelSlotValues } from "@/lib/models/types";
import { useApplyViewport } from "./useApplyViewport";

type Props = {
  config: ModelConfig;
  values: ModelSlotValues;
  onChange: (slotId: string, value: string) => void;
  tier?: ApplyViewportTier;
  className?: string;
  /** 浮窗/分屏等紧凑场景下隐藏槽位说明，避免挤占结构区 */
  hideSlotHints?: boolean;
};

export function ModelApplyCanvas({
  config,
  values,
  onChange,
  tier = "full",
  className = "",
  hideSlotHints,
}: Props) {
  const suppressHints = hideSlotHints ?? (tier === "panel" || tier === "pane");
  const kind: ModelKind = isQuadrantConfig(config)
    ? "quadrant"
    : isStageConfig(config)
      ? "stage"
      : isFunnelConfig(config)
        ? "funnel"
        : "grid";

  const { ref, hint } = useApplyViewport(kind, config, tier);

  return (
    <div
      ref={ref}
      className={`flex h-full min-h-0 w-full flex-col ${className}`}
    >
      {isQuadrantConfig(config) && (
        <QuadrantApplyCanvas
          config={config}
          values={values}
          onChange={onChange}
          hint={hint}
          hideSlotHints={suppressHints}
        />
      )}
      {isStageConfig(config) && (
        <StageApplyCanvas
          config={config}
          values={values}
          onChange={onChange}
          hint={hint}
          hideSlotHints={suppressHints}
        />
      )}
      {isFunnelConfig(config) && (
        <FunnelApplyCanvas
          config={config}
          values={values}
          onChange={onChange}
          hint={hint}
          hideSlotHints={suppressHints}
        />
      )}
      {isGridConfig(config) && (
        <GridApplyCanvas
          config={config}
          values={values}
          onChange={onChange}
          hint={hint}
          hideSlotHints={suppressHints}
        />
      )}
    </div>
  );
}

function InlineSlotField({
  label,
  hint,
  value,
  onChange,
  labelPosition = "top-left",
  compact = false,
  hideSlotHints = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  labelPosition?: "top-left" | "top-center";
  compact?: boolean;
  hideSlotHints?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const showHint = !hideSlotHints && !value && !focused && !!hint;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
      <span
        className={`shrink-0 truncate whitespace-nowrap px-2 pt-1.5 font-semibold text-slate-800 ${
          compact ? "text-[11px] leading-tight" : "text-sm"
        } ${labelPosition === "top-center" ? "text-center" : "text-left"}`}
      >
        {label}
      </span>
      <div className="relative min-h-0 flex-1 px-2 pb-1.5 pt-0.5">
        {showHint && (
          <p
            className={`pointer-events-none absolute left-2 right-2 top-0.5 line-clamp-1 truncate text-slate-300 ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            {hint}
          </p>
        )}
        <textarea
          className={`relative z-[1] h-full w-full resize-none bg-transparent leading-snug text-slate-800 outline-none ${
            compact ? "text-xs" : "text-sm"
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    </div>
  );
}

function QuadrantApplyCanvas({
  config,
  values,
  onChange,
  hint,
  hideSlotHints,
}: {
  config: import("@/lib/models/types").QuadrantConfig;
  values: ModelSlotValues;
  onChange: (slotId: string, value: string) => void;
  hint: ApplyLayoutHint;
  hideSlotHints?: boolean;
}) {
  const axisCls = hint.compact
    ? "text-xs font-bold"
    : "text-sm font-bold md:text-base";

  return (
    <div className="flex h-full min-h-0 gap-2 md:gap-3">
      <div
        className={`flex shrink-0 flex-col items-center justify-between py-1 ${
          hint.compact ? "w-8" : "w-10 md:w-12"
        }`}
      >
        <span
          className={`${axisCls} text-slate-700 [writing-mode:vertical-rl]`}
        >
          {config.yAxis.high}
        </span>
        <div className="my-1 w-0.5 flex-1 bg-slate-300" />
        <span
          className={`${axisCls} text-slate-700 [writing-mode:vertical-rl]`}
        >
          {config.yAxis.low}
        </span>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="grid min-h-0 flex-1 gap-1.5 md:gap-2"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
          }}
        >
          {config.regions.map((r) => (
            <InlineSlotField
              key={r.id}
              label={r.label}
              hint={[r.definition, r.traits].filter(Boolean).join("\n")}
              value={values[r.id] ?? ""}
              onChange={(v) => onChange(r.id, v)}
              compact={hint.compact}
              hideSlotHints={hideSlotHints}
            />
          ))}
        </div>

        <div
          className={`flex shrink-0 items-center gap-2 px-0.5 ${
            hint.compact ? "mt-1" : "mt-1.5"
          }`}
        >
          <span className={`shrink-0 text-slate-700 ${axisCls}`}>
            {config.xAxis.low}
          </span>
          <div className="h-0.5 flex-1 bg-slate-300" />
          <span className={`shrink-0 text-slate-700 ${axisCls}`}>
            {config.xAxis.high}
          </span>
        </div>
      </div>
    </div>
  );
}

function StageApplyCanvas({
  config,
  values,
  onChange,
  hint,
  hideSlotHints,
}: {
  config: import("@/lib/models/types").StageConfig;
  values: ModelSlotValues;
  onChange: (slotId: string, value: string) => void;
  hint: ApplyLayoutHint;
  hideSlotHints?: boolean;
}) {
  const stages = config.stages;

  if (hint.stageLayout === "grid-2x2") {
    return (
      <div
        className="grid h-full min-h-0 flex-1 gap-1.5 md:gap-2"
        style={{
          gridTemplateColumns: `repeat(${hint.stageGridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${Math.ceil(stages.length / hint.stageGridCols)}, minmax(0, 1fr))`,
        }}
      >
        {stages.map((s) => (
          <InlineSlotField
            key={s.id}
            label={s.name}
            hint={s.description}
            value={values[s.id] ?? ""}
            onChange={(v) => onChange(s.id, v)}
            compact={hint.compact}
            hideSlotHints={hideSlotHints}
          />
        ))}
      </div>
    );
  }

  if (hint.stageLayout === "vertical") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-1.5">
        {stages.map((s, i) => (
          <div key={s.id} className="flex min-h-0 flex-1 flex-col">
            <InlineSlotField
              label={s.name}
              hint={s.description}
              value={values[s.id] ?? ""}
              onChange={(v) => onChange(s.id, v)}
              compact={hint.compact}
              hideSlotHints={hideSlotHints}
            />
            {i < stages.length - 1 && (
              <span className="shrink-0 py-0.5 text-center text-slate-300">↓</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 items-stretch gap-1 md:gap-1.5">
      {stages.map((s, i) => (
        <div key={s.id} className="flex min-h-0 min-w-0 flex-1 items-stretch">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <InlineSlotField
              label={s.name}
              hint={s.description}
              value={values[s.id] ?? ""}
              onChange={(v) => onChange(s.id, v)}
              compact={hint.compact}
              hideSlotHints={hideSlotHints}
            />
          </div>
          {i < stages.length - 1 && (
            <span
              className={`flex shrink-0 items-center justify-center text-slate-300 ${
                hint.compact ? "w-3 text-xs" : "w-5 text-base"
              }`}
            >
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function FunnelApplyCanvas({
  config,
  values,
  onChange,
  hint,
  hideSlotHints,
}: {
  config: import("@/lib/models/types").FunnelConfig;
  values: ModelSlotValues;
  onChange: (slotId: string, value: string) => void;
  hint: ApplyLayoutHint;
  hideSlotHints?: boolean;
}) {
  const levels = config.levels;
  const step = 50 / Math.max(levels.length - 1, 1);

  if (hint.funnelLayout === "equal-rows") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-1">
        {levels.map((l) => (
          <div key={l.id} className="min-h-0 flex-1">
            <InlineSlotField
              label={l.name}
              hint={l.description}
              value={values[l.id] ?? ""}
              onChange={(v) => onChange(l.id, v)}
              labelPosition="top-center"
              compact
              hideSlotHints={hideSlotHints}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-between gap-1 py-1">
      {levels.map((l, i) => {
        const widthPct = 100 - i * step;
        return (
          <div
            key={l.id}
            className="flex min-h-0 flex-1 flex-col"
            style={{ width: `${widthPct}%`, maxWidth: "100%" }}
          >
            <InlineSlotField
              label={l.name}
              hint={l.description}
              value={values[l.id] ?? ""}
              onChange={(v) => onChange(l.id, v)}
              labelPosition="top-center"
              compact={hint.compact}
              hideSlotHints={hideSlotHints}
            />
          </div>
        );
      })}
    </div>
  );
}

function GridApplyCanvas({
  config,
  values,
  onChange,
  hint,
  hideSlotHints,
}: {
  config: import("@/lib/models/types").GridConfig;
  values: ModelSlotValues;
  onChange: (slotId: string, value: string) => void;
  hint: ApplyLayoutHint;
  hideSlotHints?: boolean;
}) {
  return (
    <div
      className="grid h-full min-h-0 flex-1 gap-1.5 md:gap-2"
      style={{
        gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
      }}
    >
      {config.cells.map((c) => (
        <InlineSlotField
          key={c.id}
          label={c.title}
          hint={c.definition}
          value={values[c.id] ?? ""}
          onChange={(v) => onChange(c.id, v)}
          compact={hint.compact}
          hideSlotHints={hideSlotHints}
        />
      ))}
    </div>
  );
}
