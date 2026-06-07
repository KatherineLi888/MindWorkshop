"use client";

import { Button } from "@/components/ui/button";
import { downloadExcel } from "@/lib/export-excel";

type Props<T extends Record<string, unknown>> = {
  rows: T[];
  fileName: string;
  sheetName?: string;
  label?: string;
};

export function ExportExcelButton<T extends Record<string, unknown>>({
  rows,
  fileName,
  sheetName = "数据",
  label = "导出 Excel",
}: Props<T>) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={() => downloadExcel(rows, sheetName, fileName)}
    >
      {label}
    </Button>
  );
}
