"use client";

import { useState } from "react";
import { colName, getCellDisplay } from "./excel-formulas";
import type { ExcelData } from "./types";

type Props = {
  data: ExcelData;
  onChange: (data: ExcelData) => void;
};

export function PaneExcel({ data, onChange }: Props) {
  const { cells } = data;
  const cols = cells[0]?.length ?? 6;
  const [editing, setEditing] = useState<string | null>(null);

  const setCell = (r: number, c: number, val: string) => {
    const next = cells.map((row, ri) =>
      row.map((cell, ci) => (ri === r && ci === c ? val : cell))
    );
    onChange({ cells: next });
  };

  const addRow = () => {
    onChange({ cells: [...cells, Array.from({ length: cols }, () => "")] });
  };

  return (
    <div className="flex h-full flex-col overflow-auto bg-white">
      <div className="shrink-0 border-b border-[#E2E8F0] px-3 py-1 text-[10px] text-slate-400">
        支持公式：=A1+B1、=SUM(A1:A5)、=AVG(B1:B3)、=MIN()、=MAX()、=COUNT()
      </div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-8 border border-[#E2E8F0] bg-slate-50" />
            {Array.from({ length: cols }, (_, ci) => (
              <th
                key={ci}
                className="border border-[#E2E8F0] bg-slate-50 px-1 py-0.5 text-xs font-normal text-slate-400"
              >
                {colName(ci)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, ri) => (
            <tr key={ri}>
              <td className="border border-[#E2E8F0] bg-slate-50 text-center text-xs text-slate-400">
                {ri + 1}
              </td>
              {row.map((cell, ci) => {
                const key = `${ri}-${ci}`;
                const isEditing = editing === key;
                const display = getCellDisplay(cells, ri, ci);
                const isFormula = cell.trim().startsWith("=");

                return (
                  <td key={ci} className="border border-[#E2E8F0] p-0">
                    {isEditing ? (
                      <input
                        autoFocus
                        className="w-full min-w-[80px] bg-blue-50/50 px-2 py-1 font-mono text-xs outline-none"
                        value={cell}
                        onChange={(e) => setCell(ri, ci, e.target.value)}
                        onBlur={() => setEditing(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setEditing(null);
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className={`block w-full min-w-[80px] px-2 py-1 text-left text-xs ${
                          isFormula ? "text-blue-700" : "text-slate-800"
                        } hover:bg-blue-50/30`}
                        onClick={() => setEditing(key)}
                        title={isFormula ? `公式: ${cell}` : undefined}
                      >
                        {display || "\u00A0"}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="m-2 self-start rounded border border-[#E2E8F0] px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
      >
        + 添加行
      </button>
    </div>
  );
}
