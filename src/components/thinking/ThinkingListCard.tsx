"use client";

import { useLongPress } from "@/hooks/useLongPress";
import { thoughtStageBadgeClass } from "@/lib/thinking/stage-badge";
import type { ThoughtSessionSummary } from "@/lib/thinking/session-summary";
import type { ThoughtSession } from "@/lib/thinking/types";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

type Props = {
  session: ThoughtSession;
  summary: ThoughtSessionSummary;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

export function ThinkingListCard({
  session,
  summary,
  onClick,
  onContextMenu,
}: Props) {
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
    <Card className="bg-white p-0">
      <button
        type="button"
        className="w-full px-4 py-2.5 text-left transition-colors hover:bg-[#FAFBFC]"
        onClick={onClick}
        {...longPress.handlers}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-slate-800">
            {session.title}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${thoughtStageBadgeClass(summary.stageLabel)}`}
          >
            {summary.stageLabel}
          </span>
        </div>

        {summary.currentQuestion ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
            <span className="text-slate-500">待答 · </span>
            {summary.currentQuestion}
          </p>
        ) : summary.conclusion ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
            <span className="text-slate-500">结论 · </span>
            {summary.conclusion}
          </p>
        ) : null}

        <p className="mt-2 text-[10px] text-slate-400">
          {session.nodes.length} 个节点 · {formatDate(session.updatedAt)}
        </p>
      </button>
    </Card>
  );
}
