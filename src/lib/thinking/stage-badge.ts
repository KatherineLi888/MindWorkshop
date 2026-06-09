/** 思考会话列表状态标签配色 */
export function thoughtStageBadgeClass(label: string): string {
  if (label.includes("提问")) {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }
  if (label.includes("结论")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (label.includes("刚开始")) {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }
  return "bg-violet-50 text-violet-700 ring-violet-200";
}
