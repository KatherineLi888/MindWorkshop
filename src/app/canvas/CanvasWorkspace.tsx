"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DocumentLibrary } from "./DocumentLibrary";
import { addNodeToPane } from "./PaneCanvas";
import { WorkspacePane } from "./WorkspacePane";
import { downloadVaultExcel } from "./export-utils";
import {
  STORAGE_KEY,
  LAYOUT_LABELS,
  LAYOUT_MODES,
  createDocument,
  createFolder,
  createVault,
  gridClassForLayout,
  migrateStorage,
  resizeVault,
  slotIdsForLayout,
  touchDoc,
  type CanvasData,
  type DocType,
  type LayoutMode,
  type VaultDocument,
  type VaultState,
} from "./types";

const LEGACY_KEYS = [
  "knowledge-canvas-v4",
  "knowledge-canvas-v3",
  "knowledge-canvas-v2",
  "knowledge-canvas",
];

function loadVault(): VaultState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const m = migrateStorage(raw);
    if (m) return m;
  }
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      const m = migrateStorage(legacy);
      if (m) return m;
    }
  }
  return createVault("1x1");
}

function collectFolderIds(vault: VaultState, folderId: string): string[] {
  const ids = [folderId];
  Object.values(vault.folders).forEach((f) => {
    if (f.parentId === folderId) ids.push(...collectFolderIds(vault, f.id));
  });
  return ids;
}

function firstEmptySlotId(vault: VaultState): string | null {
  const ids = slotIdsForLayout(vault.layout);
  for (const id of ids) {
    if (!vault.slots[id]?.documentId) return id;
  }
  return null;
}

export function CanvasWorkspace() {
  const [vault, setVault] = useState<VaultState>(() => createVault("1x1"));
  const [ready, setReady] = useState(false);
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVault(loadVault());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
  }, [vault, ready]);

  useEffect(() => {
    if (!layoutMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
        setLayoutMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [layoutMenuOpen]);

  const activeSlot = vault.slots[vault.activeSlotId];
  const activeDoc = activeSlot?.documentId
    ? vault.documents[activeSlot.documentId]
    : null;

  const updateDoc = useCallback((doc: VaultDocument) => {
    setVault((prev) => ({
      ...prev,
      documents: { ...prev.documents, [doc.id]: touchDoc(doc) },
    }));
  }, []);

  const openDoc = (documentId: string, slotId?: string) => {
    setVault((prev) => {
      const target = slotId ?? prev.activeSlotId;
      return {
        ...prev,
        activeSlotId: target,
        slots: {
          ...prev.slots,
          [target]: { slotId: target, documentId },
        },
      };
    });
  };

  const openDocInNewPane = (documentId: string) => {
    setVault((prev) => {
      const empty = firstEmptySlotId(prev);
      const target = empty ?? prev.activeSlotId;
      return {
        ...prev,
        activeSlotId: target,
        slots: {
          ...prev.slots,
          [target]: { slotId: target, documentId },
        },
      };
    });
  };

  const createFolderIn = (parentId: string | null, name: string) => {
    const folder = createFolder(name, parentId);
    setVault((prev) => ({
      ...prev,
      folders: { ...prev.folders, [folder.id]: folder },
    }));
    return folder.id;
  };

  const createDocIn = (
    folderId: string | null,
    docType: DocType,
    opts?: {
      libraryModelId?: string;
      name?: string;
      modelMode?: import("./types").CanvasModelPanelMode;
    }
  ) => {
    const doc = createDocument(docType, {
      folderId,
      libraryModelId: opts?.libraryModelId,
      name: opts?.name,
      modelMode: opts?.modelMode,
    });
    setVault((prev) => ({
      ...prev,
      documents: { ...prev.documents, [doc.id]: doc },
      slots: {
        ...prev.slots,
        [prev.activeSlotId]: { slotId: prev.activeSlotId, documentId: doc.id },
      },
    }));
  };

  const deleteDoc = (docId: string) => {
    setVault((prev) => {
      const { [docId]: _, ...documents } = prev.documents;
      const slots = Object.fromEntries(
        Object.entries(prev.slots).map(([k, s]) => [
          k,
          s.documentId === docId ? { ...s, documentId: null } : s,
        ])
      );
      return { ...prev, documents, slots };
    });
  };

  const deleteFolder = (folderId: string) => {
    setVault((prev) => {
      const folderIds = collectFolderIds(prev, folderId);
      const docsToDelete = Object.values(prev.documents)
        .filter((d) => d.folderId && folderIds.includes(d.folderId))
        .map((d) => d.id);

      const folders = { ...prev.folders };
      folderIds.forEach((id) => delete folders[id]);

      const documents = { ...prev.documents };
      docsToDelete.forEach((id) => delete documents[id]);

      const slots = Object.fromEntries(
        Object.entries(prev.slots).map(([k, s]) => [
          k,
          s.documentId && docsToDelete.includes(s.documentId)
            ? { ...s, documentId: null }
            : s,
        ])
      );

      return { ...prev, folders, documents, slots };
    });
  };

  const renameFolder = (id: string, name: string) => {
    setVault((prev) => ({
      ...prev,
      folders: { ...prev.folders, [id]: { ...prev.folders[id], name } },
    }));
  };

  const renameDoc = (id: string, name: string) => {
    const doc = vault.documents[id];
    if (doc) updateDoc({ ...doc, name });
  };

  const closeSlot = (slotId: string) => {
    setVault((prev) => ({
      ...prev,
      slots: { ...prev.slots, [slotId]: { slotId, documentId: null } },
    }));
  };

  const setLayout = (layout: LayoutMode) => {
    setVault((prev) => resizeVault(prev, layout));
    setLayoutMenuOpen(false);
  };

  const addNode = () => {
    if (!activeDoc || activeDoc.docType !== "canvas") return;
    updateDoc({
      ...activeDoc,
      data: addNodeToPane(activeDoc.data as CanvasData),
    });
  };

  const slotIds = slotIdsForLayout(vault.layout);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#E2E8F0] px-3">
        <span className="mr-1 text-xs text-slate-400">知识画布</span>
        <div className="relative" ref={layoutMenuRef}>
          <button
            type="button"
            onClick={() => setLayoutMenuOpen((v) => !v)}
            className="rounded border border-[#E2E8F0] px-3 py-1 text-sm hover:bg-slate-50"
          >
            视角：{LAYOUT_LABELS[vault.layout]} ▾
          </button>
          {layoutMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 min-w-[9rem] rounded border border-[#E2E8F0] bg-white py-1 shadow-lg">
              {LAYOUT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLayout(mode)}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
                    vault.layout === mode ? "bg-blue-50 text-blue-700" : "text-slate-700"
                  }`}
                >
                  {LAYOUT_LABELS[mode]}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => downloadVaultExcel(vault)}
          className="rounded border border-[#E2E8F0] px-3 py-1 text-sm hover:bg-slate-50"
        >
          导出 Excel
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <DocumentLibrary
          vault={vault}
          activeDocumentId={activeSlot?.documentId ?? null}
          onOpen={openDoc}
          onOpenInNewPane={openDocInNewPane}
          onCreateFolder={createFolderIn}
          onCreateDoc={createDocIn}
          onRenameFolder={renameFolder}
          onRenameDoc={renameDoc}
          onDeleteFolder={deleteFolder}
          onDeleteDoc={deleteDoc}
        />

        <div
          className={`grid min-h-0 min-w-0 flex-1 gap-px bg-[#E2E8F0] ${gridClassForLayout(vault.layout)}`}
        >
          {slotIds.map((slotId) => {
            const slot = vault.slots[slotId];
            const doc = slot?.documentId
              ? vault.documents[slot.documentId]
              : null;
            const isActiveCanvas =
              vault.activeSlotId === slotId && doc?.docType === "canvas";
            return (
              <WorkspacePane
                key={slotId}
                document={doc ?? null}
                active={vault.activeSlotId === slotId}
                onFocus={() =>
                  setVault((prev) => ({ ...prev, activeSlotId: slotId }))
                }
                onUpdate={updateDoc}
                onClose={() => closeSlot(slotId)}
                onAddNode={isActiveCanvas ? addNode : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
