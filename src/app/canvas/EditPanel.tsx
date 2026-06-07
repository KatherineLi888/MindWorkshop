"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PickTheoryDialog } from "./PickTheoryDialog";
import { MarkdownTextarea } from "./markdown";
import {
  PRESET_COLORS,
  TAG_OPTIONS,
  type CanvasNodeData,
  type NodeTag,
} from "./types";
import { getTheoryById } from "@/lib/theories/theory-store";
import { theoryDisplayTitle } from "@/lib/theories/helpers";

type Props = {
  nodeId: string;
  data: CanvasNodeData;
  onSave: (id: string, data: CanvasNodeData) => void;
  onClose: () => void;
};

export function EditPanel({ nodeId, data, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(data);
  const [pickTheoryOpen, setPickTheoryOpen] = useState(false);

  useEffect(() => {
    setDraft(data);
  }, [nodeId, data]);

  const update = <K extends keyof CanvasNodeData>(key: K, val: CanvasNodeData[K]) => {
    setDraft((d) => ({ ...d, [key]: val }));
  };

  const addRelation = () => {
    const name = prompt("输入关联对象名称（例如：目标：学习 ML）");
    if (name?.trim()) update("relations", [...draft.relations, name.trim()]);
  };

  const removeRelation = (idx: number) => {
    update(
      "relations",
      draft.relations.filter((_, i) => i !== idx)
    );
  };

  const theoryRefs = draft.theoryRefs ?? [];

  const addTheoryRef = (theoryId: string, label: string) => {
    if (theoryRefs.some((r) => r.theoryId === theoryId)) return;
    update("theoryRefs", [...theoryRefs, { theoryId, label }]);
    setPickTheoryOpen(false);
  };

  const removeTheoryRef = (theoryId: string) => {
    update(
      "theoryRefs",
      theoryRefs.filter((r) => r.theoryId !== theoryId)
    );
  };

  const save = () => {
    if (!draft.title.trim()) {
      alert("标题不能为空");
      return;
    }
    onSave(nodeId, { ...draft, title: draft.title.trim() });
    onClose();
  };

  return (
    <div
      className="absolute inset-y-0 right-0 z-50 flex w-full max-w-[min(20rem,100%)] flex-col border-l border-[#E2E8F0] bg-white shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
        <h2 className="text-sm font-medium text-slate-700">编辑节点</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <label className="block text-xs text-slate-500">
          标题 *
          <input
            className="mt-1 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none focus:border-[#3B82F6]"
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>

        <label className="block text-xs text-slate-500">
          详细内容（Markdown）
          <div className="mt-1 h-40 rounded border border-[#E2E8F0] bg-white">
            <MarkdownTextarea
              value={draft.content}
              onChange={(content) => update("content", content)}
            />
          </div>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={draft.collapsed}
            onChange={(e) => update("collapsed", e.target.checked)}
          />
          折叠内容（画布上隐藏详情）
        </label>

        <div>
          <p className="mb-1 text-xs text-slate-500">颜色标记</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`h-7 w-7 rounded-full border-2 ${
                  draft.color === c ? "border-[#3B82F6]" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => update("color", c)}
              />
            ))}
          </div>
        </div>

        <label className="block text-xs text-slate-500">
          类型标签
          <select
            className="mt-1 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none"
            value={draft.tag}
            onChange={(e) => update("tag", e.target.value as NodeTag)}
          >
            {TAG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-slate-500">关联理论</p>
            <button
              type="button"
              onClick={() => setPickTheoryOpen(true)}
              className="text-xs text-violet-600 hover:underline"
            >
              + 引用理论
            </button>
          </div>
          {theoryRefs.length === 0 ? (
            <p className="text-xs text-slate-400">暂无理论引用</p>
          ) : (
            <ul className="space-y-1">
              {theoryRefs.map((r) => {
                const t = getTheoryById(r.theoryId);
                const label = r.label || (t ? theoryDisplayTitle(t) : r.theoryId);
                return (
                  <li
                    key={r.theoryId}
                    className="flex items-center justify-between rounded bg-violet-50 px-2 py-1 text-xs text-violet-800"
                  >
                    <Link
                      href={`/theories/${r.theoryId}`}
                      className="min-w-0 truncate hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ◈ {label}
                    </Link>
                    <button
                      type="button"
                      className="shrink-0 text-slate-400 hover:text-red-500"
                      onClick={() => removeTheoryRef(r.theoryId)}
                    >
                      删
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs text-slate-500">关联到</p>
            <button
              type="button"
              onClick={addRelation}
              className="text-xs text-[#3B82F6] hover:underline"
            >
              + 添加关联
            </button>
          </div>
          {draft.relations.length === 0 ? (
            <p className="text-xs text-slate-400">暂无关联</p>
          ) : (
            <ul className="space-y-1">
              {draft.relations.map((r, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs text-slate-600"
                >
                  {r}
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => removeRelation(i)}
                  >
                    删
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-[#E2E8F0] p-4">
        <button
          type="button"
          onClick={save}
          className="w-full rounded bg-[#3B82F6] py-2 text-sm text-white hover:bg-blue-600"
        >
          保存
        </button>
      </div>

      <PickTheoryDialog
        open={pickTheoryOpen}
        title="节点引用理论"
        onCancel={() => setPickTheoryOpen(false)}
        onConfirm={({ theoryId, theoryTitle }) =>
          addTheoryRef(theoryId, theoryTitle)
        }
      />
    </div>
  );
}
