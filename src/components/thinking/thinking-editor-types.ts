import type { ThinkingMethodId } from "@/lib/thinking/methods";

export type PendingMethod = {
  methodId: ThinkingMethodId;
  fromNodeId: string;
  draft: string;
};
