"use client";

import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import {
  resolveNodeAppearance,
  type ThoughtNodeEmphasis,
} from "@/lib/thinking/node-appearance";
import { THINK_FONT_FAMILY } from "@/lib/thinking/methods";
import {
  getChildNodes,
  getTextChildLayout,
  type TextChildLayout,
} from "@/lib/thinking/text-board";
import type { ThoughtNode, ThoughtSession } from "@/lib/thinking/types";
import { cn } from "@/lib/utils";

type Props = {
  session: ThoughtSession;
  rootId: string;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onToggleChildLayout: (parentId: string) => void;
};

function emphasisTextClass(emphasis?: ThoughtNodeEmphasis): string {
  switch (emphasis) {
    case "text-red":
      return "text-red-600";
    case "text-blue":
      return "text-blue-600";
    case "text-amber":
      return "text-amber-600";
    default:
      return "";
  }
}

function TextBlock({
  node,
  session,
  selectedIds,
  onSelect,
  onToggleChildLayout,
  depth,
}: {
  node: ThoughtNode;
  session: ThoughtSession;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onToggleChildLayout: (parentId: string) => void;
  depth: number;
}) {
  const { getMethod } = useThinkingMethods();
  const appearance = resolveNodeAppearance(node, getMethod);
  const children = getChildNodes(session.nodes, node.id);
  const selected = selectedIds.has(node.id);
  const childLayout = getTextChildLayout(session, node.id, children.length);
  const canSplit = children.length >= 2;

  const block = (
    <button
      type="button"
      onClick={(e) => onSelect(node.id, e.ctrlKey || e.metaKey)}
      className={cn(
        "w-full rounded-xl border text-left transition",
        selected
          ? "border-[#3B82F6] ring-2 ring-[#BFDBFE]"
          : "border-[#E2E8F0] hover:border-[#CBD5E1]"
      )}
      style={{
        background: appearance.fill,
        borderColor: selected ? undefined : appearance.stroke,
        fontFamily: THINK_FONT_FAMILY,
      }}
    >
      {appearance.methodRail && (
        <div
          className="flex items-center gap-2 rounded-t-xl px-3 py-1.5 text-[11px] font-bold"
          style={{
            background: appearance.methodRail.railBg,
            color: appearance.methodRail.color,
          }}
        >
          {appearance.methodRail.label}
        </div>
      )}
      {node.type === "merge" && (
        <div className="rounded-t-xl bg-slate-100 px-3 py-1 text-[10px] font-medium text-slate-500">
          合并
        </div>
      )}
      <div
        className={cn(
          "px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          emphasisTextClass(node.emphasis),
          node.type === "topic" && "text-base font-bold text-slate-900",
          node.type === "question" && "font-semibold text-slate-800",
          node.type === "answer" && "text-slate-700"
        )}
        style={{
          color: appearance.text,
          fontWeight: appearance.fontWeight,
          fontSize: node.type === "topic" ? 16 : appearance.fontSize,
        }}
      >
        {node.content || "（空）"}
        {node.marksProgress && (
          <span className="ml-2 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
            推进
          </span>
        )}
      </div>
    </button>
  );

  if (!children.length) {
    return <div className={depth > 0 ? "min-w-0" : ""}>{block}</div>;
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "min-w-0")}>
      {block}
      <div className="pl-2 sm:pl-3">
        {(node.type === "question" || node.type === "topic") && canSplit && (
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => onToggleChildLayout(node.id)}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
            >
              {childLayout === "split" ? "⇅ 改为上下排列" : "⇄ 改为左右分栏"}
            </button>
          </div>
        )}
        <ChildrenGroup
          children={children}
          layout={childLayout}
          session={session}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggleChildLayout={onToggleChildLayout}
          depth={depth + 1}
        />
      </div>
    </div>
  );
}

function ChildrenGroup({
  children,
  layout,
  session,
  selectedIds,
  onSelect,
  onToggleChildLayout,
  depth,
}: {
  children: ThoughtNode[];
  layout: TextChildLayout;
  session: ThoughtSession;
  selectedIds: Set<string>;
  onSelect: (id: string, additive: boolean) => void;
  onToggleChildLayout: (parentId: string) => void;
  depth: number;
}) {
  if (layout === "split") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {children.map((child) => (
          <TextBlock
            key={child.id}
            node={child}
            session={session}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleChildLayout={onToggleChildLayout}
            depth={depth}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {children.map((child) => (
        <TextBlock
          key={child.id}
          node={child}
          session={session}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggleChildLayout={onToggleChildLayout}
          depth={depth}
        />
      ))}
    </div>
  );
}

export function ThinkingTextBoard({
  session,
  rootId,
  selectedIds,
  onSelect,
  onToggleChildLayout,
}: Props) {
  const root = session.nodes.find((n) => n.id === rootId);
  if (!root) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">暂无思考内容</p>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <TextBlock
        node={root}
        session={session}
        selectedIds={selectedIds}
        onSelect={onSelect}
        onToggleChildLayout={onToggleChildLayout}
        depth={0}
      />
    </div>
  );
}
