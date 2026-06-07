import { ThinkingMethodsManager } from "@/components/thinking/ThinkingMethodsManager";
import { ThinkingMethodsProvider } from "@/components/thinking/ThinkingMethodsContext";

export default function ThinkingMethodsPage() {
  return (
    <ThinkingMethodsProvider>
      <ThinkingMethodsManager />
    </ThinkingMethodsProvider>
  );
}
