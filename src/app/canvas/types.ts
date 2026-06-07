import type { Edge, Node } from "reactflow";
import { stripHtmlToMarkdown } from "./markdown";
import {
  FRAMEWORK_TO_LIBRARY,
  migrateLegacyCells,
  resolveLibraryModel,
} from "@/lib/models/canvas-bridge";
import { emptySlotValues } from "@/lib/models/helpers";
import { createModelCells } from "./model-frameworks";

export type NodeTag =
  | "theme"
  | "summary"
  | "concept"
  | "inspiration"
  | "link"
  | "other";

export type LayoutMode = "1x1" | "1x2" | "2x1" | "2x2" | "3x2";

/** 每种文档只能有一种类型 */
export type DocType = "word" | "excel" | "canvas" | "model";

export type ModelFrameworkId =
  | "eisenhower"
  | "swot"
  | "stages-4"
  | "stages-5"
  | "pdca"
  | "priority-3x3"
  | "pros-cons"
  | "5w1h"
  | "blank-2x2";

export type CanvasNodeData = {
  title: string;
  content: string;
  color: string;
  tag: NodeTag;
  collapsed: boolean;
  relations: string[];
  /** 引用的理论库条目 */
  theoryRefs?: { theoryId: string; label?: string }[];
  createdAt: string;
};

export type EdgeLabelData = { label: string };

export type WordData = { markdown: string };

export type ExcelData = {
  cells: string[][];
};

export type CanvasData = {
  nodes: Node<CanvasNodeData>[];
  edges: Edge<EdgeLabelData>[];
  viewport?: { x: number; y: number; zoom: number };
  /** 画布角落挂载的思维模型 */
  modelPanels?: CanvasModelPanel[];
  /** 画布角落引用的理论 */
  theoryPanels?: CanvasTheoryPanel[];
};

export type ModelCell = {
  id: string;
  title: string;
  content: string;
};

export type CanvasModelPanelCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type CanvasModelPanelMode = "display" | "apply";

/** 画布上角落挂载的模型面板 */
export type CanvasModelPanel = {
  id: string;
  libraryModelId: string;
  corner: CanvasModelPanelCorner;
  mode: CanvasModelPanelMode;
  collapsed: boolean;
  values: Record<string, string>;
};

/** 画布上角落引用的理论面板 */
export type CanvasTheoryPanel = {
  id: string;
  theoryId: string;
  corner: CanvasModelPanelCorner;
  collapsed: boolean;
};

export type ModelData = {
  /** 关联模型库的模型 id */
  libraryModelId: string;
  mode: CanvasModelPanelMode;
  values: Record<string, string>;
  /** @deprecated 旧版画布框架 */
  frameworkId?: ModelFrameworkId;
  cells?: ModelCell[];
};

/** 模型使用记录（归入对应框架库，如 PDCA 库） */
export type ModelRecord = {
  id: string;
  frameworkId: ModelFrameworkId;
  sourceDocId: string;
  sourceDocName: string;
  scenario: string;
  note: string;
  createdAt: string;
  cells: ModelCell[];
};

export type DocData = WordData | ExcelData | CanvasData | ModelData;

export type VaultFolder = {
  id: string;
  name: string;
  parentId: string | null;
  sortIndex: number;
};

export type VaultDocument = {
  id: string;
  name: string;
  folderId: string | null;
  sortIndex: number;
  docType: DocType;
  createdAt: string;
  updatedAt: string;
  data: DocData;
};

export type PaneSlot = {
  slotId: string;
  documentId: string | null;
};

export type VaultState = {
  folders: Record<string, VaultFolder>;
  documents: Record<string, VaultDocument>;
  modelRecords: ModelRecord[];
  layout: LayoutMode;
  activeSlotId: string;
  slots: Record<string, PaneSlot>;
};

export const STORAGE_KEY = "knowledge-vault-v5";

export const PRESET_COLORS = [
  "#FEF3C7",
  "#DBEAFE",
  "#D1FAE5",
  "#FCE7F3",
  "#EDE9FE",
  "#F1F5F9",
];

export const TAG_OPTIONS: { value: NodeTag; label: string }[] = [
  { value: "theme", label: "主题" },
  { value: "summary", label: "文章摘要" },
  { value: "concept", label: "概念" },
  { value: "inspiration", label: "灵感" },
  { value: "link", label: "外部链接" },
  { value: "other", label: "其他" },
];

export const TAG_LABELS = Object.fromEntries(
  TAG_OPTIONS.map((o) => [o.value, o.label])
) as Record<NodeTag, string>;

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  word: "Word",
  excel: "Excel",
  canvas: "画布",
  model: "思维模型",
};

export const DOC_TYPE_ICONS: Record<DocType, string> = {
  word: "W",
  excel: "X",
  canvas: "◫",
  model: "M",
};

export const LAYOUT_SPECS: Record<LayoutMode, { label: string; cols: number; rows: number }> = {
  "1x1": { label: "单栏", cols: 1, rows: 1 },
  "1x2": { label: "上下分屏", cols: 1, rows: 2 },
  "2x1": { label: "左右分屏", cols: 2, rows: 1 },
  "2x2": { label: "2×2 四分屏", cols: 2, rows: 2 },
  "3x2": { label: "3×2 六分屏", cols: 3, rows: 2 },
};

export const LAYOUT_LABELS: Record<LayoutMode, string> = Object.fromEntries(
  Object.entries(LAYOUT_SPECS).map(([k, v]) => [k, v.label])
) as Record<LayoutMode, string>;

export const LAYOUT_MODES = Object.keys(LAYOUT_SPECS) as LayoutMode[];

export function slotIdsForLayout(layout: LayoutMode): string[] {
  const spec = LAYOUT_SPECS[layout] ?? LAYOUT_SPECS["1x1"];
  return Array.from({ length: spec.cols * spec.rows }, (_, i) => {
    const r = Math.floor(i / spec.cols);
    const c = i % spec.cols;
    return `${r}-${c}`;
  });
}

const LAYOUT_GRID_CLASS: Record<LayoutMode, string> = {
  "1x1": "grid-cols-1 grid-rows-1",
  "1x2": "grid-cols-1 grid-rows-2",
  "2x1": "grid-cols-2 grid-rows-1",
  "2x2": "grid-cols-2 grid-rows-2",
  "3x2": "grid-cols-3 grid-rows-2",
};

export function gridClassForLayout(layout: LayoutMode): string {
  return LAYOUT_GRID_CLASS[layout] ?? LAYOUT_GRID_CLASS["1x1"];
}

function emptyExcel(): ExcelData {
  return {
    cells: Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => "")),
  };
}

export function createDocumentData(
  docType: DocType,
  frameworkId?: ModelFrameworkId
): DocData {
  switch (docType) {
    case "word":
      return { markdown: "" };
    case "excel":
      return emptyExcel();
    case "canvas":
      return { nodes: [], edges: [] };
    case "model": {
      const libId =
        frameworkId && FRAMEWORK_TO_LIBRARY[frameworkId]
          ? FRAMEWORK_TO_LIBRARY[frameworkId]
          : frameworkId && resolveLibraryModel(frameworkId)
            ? frameworkId
            : "eisenhower";
      const lib = resolveLibraryModel(libId);
      return {
        libraryModelId: lib?.id ?? libId,
        mode: "apply",
        values: lib ? emptySlotValues(lib.config) : {},
      };
    }
  }
}

export function createDocument(
  docType: DocType,
  opts?: {
    name?: string;
    folderId?: string | null;
    frameworkId?: ModelFrameworkId;
    libraryModelId?: string;
    modelMode?: CanvasModelPanelMode;
    sortIndex?: number;
  }
): VaultDocument {
  const now = new Date().toISOString();
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: opts?.name ?? `未命名${DOC_TYPE_LABELS[docType]}`,
    folderId: opts?.folderId ?? null,
    sortIndex: opts?.sortIndex ?? Date.now(),
    docType,
    createdAt: now,
    updatedAt: now,
    data:
      docType === "model" && opts?.libraryModelId
        ? (() => {
            const lib = resolveLibraryModel(opts.libraryModelId);
            return {
              libraryModelId: lib?.id ?? opts.libraryModelId,
              mode: opts.modelMode ?? "apply",
              values: lib ? emptySlotValues(lib.config) : {},
            };
          })()
        : createDocumentData(docType, opts?.frameworkId),
  };
}

export function createFolder(
  name: string,
  parentId: string | null = null
): VaultFolder {
  return {
    id: `folder-${Date.now()}`,
    name,
    parentId,
    sortIndex: Date.now(),
  };
}

export function createVault(layout: LayoutMode = "1x1"): VaultState {
  const welcome = createDocument("canvas", {
    name: "欢迎画布",
    folderId: null,
  });

  const ids = slotIdsForLayout(layout);
  return {
    folders: {},
    documents: { [welcome.id]: welcome },
    modelRecords: [],
    layout,
    activeSlotId: ids[0],
    slots: Object.fromEntries(
      ids.map((slotId, i) => [
        slotId,
        { slotId, documentId: i === 0 ? welcome.id : null },
      ])
    ),
  };
}

/** 去掉默认「我的文档」壳，子项提升到同级 */
export function normalizeVaultStructure(vault: VaultState): VaultState {
  const inbox = Object.values(vault.folders).find(
    (f) => f.name === "我的文档" && f.parentId === null
  );
  if (!inbox) return vault;

  const folders = { ...vault.folders };
  delete folders[inbox.id];

  for (const f of Object.values(folders)) {
    if (f.parentId === inbox.id) {
      folders[f.id] = { ...f, parentId: null };
    }
  }

  const documents = Object.fromEntries(
    Object.entries(vault.documents).map(([id, d]) => [
      id,
      d.folderId === inbox.id ? { ...d, folderId: null } : d,
    ])
  );

  return { ...vault, folders, documents };
}

export function resizeVault(prev: VaultState, layout: LayoutMode): VaultState {
  const ids = slotIdsForLayout(layout);
  const slots: Record<string, PaneSlot> = {};
  ids.forEach((slotId) => {
    slots[slotId] = prev.slots[slotId] ?? { slotId, documentId: null };
  });
  return {
    ...prev,
    layout,
    activeSlotId: ids.includes(prev.activeSlotId) ? prev.activeSlotId : ids[0],
    slots,
  };
}

export function touchDoc(doc: VaultDocument): VaultDocument {
  return { ...doc, updatedAt: new Date().toISOString() };
}

export function createEmptyNode(
  position: { x: number; y: number }
): Node<CanvasNodeData> {
  return {
    id: `node-${Date.now()}`,
    type: "card",
    position,
    data: {
      title: "新节点",
      content: "",
      color: PRESET_COLORS[0],
      tag: "theme",
      collapsed: false,
      relations: [],
      createdAt: new Date().toISOString(),
    },
  };
}

export type TreeNode =
  | { kind: "folder"; item: VaultFolder }
  | { kind: "document"; item: VaultDocument };

export function getFolderChildren(
  vault: VaultState,
  parentId: string | null
): TreeNode[] {
  const folders = Object.values(vault.folders)
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((item) => ({ kind: "folder" as const, item }));

  const docs = Object.values(vault.documents)
    .filter((d) => d.folderId === parentId)
    .sort((a, b) => a.sortIndex - b.sortIndex)
    .map((item) => ({ kind: "document" as const, item }));

  return [...folders, ...docs];
}

export function migrateStorage(raw: string): VaultState | null {
  try {
    const saved = JSON.parse(raw);

    if (saved.folders && saved.documents && saved.slots) {
      const vault = saved as VaultState;
      if (!vault.modelRecords) vault.modelRecords = [];
      if ((vault.layout as string) === "3x3") vault.layout = "3x2";
      if (!LAYOUT_SPECS[vault.layout]) vault.layout = "1x1";
      vault.documents = normalizeDocuments(vault.documents);
      return normalizeVaultStructure(vault);
    }

    const rawLayout = saved.layout === "3x3" ? "3x2" : saved.layout;
    const vault = createVault(
      (rawLayout && LAYOUT_SPECS[rawLayout as LayoutMode]
        ? rawLayout
        : "1x1") as LayoutMode
    );
    const now = new Date().toISOString();

    const legacyDocs: Array<{
      title?: string;
      name?: string;
      viewType?: string;
      docType?: DocType;
      canvas?: CanvasData;
      word?: WordData;
      excel?: ExcelData;
      data?: DocData;
    }> = [];

    if (saved.documents && saved.slots && !saved.folders) {
      const migratedLayout =
        saved.layout === "3x3" ? "3x2" : saved.layout;
      const layoutVault = createVault(
        (migratedLayout && LAYOUT_SPECS[migratedLayout as LayoutMode]
          ? migratedLayout
          : "1x1") as LayoutMode
      );
      const now = new Date().toISOString();
      layoutVault.documents = {};

      for (const [i, d] of Object.entries(saved.documents) as [string, Record<string, unknown>][]) {
        const viewType = (d.viewType ?? d.docType ?? "canvas") as string;
        const docType: DocType =
          viewType === "word"
            ? "word"
            : viewType === "excel"
              ? "excel"
              : viewType === "model"
                ? "model"
                : "canvas";
        let data: DocData;
        if (docType === "word") {
          const w = d.word as { content?: string; html?: string; markdown?: string };
          data = normalizeWordData(w ?? d.data);
        } else if (docType === "excel") {
          data = (d.excel as ExcelData) ?? emptyExcel();
        } else if (docType === "model") {
          data = (d.data as ModelData) ?? createDocumentData("model", "eisenhower");
        } else {
          data = (d.canvas as CanvasData) ?? { nodes: [], edges: [] };
        }
        const id = (d.id as string) ?? `doc-migrated-${i}`;
        layoutVault.documents[id] = {
          id,
          name: (d.name ?? d.title ?? `文档 ${i}`) as string,
          folderId: null,
          sortIndex: Number(i),
          docType,
          createdAt: (d.createdAt as string) ?? now,
          updatedAt: (d.updatedAt as string) ?? now,
          data,
        };
      }
      layoutVault.slots = saved.slots;
      layoutVault.activeSlotId = saved.activeSlotId ?? layoutVault.activeSlotId;
      layoutVault.modelRecords = saved.modelRecords ?? [];
      return normalizeVaultStructure(layoutVault);
    }

    if (saved.documents) {
      for (const d of Object.values(saved.documents) as Array<Record<string, unknown>>) {
        legacyDocs.push(d as typeof legacyDocs[0]);
      }
    }

    if (legacyDocs.length > 0) {
      vault.documents = {};
      legacyDocs.forEach((d, i) => {
        const docType = (d.docType ?? d.viewType ?? "canvas") as DocType;
        const id = `doc-migrated-${i}-${Date.now()}`;
        let data: DocData;
        if (d.data) {
          data = d.data;
        } else if (docType === "word") {
          data = normalizeWordData(d.word ?? d.data);
        } else if (docType === "excel") {
          data = d.excel ?? emptyExcel();
        } else if (docType === "canvas") {
          data = d.canvas ?? { nodes: [], edges: [] };
        } else {
          data = createDocumentData("model", "eisenhower");
        }
        vault.documents[id] = {
          id,
          name: d.name ?? d.title ?? `迁移文档 ${i + 1}`,
          folderId: null,
          sortIndex: i,
          docType: docType === "model" ? "model" : docType === "word" ? "word" : docType === "excel" ? "excel" : "canvas",
          createdAt: now,
          updatedAt: now,
          data,
        };
      });
    }

    if (saved.slots) {
      vault.slots = saved.slots;
      vault.activeSlotId = saved.activeSlotId ?? vault.activeSlotId;
    }

    vault.modelRecords = saved.modelRecords ?? [];
    return normalizeVaultStructure(vault);
  } catch {
    return null;
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function normalizeWordData(raw: unknown): WordData {
  if (raw && typeof raw === "object" && "markdown" in raw) {
    return { markdown: String((raw as WordData).markdown) };
  }
  if (raw && typeof raw === "object" && "html" in raw) {
    return { markdown: stripHtmlToMarkdown(String((raw as { html: string }).html)) };
  }
  if (raw && typeof raw === "object" && "content" in raw) {
    return { markdown: String((raw as { content: string }).content) };
  }
  return { markdown: "" };
}

export function normalizeDocuments(
  documents: Record<string, VaultDocument>
): Record<string, VaultDocument> {
  const out = { ...documents };
  for (const [id, doc] of Object.entries(out)) {
    if (doc.docType === "word") {
      out[id] = { ...doc, data: normalizeWordData(doc.data) };
    }
    if (doc.docType === "model" && isModelData(doc.data)) {
      out[id] = { ...doc, data: normalizeModelData(doc.data) };
    }
    if (doc.docType === "canvas" && isCanvasData(doc.data)) {
      const canvas = doc.data as CanvasData;
      if (!canvas.modelPanels) {
        out[id] = { ...doc, data: { ...canvas, modelPanels: [] } };
      }
    }
  }
  return out;
}

export function createModelRecord(
  frameworkId: ModelFrameworkId,
  sourceDocId: string,
  sourceDocName: string,
  scenario: string,
  note: string,
  cells: ModelCell[]
): ModelRecord {
  return {
    id: `rec-${Date.now()}`,
    frameworkId,
    sourceDocId,
    sourceDocName,
    scenario,
    note,
    createdAt: new Date().toISOString(),
    cells: cells.map((c) => ({ ...c })),
  };
}

export function isCanvasData(data: DocData): data is CanvasData {
  return "nodes" in data;
}

export function isWordData(data: DocData): data is WordData {
  return "markdown" in data;
}

export function isExcelData(data: DocData): data is ExcelData {
  return "cells" in data && !("frameworkId" in data);
}

export function normalizeModelData(data: ModelData): ModelData {
  if (data.libraryModelId) {
    const lib = resolveLibraryModel(data.libraryModelId);
    return {
      libraryModelId: lib?.id ?? data.libraryModelId,
      mode: data.mode ?? "apply",
      values:
        data.values && Object.keys(data.values).length
          ? data.values
          : lib && data.cells?.length
            ? migrateLegacyCells(data.cells, lib.config)
            : lib
              ? emptySlotValues(lib.config)
              : {},
    };
  }
  const libId =
    data.frameworkId && FRAMEWORK_TO_LIBRARY[data.frameworkId]
      ? FRAMEWORK_TO_LIBRARY[data.frameworkId]
      : "eisenhower";
  const lib = resolveLibraryModel(libId);
  return {
    libraryModelId: lib?.id ?? libId,
    mode: "apply",
    values: lib
      ? data.cells?.length
        ? migrateLegacyCells(data.cells, lib.config)
        : emptySlotValues(lib.config)
      : {},
  };
}

export function isModelData(data: DocData): data is ModelData {
  return "libraryModelId" in data || "frameworkId" in data;
}

export function createCanvasModelPanel(
  libraryModelId: string,
  corner: CanvasModelPanelCorner,
  mode: CanvasModelPanelMode = "apply"
): CanvasModelPanel {
  const lib = resolveLibraryModel(libraryModelId);
  return {
    id: `panel-${Date.now()}`,
    libraryModelId: lib?.id ?? libraryModelId,
    corner,
    mode,
    collapsed: false,
    values: lib ? emptySlotValues(lib.config) : {},
  };
}

export function createCanvasTheoryPanel(
  theoryId: string,
  corner: CanvasModelPanelCorner
): CanvasTheoryPanel {
  return {
    id: `theory-panel-${Date.now()}`,
    theoryId,
    corner,
    collapsed: false,
  };
}
