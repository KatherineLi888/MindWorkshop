"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ENTITY_LABELS } from "@/lib/entity-labels";
import {
  loadLinkTargets,
  persistEntityLink,
  type LinkTarget,
} from "@/lib/entity-links/storage";
import type { EntityType } from "@/types/database";

type Props = {
  open: boolean;
  fromType: EntityType;
  fromId: string;
  onClose: () => void;
  onLinked?: () => void;
};

export function LinkEntityDialog({
  open,
  fromType,
  fromId,
  onClose,
  onLinked,
}: Props) {
  const [targets, setTargets] = useState<LinkTarget[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!open) return;
    setSelected("");
    setFilter("all");
    loadLinkTargets().then(setTargets);
  }, [open]);

  const typeOptions = useMemo(() => {
    const types = new Set(targets.map((t) => t.type));
    return ["all", ...Array.from(types)];
  }, [targets]);

  const filtered = useMemo(() => {
    const pool = targets.filter(
      (t) => !(t.type === fromType && t.id === fromId)
    );
    if (filter === "all") return pool;
    return pool.filter((t) => t.type === filter);
  }, [targets, filter, fromType, fromId]);

  const save = async () => {
    if (!selected) return;
    const [toType, toId] = selected.split(":");
    setLoading(true);
    const ok = await persistEntityLink({
      fromType,
      fromId,
      toType: toType as EntityType,
      toId,
    });
    setLoading(false);
    if (ok) {
      onLinked?.();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#E2E8F0] px-4 py-3">
          <h3 className="text-sm font-medium">关联到</h3>
          <p className="mt-0.5 text-[10px] text-slate-400">
            可关联决策、目标、思考、模型套用、画布文档等
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-[#EEF1F5] px-2 py-1.5">
          {typeOptions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] ${
                filter === t
                  ? "bg-[#EEF2FF] font-medium text-[#4338CA]"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t === "all" ? "全部" : ENTITY_LABELS[t as EntityType] ?? t}
            </button>
          ))}
        </div>

        <div className="max-h-64 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-400">
              暂无可关联项
            </p>
          ) : (
            filtered.map((t) => (
              <label
                key={`${t.type}:${t.id}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 hover:bg-[#F8FAFC]"
              >
                <input
                  type="radio"
                  name="link"
                  value={`${t.type}:${t.id}`}
                  checked={selected === `${t.type}:${t.id}`}
                  onChange={() => setSelected(`${t.type}:${t.id}`)}
                />
                <span className="shrink-0 text-[10px] text-slate-400">
                  {ENTITY_LABELS[t.type]}
                </span>
                <span className="truncate text-sm">{t.title}</span>
              </label>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E2E8F0] p-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selected || loading}
            onClick={save}
          >
            确认关联
          </Button>
        </div>
      </div>
    </div>
  );
}
