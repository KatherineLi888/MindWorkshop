"use client";

import { useState } from "react";
import { NoteTimeBadge } from "@/components/decision/NoteTimeBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { getDecisionNotes, type DecisionNoteEntry } from "@/lib/decisions/notes";
import { updateDecisionNotes } from "@/lib/decisions/storage";
import { cn } from "@/lib/utils";
import type { DecisionRow } from "@/types/database";

type Props = {
  decision: DecisionRow;
  onUpdated: (rows: DecisionRow[]) => void;
};

/** 详情上半区：添加备注 + 全部备注弹窗 */
export function DecisionNotesPanel({ decision, onUpdated }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [showInDisplay, setShowInDisplay] = useState(true);
  const [saving, setSaving] = useState(false);

  const allNotes = getDecisionNotes(decision);

  const persist = async (notes: DecisionNoteEntry[]) => {
    setSaving(true);
    try {
      onUpdated(await updateDecisionNotes(decision.id, notes));
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    const text = draft.trim();
    if (!text) return;
    const entry: DecisionNoteEntry = {
      id: crypto.randomUUID(),
      content: text,
      created_at: new Date().toISOString(),
      show_in_display: showInDisplay,
    };
    await persist([entry, ...allNotes]);
    setDraft("");
    setAddOpen(false);
  };

  const toggleDisplay = async (id: string) => {
    const next = allNotes.map((n) =>
      n.id === id ? { ...n, show_in_display: !n.show_in_display } : n
    );
    await persist(next);
  };

  const removeNote = async (id: string) => {
    await persist(allNotes.filter((n) => n.id !== id));
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant={addOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setAddOpen((v) => !v)}
        >
          {addOpen ? "收起" : "+ 添加备注"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAllOpen(true)}
          disabled={allNotes.length === 0}
        >
          全部备注{allNotes.length > 0 ? ` (${allNotes.length})` : ""}
        </Button>
      </div>

      {addOpen && (
        <div className="mt-2 flex flex-col gap-2 rounded-lg border border-[#E8ECF0] bg-[#FAFBFC] p-2.5 sm:flex-row sm:items-end">
          <Textarea
            className="min-h-0 flex-1 bg-white"
            rows={2}
            placeholder="记录想法、跟进事项…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
            <label className="flex items-center gap-1.5 whitespace-nowrap text-[10px] text-slate-500">
              <input
                type="checkbox"
                checked={showInDisplay}
                onChange={(e) => setShowInDisplay(e.target.checked)}
                className="rounded border-slate-300"
              />
              展示在上方
            </label>
            <Button
              variant="primary"
              size="sm"
              disabled={saving || !draft.trim()}
              onClick={addNote}
            >
              {saving ? "…" : "保存"}
            </Button>
          </div>
        </div>
      )}

      {allOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 sm:items-center"
          onClick={() => setAllOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
              <h3 className="text-sm font-medium text-slate-800">全部备注</h3>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-600"
                onClick={() => setAllOpen(false)}
              >
                关闭
              </button>
            </div>
            {allNotes.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">
                暂无备注
              </p>
            ) : (
            <ul className="flex-1 space-y-2 overflow-y-auto p-3 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
              {allNotes.map((n) => (
                <li
                  key={n.id}
                  className="flex gap-2 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2"
                >
                  <NoteTimeBadge iso={n.created_at} />
                  <div className="flex min-w-0 flex-1 gap-1.5">
                    <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-700">
                      {n.content}
                    </p>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-1">
                      <button
                        type="button"
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] transition-colors",
                          n.show_in_display
                            ? "bg-[#DBEAFE] text-[#1D4ED8]"
                            : "border border-[#E2E8F0] text-slate-400"
                        )}
                        onClick={() => toggleDisplay(n.id)}
                      >
                        展示
                      </button>
                      <button
                        type="button"
                        className="text-[10px] text-red-500 hover:underline"
                        onClick={() => removeNote(n.id)}
                      >
                        删
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
