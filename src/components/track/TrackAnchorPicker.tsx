"use client";

import { useEffect, useState } from "react";
import {
  loadTrackAnchorGroups,
  type TrackAnchorGroups,
  type TrackAnchorOption,
} from "@/lib/track/anchors";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (type: "goal" | "decision" | "goal_kr", id: string) => void;
  className?: string;
};

function AnchorChip({
  option,
  selected,
  onPick,
}: {
  option: TrackAnchorOption;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-left text-xs transition",
        selected
          ? "border-[#F59E0B] bg-amber-50 text-amber-900 ring-1 ring-amber-200"
          : "border-[#E2E8F0] bg-white text-slate-700 hover:border-amber-200"
      )}
    >
      <span className="font-medium">{option.title}</span>
      {option.hint && (
        <span className="ml-1.5 text-[10px] text-slate-400">{option.hint}</span>
      )}
    </button>
  );
}

function AnchorSection({
  label,
  hint,
  items,
  value,
  onPick,
}: {
  label: string;
  hint?: string;
  items: TrackAnchorOption[];
  value: string;
  onPick: (o: TrackAnchorOption) => void;
}) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[10px] font-medium text-slate-600">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">{hint}</span>}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((o) => (
          <AnchorChip
            key={`${o.type}:${o.id}`}
            option={o}
            selected={value === `${o.type}:${o.id}`}
            onPick={() => onPick(o)}
          />
        ))}
      </div>
    </div>
  );
}

export function TrackAnchorPicker({ value, onChange, className }: Props) {
  const [groups, setGroups] = useState<TrackAnchorGroups | null>(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    loadTrackAnchorGroups().then(setGroups);
  }, []);

  if (!groups) {
    return (
      <p className={cn("text-xs text-slate-400", className)}>加载锚定选项…</p>
    );
  }

  const pick = (o: TrackAnchorOption) => onChange(o.type, o.id);

  return (
    <div className={cn("space-y-3", className)}>
      <AnchorSection
        label="正在进行中的目标"
        hint="执行中最易产生卡点"
        items={groups.ongoingGoals}
        value={value}
        onPick={pick}
      />
      <AnchorSection
        label="目标下的 KR"
        hint="子关键结果独立追踪"
        items={groups.ongoingKrs}
        value={value}
        onPick={pick}
      />
      <AnchorSection
        label="近期决策"
        hint="常伴随新想法与待跟进结果"
        items={groups.recentDecisions}
        value={value}
        onPick={pick}
      />
      {(groups.moreGoals.length > 0 ||
        groups.moreKrs.length > 0 ||
        groups.moreDecisions.length > 0) && (
        <div>
          <button
            type="button"
            className="text-[10px] text-[#1D4ED8] hover:underline"
            onClick={() => setShowMore((s) => !s)}
          >
            {showMore ? "收起更多" : "更多目标 / 决策"}
          </button>
          {showMore && (
            <div className="mt-2 space-y-2">
              <AnchorSection
                label="其他目标"
                items={groups.moreGoals}
                value={value}
                onPick={pick}
              />
              <AnchorSection
                label="其他 KR"
                items={groups.moreKrs}
                value={value}
                onPick={pick}
              />
              <AnchorSection
                label="其他决策"
                items={groups.moreDecisions}
                value={value}
                onPick={pick}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
