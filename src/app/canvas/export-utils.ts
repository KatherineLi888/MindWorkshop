import * as XLSX from "xlsx";
import { resolveLibraryModel } from "@/lib/models/canvas-bridge";
import { loadApplications } from "@/lib/models/application-store";
import { getSlotsFromConfig } from "@/lib/models/helpers";
import { getCellDisplay } from "./excel-formulas";
import {
  DOC_TYPE_LABELS,
  TAG_LABELS,
  normalizeModelData,
  type ModelData,
  type VaultDocument,
  type VaultState,
  type WordData,
} from "./types";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function downloadVaultJson(vault: VaultState) {
  const blob = new Blob([JSON.stringify(vault, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vault.json";
  a.click();
  URL.revokeObjectURL(url);
}

function docFolderPath(vault: VaultState, doc: VaultDocument): string {
  const parts: string[] = [];
  let fid = doc.folderId;
  while (fid) {
    const f = vault.folders[fid];
    if (!f) break;
    parts.unshift(f.name);
    fid = f.parentId;
  }
  return parts.join("/") || "根目录";
}

export function downloadVaultExcel(vault: VaultState) {
  const folderRows = Object.values(vault.folders).map((f) => ({
    名称: f.name,
    父文件夹: f.parentId ? vault.folders[f.parentId]?.name ?? f.parentId : "根目录",
    ID: f.id,
  }));

  const docRows = Object.values(vault.documents).map((d) => ({
    名称: d.name,
    类型: DOC_TYPE_LABELS[d.docType],
    路径: docFolderPath(vault, d),
    创建时间: d.createdAt,
    更新时间: d.updatedAt,
    ID: d.id,
  }));

  const nodeRows: Record<string, string>[] = [];
  const edgeRows: Record<string, string>[] = [];
  const wordRows: Record<string, string>[] = [];
  const excelRows: Record<string, string>[] = [];
  const modelRows: Record<string, string>[] = [];
  const recordRows: Record<string, string>[] = [];

  Object.values(vault.documents).forEach((doc) => {
    const path = docFolderPath(vault, doc);

    if (doc.docType === "canvas" && "nodes" in doc.data) {
      doc.data.nodes.forEach((n) => {
        nodeRows.push({
          文档: doc.name,
          路径: path,
          标题: n.data.title,
          内容: n.data.content,
          节点类型: TAG_LABELS[n.data.tag],
          颜色: n.data.color,
          ID: n.id,
        });
      });
      doc.data.edges.forEach((e) => {
        const src = doc.data.nodes.find((n) => n.id === e.source);
        const tgt = doc.data.nodes.find((n) => n.id === e.target);
        edgeRows.push({
          文档: doc.name,
          源: src?.data.title ?? e.source,
          目标: tgt?.data.title ?? e.target,
          标签: e.data?.label ?? "",
          ID: e.id,
        });
      });
    }

    if (doc.docType === "word" && "markdown" in doc.data) {
      const wd = doc.data as WordData;
      wordRows.push({
        文档: doc.name,
        路径: path,
        Markdown: wd.markdown,
      });
    }

    if (doc.docType === "excel" && "cells" in doc.data) {
      doc.data.cells.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          if (cell.trim()) {
            excelRows.push({
              文档: doc.name,
              单元格: `${String.fromCharCode(65 + ci)}${ri + 1}`,
              公式或值: cell,
              显示值: getCellDisplay(doc.data.cells, ri, ci),
            });
          }
        });
      });
    }

    if (doc.docType === "model") {
      const md = normalizeModelData(doc.data as ModelData);
      const lib = resolveLibraryModel(md.libraryModelId);
      const slots = lib ? getSlotsFromConfig(lib.config) : [];
      slots.forEach((slot) => {
        modelRows.push({
          文档: doc.name,
          模型: lib?.name ?? md.libraryModelId,
          区域: slot.label,
          内容: md.values[slot.id] ?? "",
        });
      });
    }
  });

  loadApplications().forEach((rec) => {
    const slots = getSlotsFromConfig(rec.configSnapshot);
    slots.forEach((slot) => {
      recordRows.push({
        模型: rec.modelName,
        场景: rec.scenario,
        备注: rec.note,
        记录时间: rec.createdAt,
        区域: slot.label,
        内容: rec.values[slot.id] ?? "",
        记录ID: rec.id,
      });
    });
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(folderRows.length ? folderRows : [{ 提示: "无" }]), "文件夹");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(docRows.length ? docRows : [{ 提示: "无" }]), "文档库");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recordRows.length ? recordRows : [{ 提示: "无" }]), "模型记录库");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nodeRows.length ? nodeRows : [{ 提示: "无" }]), "画布节点");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(edgeRows.length ? edgeRows : [{ 提示: "无" }]), "画布连线");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wordRows.length ? wordRows : [{ 提示: "无" }]), "Word");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(excelRows.length ? excelRows : [{ 提示: "无" }]), "Excel");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(modelRows.length ? modelRows : [{ 提示: "无" }]), "思维模型");
  XLSX.writeFile(wb, "vault.xlsx");
}
