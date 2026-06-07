import {
  compareProgressVsTime,
  computeTimeProgress,
  type ProgressVsTime,
} from "./time-progress";

export function progressPercentClass(
  vs: ProgressVsTime | null,
  isOverflow = false
): string {
  if (isOverflow) return "text-fuchsia-600";
  if (vs === "behind") return "text-yellow-600";
  if (vs === "ahead" || vs === "on_track") return "text-emerald-600";
  return "text-slate-600";
}

export function resolveProgressVisual(
  completionPercent: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  isOverflow = false
) {
  const time = computeTimeProgress(startDate, endDate);
  const vs =
    time.active && time.percent != null
      ? compareProgressVsTime(completionPercent, time)
      : null;
  return {
    time,
    vs,
    percentClass: progressPercentClass(vs, isOverflow),
  };
}
