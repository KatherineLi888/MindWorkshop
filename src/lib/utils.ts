export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 备注时间框：上行日期、下行时分 */
export function formatNoteStamp(iso: string) {
  const d = new Date(iso);
  return {
    ymd: d.toLocaleDateString("zh-CN", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }),
    hm: d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };
}

/** 日期 + 时分（用于备忘时间戳） */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 仅显示日期（用于截止日期等） */
export function formatDateOnly(iso: string) {
  const d = iso.length === 10 ? `${iso}T12:00:00` : iso;
  return new Date(d).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
