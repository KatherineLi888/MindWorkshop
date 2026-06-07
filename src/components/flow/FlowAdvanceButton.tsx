"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { flowJumpButtonLabel } from "@/lib/flow/transitions";
import {
  jumpFromDecisionHref,
  jumpFromDecisionToTrackHref,
  jumpFromGoalHref,
  jumpFromInbox,
  jumpFromThinkingHref,
  jumpFromTrack,
} from "@/lib/flow/jump-actions";
import type { FlowStage } from "@/lib/flow/types";

type Props = {
  fromStage: FlowStage;
  toStage: FlowStage;
  title: string;
  entityId: string;
  entityType?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "ghost";
};

export function FlowAdvanceButton({
  fromStage,
  toStage,
  title,
  entityId,
  size = "sm",
  variant = "secondary",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      if (fromStage === "inbox") {
        const { href } = await jumpFromInbox({
          inboxItemId: entityId,
          title,
          toStage,
        });
        router.push(href);
        return;
      }
      if (fromStage === "thinking" && toStage === "decisions") {
        router.push(jumpFromThinkingHref(entityId, title));
        return;
      }
      if (fromStage === "decisions" && toStage === "goals") {
        router.push(jumpFromDecisionHref(entityId, title));
        return;
      }
      if (fromStage === "decisions" && toStage === "track") {
        router.push(jumpFromDecisionToTrackHref(entityId, title));
        return;
      }
      if (fromStage === "goals" && toStage === "track") {
        router.push(jumpFromGoalHref(entityId, title));
        return;
      }
      if (fromStage === "track") {
        const { href } = await jumpFromTrack({
          nodeId: entityId,
          title,
          toStage,
        });
        router.push(href);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      type="button"
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? "跳转中…" : flowJumpButtonLabel(fromStage, toStage)}
    </Button>
  );
}
