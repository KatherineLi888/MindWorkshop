"use client";

import { PaneCanvas } from "./PaneCanvas";
import { PaneExcel } from "./PaneExcel";
import { PaneModel } from "./PaneModel";
import { PaneWord } from "./PaneWord";
import {
  DOC_TYPE_LABELS,
  type CanvasData,
  type ExcelData,
  type ModelData,
  type VaultDocument,
  type WordData,
} from "./types";

type Props = {
  document: VaultDocument | null;
  active: boolean;
  onFocus: () => void;
  onUpdate: (doc: VaultDocument) => void;
  onClose: () => void;
  onAddNode?: () => void;
  mobileSingle?: boolean;
};

export function WorkspacePane({
  document,
  active,
  onFocus,
  onUpdate,
  onClose,
  onAddNode,
  mobileSingle = false,
}: Props) {
  if (!document) {
    return (
      <div
        className={`flex min-h-0 min-w-0 flex-col items-center justify-center bg-white text-slate-400 ${
          active ? "ring-2 ring-inset ring-[#3B82F6]" : ""
        }`}
        onMouseDown={onFocus}
      >
        <p className="px-4 text-center text-xs">
          {mobileSingle
            ? "点右上角「文档库」打开或新建文档"
            : "从左侧文档库打开文档"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-white ${
        active ? "ring-2 ring-inset ring-[#3B82F6]" : ""
      }`}
      onMouseDown={onFocus}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-[#E2E8F0] bg-slate-50/80 px-3 py-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] ring-1 ring-[#E2E8F0]">
          {document.docType === "canvas"
            ? "◫"
            : document.docType === "word"
              ? "W"
              : document.docType === "excel"
                ? "X"
                : "M"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {document.name}
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
          {DOC_TYPE_LABELS[document.docType]}
        </span>
        {document.docType === "canvas" && onAddNode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddNode();
            }}
            className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            + 添加节点
          </button>
        )}
        <button
          type="button"
          title="关闭视角（文档保留在库中）"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        {document.docType === "canvas" && (
          <PaneCanvas
            data={document.data as CanvasData}
            active={active}
            onChange={(data) => onUpdate({ ...document, data })}
          />
        )}
        {document.docType === "word" && (
          <PaneWord
            data={document.data as WordData}
            onChange={(data) => onUpdate({ ...document, data })}
          />
        )}
        {document.docType === "excel" && (
          <PaneExcel
            data={document.data as ExcelData}
            onChange={(data) => onUpdate({ ...document, data })}
          />
        )}
        {document.docType === "model" && (
          <PaneModel
            data={document.data as ModelData}
            onChange={(data) => onUpdate({ ...document, data })}
          />
        )}
      </div>
    </div>
  );
}
