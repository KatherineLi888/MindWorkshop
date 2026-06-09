import { AiChatClient } from "@/components/ai/AiChatClient";

export default function AiPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col md:min-h-screen">
      <AiChatClient />
    </div>
  );
}
