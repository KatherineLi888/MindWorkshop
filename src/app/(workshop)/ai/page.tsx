import { AiChatClient } from "@/components/ai/AiChatClient";

export default function AiPage() {
  return (
    <div className="h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))] min-h-0 overflow-hidden md:h-[calc(100dvh-2.5rem)]">
      <AiChatClient />
    </div>
  );
}
