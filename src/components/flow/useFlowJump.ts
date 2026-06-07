"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  jumpFromDecisionHref,
  jumpFromDecisionToTrackHref,
  jumpFromGoalHref,
  jumpFromInbox,
  jumpFromThinkingHref,
  jumpFromTrack,
} from "@/lib/flow/jump-actions";
import type { FlowStage } from "@/lib/flow/types";

export function useFlowJump() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const jump = useCallback(
    async (input: {
      fromStage: FlowStage;
      toStage: FlowStage;
      title: string;
      entityId: string;
    }) => {
      const { fromStage, toStage, title, entityId } = input;
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
    },
    [router]
  );

  return { jump, busy };
}
