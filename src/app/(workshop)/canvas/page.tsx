import { CanvasWorkspace } from "@/app/canvas/CanvasWorkspace";

export default function CanvasPage() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden md:h-[calc(100dvh-0px)]">
      <CanvasWorkspace />
    </div>
  );
}
