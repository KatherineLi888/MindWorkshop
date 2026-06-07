import * as XLSX from "xlsx";

export function downloadExcel<T extends Record<string, unknown>>(
  rows: T[],
  sheetName: string,
  fileName: string
) {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(
    rows.length ? rows : [{ 提示: "暂无数据" }]
  );
  XLSX.utils.book_append_sheet(wb, sheet, sheetName);
  XLSX.writeFile(wb, fileName);
}
