import type { KeyResult, KrRecordMode } from "./types";

export const KR_RECORD_MODE_LABELS: Record<
  KrRecordMode,
  { label: string; hint: string }
> = {
  set: {
    label: "更新数据",
    hint: "每次录入最新数值（如体重 115 斤）",
  },
  accumulate: {
    label: "累加记录",
    hint: "每次录入增量并累加（如今日跑步 5.12 公里）",
  },
  count: {
    label: "打卡计数",
    hint: "每完成一次 +1（如健身一次）",
  },
  consume: {
    label: "消耗递减",
    hint: "每消耗/完成一个 +1，显示距离目标还剩多少",
  },
};

export function unitLabel(kr: KeyResult): string {
  if (kr.unit.trim()) return kr.unit.trim();
  if (kr.recordMode === "count" || kr.recordMode === "consume") return "次";
  return "";
}

/** 单条 KR 原始完成度（可超过 100） */
export function computeKrRawCompletion(kr: KeyResult): number {
  if (kr.recordMode === "set") {
    if (kr.valueDirection === "down") {
      const base = kr.baseline ?? kr.current;
      const span = base - kr.target;
      if (span <= 0) return kr.current <= kr.target ? 100 : 0;
      const done = base - kr.current;
      return Math.max(0, Math.round((done / span) * 100));
    }
    if (kr.target <= 0) return 0;
    return Math.round((kr.current / kr.target) * 100);
  }

  if (kr.target <= 0) return kr.current > 0 ? 100 : 0;
  return Math.round((kr.current / kr.target) * 100);
}

/** 单条 KR 完成度 0–100（用于 OKR 加权） */
export function computeKrCompletion(kr: KeyResult): number {
  return Math.min(100, computeKrRawCompletion(kr));
}

export type KrProgressVisual = {
  /** 加权计算用，封顶 100 */
  cappedCompletion: number;
  /** UI 展示百分比 */
  displayPercent: number;
  /** 进度条宽度 0–100 */
  barWidth: number;
  /** 允许超出且已超过目标 */
  isOverflow: boolean;
};

export function getKrProgressVisual(kr: KeyResult): KrProgressVisual {
  const raw = computeKrRawCompletion(kr);
  const capped = Math.min(100, raw);
  const isOverflow = !!(kr.allowExceed && raw > 100);
  return {
    cappedCompletion: capped,
    displayPercent: isOverflow ? raw : capped,
    barWidth: isOverflow ? 100 : capped,
    isOverflow,
  };
}

export const KR_PROGRESS_BAR = {
  track: "bg-[#E2E8F0]",
  fill: "bg-emerald-500",
  fillOverflow:
    "bg-gradient-to-r from-amber-400 via-fuchsia-500 to-violet-500",
  percent: "text-emerald-600",
  percentOverflow: "text-fuchsia-600",
  addBtn: "bg-emerald-500 text-white hover:bg-emerald-600",
  addBtnOverflow:
    "bg-gradient-to-r from-amber-400 via-fuchsia-500 to-violet-500 text-white hover:opacity-90",
} as const;

/** 预览用：完成情况（不含百分比，百分比单独展示） */
export function formatKrProgressLine(kr: KeyResult): string {
  const unit = unitLabel(kr);

  switch (kr.recordMode) {
    case "set":
      if (kr.valueDirection === "down") {
        return `当前 ${kr.current}${unit}，目标 ${kr.target}${unit}`;
      }
      return `${kr.current}${unit} / ${kr.target}${unit}`;
    case "accumulate":
      return `累计 ${kr.current}${unit} / ${kr.target}${unit}`;
    case "count":
      return `${kr.current} / ${kr.target}${unit}`;
    case "consume": {
      const left = Math.max(0, kr.target - kr.current);
      return `${kr.current} / ${kr.target}${unit}，还剩 ${left}${unit}`;
    }
    default:
      return `${kr.current} / ${kr.target} ${unit}`;
  }
}

/** @deprecated 使用 formatKrProgressLine + 独立百分比展示 */
export function formatKrStatus(kr: KeyResult): string {
  const unit = unitLabel(kr);
  const pct = computeKrCompletion(kr);

  switch (kr.recordMode) {
    case "set":
      if (kr.valueDirection === "down") {
        return `当前 ${kr.current}${unit} · 目标 ${kr.target}${unit} · ${pct}%`;
      }
      return `当前 ${kr.current}${unit} / 目标 ${kr.target}${unit} · ${pct}%`;
    case "accumulate":
      return `累计 ${kr.current}${unit} / ${kr.target}${unit} · ${pct}%`;
    case "count":
      return `已完成 ${kr.current} / ${kr.target}${unit} · ${pct}%`;
    case "consume": {
      const left = Math.max(0, kr.target - kr.current);
      return `已消耗 ${kr.current} / ${kr.target}${unit} · 还剩 ${left}${unit} · ${pct}%`;
    }
    default:
      return `${kr.current} / ${kr.target} ${unit} · ${pct}%`;
  }
}

/** 按权重加权计算 OKR 总进度 */
export function computeWeightedOkrProgress(krs: KeyResult[]): number | null {
  const valid = krs.filter((k) => k.title.trim() || k.target > 0);
  if (valid.length === 0) return null;

  const totalWeight = valid.reduce((acc, k) => acc + Math.max(0, k.weight), 0);
  if (totalWeight <= 0) {
    const avg =
      valid.reduce((acc, k) => acc + computeKrCompletion(k), 0) /
      valid.length;
    return Math.round(avg);
  }

  const weighted = valid.reduce((acc, k) => {
    const w = Math.max(0, k.weight) / totalWeight;
    return acc + w * computeKrCompletion(k);
  }, 0);
  return Math.round(weighted);
}

/** 新增 KR 时均分权重 */
export function redistributeKrWeights(krs: KeyResult[]): KeyResult[] {
  if (krs.length === 0) return krs;
  const each = Math.floor(100 / krs.length);
  const remainder = 100 - each * krs.length;
  return krs.map((kr, i) => ({
    ...kr,
    weight: each + (i < remainder ? 1 : 0),
  }));
}

function migrateRecordMode(raw: string | undefined): KrRecordMode {
  if (raw === "set" || raw === "accumulate" || raw === "count" || raw === "consume") {
    return raw;
  }
  if (raw === "checkin") return "count";
  if (raw === "amount") return "accumulate";
  return "accumulate";
}

export function normalizeKeyResult(
  raw: Partial<KeyResult> & Pick<KeyResult, "id">,
  index: number,
  total: number
): KeyResult {
  const each = total > 0 ? Math.floor(100 / total) : 100;
  const remainder = total > 0 ? 100 - each * total : 0;
  const defaultWeight = each + (index < remainder ? 1 : 0);

  const legacy = raw as Partial<KeyResult> & {
    trackMode?: "auto" | "manual";
    manualProgress?: number;
    recordMode?: string;
  };

  const recordMode = migrateRecordMode(legacy.recordMode);
  const unit =
    raw.unit ??
    (recordMode === "count" || recordMode === "consume" ? "次" : "");
  const target = raw.target ?? 1;
  let current = raw.current ?? 0;

  if (
    !legacy.recordMode &&
    legacy.trackMode === "manual" &&
    legacy.manualProgress != null &&
    target > 0
  ) {
    current = Math.round((legacy.manualProgress / 100) * target);
  }

  return {
    id: raw.id,
    title: raw.title ?? "",
    target,
    current,
    unit,
    weight: raw.weight ?? defaultWeight,
    recordMode,
    start_date: raw.start_date ?? null,
    due_date: raw.due_date ?? null,
    baseline: raw.baseline ?? null,
    valueDirection: raw.valueDirection ?? "up",
    allowExceed: raw.allowExceed ?? false,
    calendarKeyword: raw.calendarKeyword?.trim() || undefined,
  };
}

/** 应用一条新记录到 KR */
export function applyKrRecord(
  kr: KeyResult,
  input: { value?: number; delta?: number }
): KeyResult {
  switch (kr.recordMode) {
    case "set": {
      const next = input.value ?? kr.current;
      const baseline =
        kr.baseline == null && kr.valueDirection === "down"
          ? Math.max(next, kr.target)
          : kr.baseline;
      return { ...kr, current: next, baseline };
    }
    case "accumulate": {
      const add = input.value ?? input.delta ?? 0;
      return { ...kr, current: Math.max(0, kr.current + add) };
    }
    case "count":
    case "consume": {
      const add = input.delta ?? 1;
      const next = Math.max(0, kr.current + add);
      if (kr.allowExceed || kr.target <= 0) return { ...kr, current: next };
      return { ...kr, current: Math.min(next, kr.target) };
    }
    default:
      return kr;
  }
}
