import {
  compareProgressVsTime,
  computeTimeProgress,
  type ProgressVsTime,
} from "./time-progress";

export type TimeVsLabel = {
  text: string;
  vs: ProgressVsTime | "not_started" | "ended";
  diff?: number;
};

/** 进度条右侧简短标注：领先 / 落后 / 同步 / 未开始 */
export function getTimeVsLabel(
  completionPercent: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): TimeVsLabel | null {
  const time = computeTimeProgress(startDate, endDate);

  if (time.status === "not_started") {
    return { text: "未开始", vs: "not_started" };
  }
  if (!time.active || time.percent == null) {
    return null;
  }

  const vs = compareProgressVsTime(completionPercent, time);
  if (vs === "ahead") {
    const diff = completionPercent - time.percent;
    return { text: `领先 ${diff}%`, vs: "ahead", diff };
  }
  if (vs === "behind") {
    const diff = time.percent - completionPercent;
    return { text: `落后 ${diff}%`, vs: "behind", diff };
  }
  if (time.status === "ended") {
    return { text: "已截止", vs: "ended" };
  }
  return { text: "同步", vs: "on_track" };
}

/** 行内括号标注，如 （领先 5%） */
export function formatTimeVsParen(
  completionPercent: number,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string | null {
  const label = getTimeVsLabel(completionPercent, startDate, endDate);
  if (!label || label.vs === "not_started") return null;
  return `（${label.text}）`;
}
