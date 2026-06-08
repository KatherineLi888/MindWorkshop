"use client";

import { DecisionTagBadges } from "@/components/decision/DecisionTagBadges";
import { useLongPress } from "@/hooks/useLongPress";
import { cn, formatDateOnly } from "@/lib/utils";
import type { DecisionRow } from "@/types/database";

type Props = {
  row: DecisionRow;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

export function DecisionListCard({ row, onClick, onContextMenu }: Props) {
  const isAbandon = row.tag_outcome === "abandon";
  const conclusion =
    row.manual_conclusion?.trim() ||
    row.final_action ||
    "（待补充结论）";
  const goal = row.manual_goal?.trim();

  const longPress = useLongPress({
    onLongPress: (e) => {
      const touch = "touches" in e && e.touches[0] ? e.touches[0] : null;
      if (!touch) return;
      onContextMenu({
        preventDefault: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as React.MouseEvent);
    },
    onContextMenu,
  });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      {...longPress.handlers}
      className={cn(
        "group cursor-pointer rounded-xl border px-3.5 py-2.5 text-left shadow-sm transition-colors",
        isAbandon
          ? "border-slate-200 bg-slate-50 hover:bg-slate-100/90"
          : "border-[#E8ECF0] bg-white hover:border-[#C7D2FE] hover:bg-[#FAFBFC]"
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3
            className={cn(
              "truncate text-sm font-medium leading-snug",
              isAbandon
                ? "text-slate-400 line-through decoration-slate-400"
                : "text-slate-900 group-hover:text-[#3B82F6]"
            )}
          >
            {row.title}
          </h3>
          <p
            className={cn(
              "mt-1 line-clamp-1 text-xs",
              isAbandon
                ? "text-slate-400 line-through decoration-slate-300"
                : "text-slate-600"
            )}
          >
            <span className={isAbandon ? "text-slate-400" : "text-slate-400"}>
              结论：
            </span>
            {conclusion}
          </p>
          {goal && (
            <p
              className={cn(
                "mt-0.5 line-clamp-1 text-xs",
                isAbandon ? "text-slate-400 line-through" : "text-slate-500"
              )}
            >
              <span className="text-slate-400">目标：</span>
              {goal}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <DecisionTagBadges row={row} />
          <p
            className={cn(
              "mt-1 whitespace-nowrap text-[10px]",
              isAbandon ? "text-slate-400" : "text-slate-400"
            )}
          >
            {formatDateOnly(row.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}
