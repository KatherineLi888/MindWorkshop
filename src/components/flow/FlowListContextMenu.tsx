"use client";

import { ContextMenu } from "@/app/canvas/ContextMenu";
import type { ContextMenuItem } from "@/app/canvas/ContextMenu";
import { flowJumpButtonLabel } from "@/lib/flow/transitions";
import { FLOW_JUMP_TARGETS } from "@/lib/flow/transitions";
import type { FlowStage } from "@/lib/flow/types";
import { useFlowJump } from "./useFlowJump";

type Props = {
  fromStage: FlowStage;
  title: string;
  entityId: string;
  x: number;
  y: number;
  onClose: () => void;
  /** 额外菜单项（如删除、归档） */
  extraItems?: ContextMenuItem[];
  /** 新增问题追踪（弹窗，不跳转） */
  onAddTrack?: () => void;
  /** 排除的跳转目标（如已在底部展示的主按钮） */
  excludeStages?: FlowStage[];
};

export function FlowListContextMenu({
  fromStage,
  title,
  entityId,
  x,
  y,
  onClose,
  extraItems = [],
  excludeStages = [],
  onAddTrack,
}: Props) {
  const { jump } = useFlowJump();

  const targets = (FLOW_JUMP_TARGETS[fromStage] ?? []).filter(
    (t) => !excludeStages.includes(t)
  );

  const jumpItems: ContextMenuItem[] = targets.map((toStage) => ({
    type: "action" as const,
    label: flowJumpButtonLabel(fromStage, toStage),
    onClick: () => {
      void jump({ fromStage, toStage, title, entityId });
    },
  }));

  const trackItem: ContextMenuItem[] = onAddTrack
    ? [{ type: "action" as const, label: "新增问题追踪", onClick: onAddTrack }]
    : [];

  const items: ContextMenuItem[] = [
    ...trackItem,
    ...(trackItem.length && jumpItems.length
      ? [{ type: "separator" as const }]
      : []),
    ...jumpItems,
    ...((trackItem.length || jumpItems.length) && extraItems.length
      ? [{ type: "separator" as const }]
      : []),
    ...extraItems,
  ];

  if (items.length === 0) return null;

  return <ContextMenu x={x} y={y} items={items} onClose={onClose} />;
}
