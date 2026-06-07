"use client";

import {
  isFunnelConfig,
  isGridConfig,
  isQuadrantConfig,
  isStageConfig,
} from "@/lib/models/helpers";
import { MODEL_KIND_LABELS } from "@/lib/models/types";
import type { ModelDefinition } from "@/lib/models/types";

export function ModelPreview({ model }: { model: ModelDefinition & { id?: string } }) {
  const { config, kind } = model;

  if (isQuadrantConfig(config)) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-slate-400 px-1">
          <span>{config.yAxis.high}</span>
        </div>
        <div className="flex gap-1">
          <div className="flex w-4 shrink-0 flex-col justify-between py-1 text-[8px] text-slate-400 [writing-mode:vertical-rl]">
            <span>{config.yAxis.high}</span>
            <span>{config.yAxis.low}</span>
          </div>
          <div className="flex-1">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                gridTemplateRows: `repeat(${config.rows}, 1fr)`,
              }}
            >
              {config.regions.map((r) => (
                <div
                  key={r.id}
                  className="flex min-h-[3rem] flex-col items-center justify-center rounded border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-1 py-1.5 text-center"
                >
                  <span className="text-[9px] font-medium text-slate-600">
                    {r.label}
                  </span>
                  {r.definition && (
                    <span className="mt-0.5 line-clamp-2 text-[8px] text-slate-400">
                      {r.definition}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[9px] text-slate-400 px-1">
              <span>{config.xAxis.low}</span>
              <span>{config.xAxis.high}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isStageConfig(config)) {
    return (
      <div className="flex gap-1 overflow-x-auto">
        {config.stages.map((s, i) => (
          <div key={s.id} className="flex min-w-0 flex-1 items-stretch">
            <div className="flex min-w-0 flex-1 flex-col rounded border border-[#E2E8F0] bg-[#FAFBFC] p-2">
              <span className="text-[9px] font-medium text-slate-600">
                {s.name}
              </span>
              {s.description && (
                <span className="mt-0.5 line-clamp-2 text-[8px] text-slate-400">
                  {s.description}
                </span>
              )}
            </div>
            {i < config.stages.length - 1 && (
              <span className="flex shrink-0 items-center text-[10px] text-slate-300">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (isFunnelConfig(config)) {
    return (
      <div className="mx-auto flex max-w-xs flex-col items-center gap-0.5">
        {config.levels.map((l, i) => {
          const width = 100 - i * (60 / Math.max(config.levels.length - 1, 1));
          return (
            <div
              key={l.id}
              className="rounded border border-[#E2E8F0] bg-[#FAFBFC] px-2 py-1.5 text-center"
              style={{ width: `${width}%` }}
            >
              <span className="text-[9px] font-medium text-slate-600">
                {l.name}
              </span>
              {l.description && (
                <span className="mt-0.5 block line-clamp-1 text-[8px] text-slate-400">
                  {l.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (isGridConfig(config)) {
    return (
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
          gridTemplateRows: `repeat(${config.rows}, 1fr)`,
        }}
      >
        {config.cells.map((c) => (
          <div
            key={c.id}
            className="flex min-h-[2.5rem] flex-col items-center justify-center rounded border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-1 py-1 text-center"
          >
            <span className="text-[9px] font-medium text-slate-600">
              {c.title}
            </span>
            {c.definition && (
              <span className="mt-0.5 line-clamp-1 text-[8px] text-slate-400">
                {c.definition}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-xs text-slate-400">
      {MODEL_KIND_LABELS[kind]} 预览不可用
    </p>
  );
}
