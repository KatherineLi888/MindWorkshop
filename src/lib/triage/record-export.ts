import {
  getRecordFocusLabel,
  getRecordOriginLabel,
  TRIAGE_DESTINATION_LABELS,
} from "./logic";
import type { TriageRecord } from "./types";
import { formatDate } from "@/lib/utils";

export function triageRecordsToExportRows(records: TriageRecord[]) {
  return records.map((r) => ({
    时间: formatDate(r.createdAt),
    主题: r.summary,
    性质: getRecordOriginLabel(r),
    定位选择: getRecordFocusLabel(r),
    进入板块: TRIAGE_DESTINATION_LABELS[r.destination],
    定位方式: r.entryMode === "direct" ? "直接选择" : "帮我定位",
    核心要点: r.worryPoints.join("；"),
    原始闪念: r.rawText,
    关联实体类型: r.targetEntityType ?? "",
    关联实体ID: r.targetEntityId ?? "",
    记录ID: r.id,
  }));
}
