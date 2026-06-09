import { cn } from "@/lib/utils";

export function DashboardChevron({
  collapsed,
  className,
}: {
  collapsed?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={cn(
        "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200",
        collapsed && "-rotate-90",
        className
      )}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
