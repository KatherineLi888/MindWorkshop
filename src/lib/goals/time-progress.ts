import { formatDateOnly } from "@/lib/utils";

export type TimeProgressStatus =
  | "not_started"
  | "in_progress"
  | "ended"
  | "invalid";

export type TimeProgressResult = {
  status: TimeProgressStatus;
  active: boolean;
  percent: number | null;
};

export type ProgressVsTime = "ahead" | "on_track" | "behind";

function parseDateOnly(iso: string): Date {
  const d = iso.length === 10 ? `${iso}T12:00:00` : iso;
  return new Date(d);
}

/** 根据起止日期计算时间进度 0–100；未开始返回 inactive */
export function computeTimeProgress(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  now: Date = new Date()
): TimeProgressResult {
  if (!startDate?.trim() || !endDate?.trim()) {
    return { status: "invalid", active: false, percent: null };
  }

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { status: "invalid", active: false, percent: null };
  }
  if (end.getTime() <= start.getTime()) {
    return { status: "invalid", active: false, percent: null };
  }

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (nowMs < startMs) {
    return { status: "not_started", active: false, percent: null };
  }
  if (nowMs >= endMs) {
    return { status: "ended", active: true, percent: 100 };
  }

  const elapsed = nowMs - startMs;
  const total = endMs - startMs;
  const percent = Math.min(
    100,
    Math.max(0, Math.round((elapsed / total) * 100))
  );
  return { status: "in_progress", active: true, percent };
}

/** 完成进度 vs 时间进度（±5% 视为同步） */
export function compareProgressVsTime(
  completionPercent: number,
  time: TimeProgressResult,
  tolerance = 5
): ProgressVsTime | null {
  if (!time.active || time.percent == null) return null;
  const diff = completionPercent - time.percent;
  if (diff >= tolerance) return "ahead";
  if (diff <= -tolerance) return "behind";
  return "on_track";
}

export function formatPeriodRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null {
  if (startDate?.trim() && endDate?.trim()) {
    return `${formatDateOnly(startDate)} – ${formatDateOnly(endDate)}`;
  }
  if (startDate?.trim()) return `${formatDateOnly(startDate)} 起`;
  if (endDate?.trim()) return `截至 ${formatDateOnly(endDate)}`;
  return null;
}

export function timeProgressHint(
  completionPercent: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null {
  const time = computeTimeProgress(startDate, endDate);
  if (time.status === "not_started" && startDate) {
    return `${formatDateOnly(startDate)} 开始`;
  }
  if (!time.active || time.percent == null) return null;

  const vs = compareProgressVsTime(completionPercent, time);
  if (vs === "ahead") {
    return `时间 ${time.percent}% · 超前 ${completionPercent - time.percent}%`;
  }
  if (vs === "behind") {
    return `时间 ${time.percent}% · 落后 ${time.percent - completionPercent}%`;
  }
  return `时间 ${time.percent}% · 与进度同步`;
}

export const TIME_STRIPE_BG = `repeating-linear-gradient(
  -45deg,
  rgba(100, 116, 139, 0.28) 0px,
  rgba(100, 116, 139, 0.28) 2px,
  rgba(148, 163, 184, 0.1) 2px,
  rgba(148, 163, 184, 0.1) 7px
)`;

export function timeStripeBackground(): string {
  return TIME_STRIPE_BG;
}
