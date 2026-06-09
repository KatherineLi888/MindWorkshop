"use client";

import { MarkdownField } from "@/components/shared/MarkdownField";
import { cn } from "@/lib/utils";
import type { PeriodMiniFunnel, PeriodStatItem, ReviewHighlight } from "@/lib/review/types";

type Props = {
  items: PeriodStatItem[];
  funnel?: PeriodMiniFunnel;
  highlights: ReviewHighlight[];
  onHighlightChange: (id: string, reflection: string) => void;
  onToggleHighlight: (item: PeriodStatItem) => void;
};

const FUNNEL_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];
const FUNNEL_LABELS = ["思考", "决策", "目标", "追踪"];

function MiniFunnelBar({ funnel }: { funnel: PeriodMiniFunnel }) {
  const values = [
    funnel.thinking,
    funnel.decisions,
    funnel.goals,
    funnel.track,
  ];
  const max = Math.max(1, ...values);

  return (
    <div className="rounded-md border border-[#EEF1F5] bg-[#FAFBFC] p-2">
      <p className="text-[10px] font-medium text-slate-500">周期漏斗（简览）</p>
      <div className="mt-2 flex items-end justify-center gap-1.5">
        {values.map((v, i) => (
          <div key={FUNNEL_LABELS[i]} className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-bold tabular-nums text-slate-700">
              {v}
            </span>
            <div
              className="w-7 rounded-t-sm"
              style={{
                height: `${Math.max(12, (v / max) * 48)}px`,
                backgroundColor: FUNNEL_COLORS[i],
              }}
            />
            <span className="text-[8px] text-slate-500">{FUNNEL_LABELS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewDataPanel({
  items,
  funnel,
  highlights,
  onHighlightChange,
  onToggleHighlight,
}: Props) {
  const activeKeys = new Set(highlights.map((h) => h.statKey));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <p className="text-xs font-medium text-slate-600">数据概览</p>
        {funnel && <MiniFunnelBar funnel={funnel} />}
        <ul className="space-y-1.5">
          {items.map((item) => {
            const selected = activeKeys.has(item.key);
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onToggleHighlight(item)}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2 text-left transition",
                    item.anomaly
                      ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50"
                      : "border-[#EEF1F5] bg-white hover:bg-[#FAFBFC]",
                    selected && "ring-2 ring-[#93C5FD]"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-700">
                      {item.label}
                      {item.anomaly && (
                        <span className="ml-1 text-[10px] text-amber-700">
                          异常
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-slate-800">
                      {item.value}
                    </span>
                  </div>
                  {item.anomalyHint && (
                    <p className="mt-0.5 text-[10px] text-amber-700/90">
                      {item.anomalyHint}
                    </p>
                  )}
                  <p className="mt-1 text-[9px] text-slate-400">
                    {selected ? "已关联感受 · 点击取消" : "点击关联你的复盘感受"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-600">关联分析 · 感受</p>
        {highlights.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#E2E8F0] py-8 text-center text-xs text-slate-400">
            在左侧点击异常或关注的数据点，在此写下你的复盘
          </p>
        ) : (
          highlights.map((h) => (
            <div key={h.id} className="relative flex gap-2">
              <div className="flex w-24 shrink-0 flex-col items-end pt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6] ring-2 ring-white" />
                <span className="mt-1 h-px w-full border-t border-dashed border-[#93C5FD]/80" />
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF]/40 p-2.5">
                <p className="text-[10px] font-medium text-[#1D4ED8]">
                  {h.statLabel}
                  <span className="ml-1.5 font-bold text-slate-800">
                    {h.statValue}
                  </span>
                </p>
                <div className="mt-1.5">
                  <MarkdownField
                    rows={3}
                    value={h.reflection}
                    onChange={(v) => onHighlightChange(h.id, v)}
                    placeholder="这段数据让你想到什么？下一步想怎么调整？"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
