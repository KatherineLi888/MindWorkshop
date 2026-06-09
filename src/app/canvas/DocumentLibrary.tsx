"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { NameDialog } from "./NameDialog";
import { PickModelDialog } from "./PickModelDialog";
import {
  DOC_TYPE_ICONS,
  DOC_TYPE_LABELS,
  getFolderChildren,
  type DocType,
  type VaultDocument,
  type VaultFolder,
  type VaultState,
} from "./types";

type DeleteTarget =
  | { kind: "doc"; id: string; name: string }
  | { kind: "folder"; id: string; name: string };

type ContextTarget =
  | { kind: "root" }
  | { kind: "folder"; id: string; name: string }
  | { kind: "doc"; id: string; name: string };

type NameDialogState =
  | { type: "folder"; parentId: string | null }
  | { type: "rename-folder"; id: string; defaultValue: string }
  | { type: "rename-doc"; id: string; defaultValue: string };

type Props = {
  vault: VaultState;
  activeDocumentId: string | null;
  /** sidebar：左侧栏；page：手机全屏子页 */
  variant?: "sidebar" | "page";
  onClose?: () => void;
  onOpen: (docId: string) => void;
  onOpenInNewPane: (docId: string) => void;
  onCreateFolder: (parentId: string | null, name: string) => string;
  onCreateDoc: (
    folderId: string | null,
    docType: DocType,
    opts?: {
      libraryModelId?: string;
      name?: string;
      modelMode?: import("./types").CanvasModelPanelMode;
    }
  ) => void;
  onRenameFolder: (id: string, name: string) => void;
  onRenameDoc: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onDeleteDoc: (id: string) => void;
};

function TreeBranch({
  vault,
  parentId,
  depth,
  expanded,
  toggleExpand,
  activeDocumentId,
  onOpen,
  onOpenInNewPane,
  onContextMenu,
}: {
  vault: VaultState;
  parentId: string | null;
  depth: number;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  activeDocumentId: string | null;
  onOpen: (id: string) => void;
  onOpenInNewPane: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, target: ContextTarget) => void;
}) {
  const children = getFolderChildren(vault, parentId);

  return (
    <>
      {children.map((node) => {
        if (node.kind === "folder") {
          const folder = node.item as VaultFolder;
          const isOpen = expanded.has(folder.id);
          const hasChildren = getFolderChildren(vault, folder.id).length > 0;
          return (
            <div key={folder.id}>
              <div
                className="flex items-center gap-0.5 rounded py-1 pr-1 text-xs text-slate-700 hover:bg-white"
                style={{ paddingLeft: depth * 12 + 4 }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onContextMenu(e, { kind: "folder", id: folder.id, name: folder.name });
                }}
              >
                <button
                  type="button"
                  className="w-4 shrink-0 text-slate-400"
                  onClick={() => toggleExpand(folder.id)}
                >
                  {hasChildren ? (isOpen ? "▾" : "▸") : "·"}
                </button>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                  onClick={() => toggleExpand(folder.id)}
                >
                  <span className="text-slate-400">📁</span>
                  <span className="truncate">{folder.name}</span>
                </button>
              </div>
              {isOpen && (
                <TreeBranch
                  vault={vault}
                  parentId={folder.id}
                  depth={depth + 1}
                  expanded={expanded}
                  toggleExpand={toggleExpand}
                  activeDocumentId={activeDocumentId}
                  onOpen={onOpen}
                  onOpenInNewPane={onOpenInNewPane}
                  onContextMenu={onContextMenu}
                />
              )}
            </div>
          );
        }

        const doc = node.item as VaultDocument;
        return (
          <div
            key={doc.id}
            className={`flex items-center gap-1 rounded py-1 pr-1 text-xs ${
              activeDocumentId === doc.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-700 hover:bg-white"
            }`}
            style={{ paddingLeft: depth * 12 + 20 }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onContextMenu(e, { kind: "doc", id: doc.id, name: doc.name });
            }}
          >
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) onOpenInNewPane(doc.id);
                else onOpen(doc.id);
              }}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white text-[9px] text-slate-500 ring-1 ring-[#E2E8F0]">
                {DOC_TYPE_ICONS[doc.docType]}
              </span>
              <span className="min-w-0 flex-1 truncate">{doc.name}</span>
              <span className="shrink-0 text-[9px] text-slate-400">
                {DOC_TYPE_LABELS[doc.docType]}
              </span>
            </button>
          </div>
        );
      })}
    </>
  );
}

export function DocumentLibrary({
  vault,
  activeDocumentId,
  variant = "sidebar",
  onClose,
  onOpen,
  onOpenInNewPane,
  onCreateFolder,
  onCreateDoc,
  onRenameFolder,
  onRenameDoc,
  onDeleteFolder,
  onDeleteDoc,
}: Props) {
  const isPage = variant === "page";

  const handleOpen = (docId: string) => {
    onOpen(docId);
    if (isPage) onClose?.();
  };
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(Object.keys(vault.folders))
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    target: ContextTarget;
  } | null>(null);
  const [nameDialog, setNameDialog] = useState<NameDialogState | null>(null);
  const [modelPickFolderId, setModelPickFolderId] = useState<string | null | undefined>(
    undefined
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandFolder = (id: string | null) => {
    if (!id) return;
    setExpanded((prev) => new Set([...prev, id]));
  };

  const openContextMenu = (e: React.MouseEvent, target: ContextTarget) => {
    setContextMenu({ x: e.clientX, y: e.clientY, target });
  };

  /** 新建文件夹：与当前项同级（Obsidian 根级/同级逻辑） */
  const siblingParentId = (target: ContextTarget): string | null => {
    if (target.kind === "folder") {
      return vault.folders[target.id]?.parentId ?? null;
    }
    return null;
  };

  /** 新建文档：落在当前文件夹内；根级则为 null */
  const docParentFolderId = (target: ContextTarget): string | null => {
    if (target.kind === "folder") return target.id;
    return null;
  };

  const buildContextItems = (): ContextMenuItem[] => {
    if (!contextMenu) return [];
    const { target } = contextMenu;
    const folderId = docParentFolderId(target);

    if (target.kind === "doc") {
      const docItems: ContextMenuItem[] = [
        { type: "action", label: "打开", onClick: () => handleOpen(target.id) },
      ];
      if (!isPage) {
        docItems.push({
          type: "action",
          label: "在新栏打开",
          onClick: () => onOpenInNewPane(target.id),
        });
      }
      docItems.push({ type: "separator" });
      return [
        ...docItems,
        {
          type: "action",
          label: "重命名",
          onClick: () =>
            setNameDialog({
              type: "rename-doc",
              id: target.id,
              defaultValue: target.name,
            }),
        },
        {
          type: "action",
          label: "删除文档…",
          danger: true,
          onClick: () =>
            setDeleteTarget({ kind: "doc", id: target.id, name: target.name }),
        },
      ];
    }

    const items: ContextMenuItem[] = [
      {
        type: "action",
        label: "新建文件夹",
        onClick: () =>
          setNameDialog({
            type: "folder",
            parentId: siblingParentId(target),
          }),
      },
      { type: "separator" },
      {
        type: "action",
        label: `新建 ${DOC_TYPE_LABELS.word}`,
        onClick: () => onCreateDoc(folderId, "word"),
      },
      {
        type: "action",
        label: `新建 ${DOC_TYPE_LABELS.excel}`,
        onClick: () => onCreateDoc(folderId, "excel"),
      },
      {
        type: "action",
        label: `新建 ${DOC_TYPE_LABELS.canvas}`,
        onClick: () => onCreateDoc(folderId, "canvas"),
      },
      { type: "separator" },
      {
        type: "action" as const,
        label: "思维模型（从模型库）",
        onClick: () => {
          setModelPickFolderId(folderId);
          setContextMenu(null);
        },
      },
    ];

    if (target.kind === "folder") {
      items.push(
        { type: "separator" },
        {
          type: "action",
          label: "重命名文件夹",
          onClick: () =>
            setNameDialog({
              type: "rename-folder",
              id: target.id,
              defaultValue: target.name,
            }),
        },
        {
          type: "action",
          label: "删除文件夹…",
          danger: true,
          onClick: () =>
            setDeleteTarget({
              kind: "folder",
              id: target.id,
              name: target.name,
            }),
        }
      );
    }

    return items;
  };

  const isEmpty =
    getFolderChildren(vault, null).length === 0;

  return (
    <>
      <aside
        className={
          isPage
            ? "flex min-h-0 flex-1 flex-col bg-white"
            : "flex w-60 shrink-0 flex-col border-r border-[#E2E8F0] bg-slate-50/50"
        }
      >
        <div className="border-b border-[#E2E8F0] px-3 py-2">
          {isPage ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                ← 返回
              </button>
              <p className="text-xs font-medium text-slate-700">文档库</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-slate-700">文档库</p>
              <p className="text-[10px] text-slate-400">空白处右键新建</p>
            </>
          )}
          {isPage && (
            <p className="mt-1 text-[10px] text-slate-400">空白处右键新建</p>
          )}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto py-1"
          onContextMenu={(e) => {
            e.preventDefault();
            openContextMenu(e, { kind: "root" });
          }}
        >
          {isEmpty ? (
            <p className="px-4 py-6 text-center text-[10px] text-slate-400">
              右键此处新建文件夹或文档
            </p>
          ) : (
            <TreeBranch
              vault={vault}
              parentId={null}
              depth={0}
              expanded={expanded}
              toggleExpand={toggleExpand}
              activeDocumentId={activeDocumentId}
              onOpen={handleOpen}
              onOpenInNewPane={onOpenInNewPane}
              onContextMenu={openContextMenu}
            />
          )}
        </div>

        <div className="border-t border-[#E2E8F0] px-2 py-2 text-[10px] leading-relaxed text-slate-400">
          {isPage ? (
            <>单击打开文档 · 右键新建 / 删除需确认</>
          ) : (
            <>
              单击打开 · Ctrl+单击新栏
              <br />
              右键新建 / 删除需确认
            </>
          )}
        </div>
      </aside>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={buildContextItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      <NameDialog
        open={nameDialog?.type === "folder"}
        title="新建文件夹"
        label="文件夹名称"
        defaultValue="新建文件夹"
        onCancel={() => setNameDialog(null)}
        onConfirm={(name) => {
          if (nameDialog?.type !== "folder") return;
          const parentId = nameDialog.parentId;
          const newId = onCreateFolder(parentId, name);
          if (parentId) expandFolder(parentId);
          expandFolder(newId);
          setNameDialog(null);
        }}
      />

      <NameDialog
        open={nameDialog?.type === "rename-folder"}
        title="重命名文件夹"
        label="新名称"
        defaultValue={
          nameDialog?.type === "rename-folder" ? nameDialog.defaultValue : ""
        }
        onCancel={() => setNameDialog(null)}
        onConfirm={(name) => {
          if (nameDialog?.type === "rename-folder") {
            onRenameFolder(nameDialog.id, name);
          }
          setNameDialog(null);
        }}
      />

      <NameDialog
        open={nameDialog?.type === "rename-doc"}
        title="重命名文档"
        label="新名称"
        defaultValue={
          nameDialog?.type === "rename-doc" ? nameDialog.defaultValue : ""
        }
        onCancel={() => setNameDialog(null)}
        onConfirm={(name) => {
          if (nameDialog?.type === "rename-doc") {
            onRenameDoc(nameDialog.id, name);
          }
          setNameDialog(null);
        }}
      />

      <PickModelDialog
        open={modelPickFolderId !== undefined}
        title="新建思维模型文档"
        showMode
        onCancel={() => setModelPickFolderId(undefined)}
        onConfirm={({ libraryModelId, modelName, mode }) => {
          if (modelPickFolderId !== undefined) {
            onCreateDoc(modelPickFolderId, "model", {
              libraryModelId,
              name: modelName,
              modelMode: mode,
            });
          }
          setModelPickFolderId(undefined);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.kind === "folder" ? "删除文件夹" : "删除文档"}
        message={
          deleteTarget?.kind === "folder"
            ? `确定删除文件夹「${deleteTarget.name}」及其内全部文档？此操作不可撤销。`
            : `确定删除文档「${deleteTarget?.name}」？文档将从库中永久移除。`
        }
        confirmLabel="确认删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === "folder") onDeleteFolder(deleteTarget.id);
          else onDeleteDoc(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
