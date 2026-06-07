import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50";
  const variants = {
    primary:
      "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",
    secondary:
      "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--surface)]",
    ghost: "text-[var(--foreground)] hover:bg-[var(--surface)]",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = { sm: "px-2.5 py-1 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
