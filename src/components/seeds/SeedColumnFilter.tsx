"use client";

import {
  SEED_FLOW_STAGE_OPTIONS,
  SEED_ORIGIN_OPTIONS,
  type SeedColumnFilterState,
  type SeedOriginKey,
} from "@/lib/seeds/origin";
import type { SeedStage } from "@/lib/seeds/types";

const selectClass =
  "h-7 rounded-md border border-[#E2E8F0] bg-white px-1.5 text-[10px] text-slate-600 outline-none focus:border-[#CBD5E1]";

type Props = {
  value: SeedColumnFilterState;
  onChange: (next: SeedColumnFilterState) => void;
};

/** 列标题右侧：来源 + 当前阶段 两个独立下拉框 */
export function SeedColumnFilter({ value, onChange }: Props) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <select
        className={selectClass}
        value={value.origin}
        onChange={(e) =>
          onChange({
            ...value,
            origin: e.target.value as SeedOriginKey | "",
          })
        }
        title="来源"
      >
        <option value="">来源</option>
        {SEED_ORIGIN_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={value.currentStage}
        onChange={(e) =>
          onChange({
            ...value,
            currentStage: e.target.value as SeedStage | "",
          })
        }
        title="当前阶段"
      >
        <option value="">阶段</option>
        {SEED_FLOW_STAGE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
