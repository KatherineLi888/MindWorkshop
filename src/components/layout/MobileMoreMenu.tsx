"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ARCHIVE_NAV, isArchiveNavActive } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileMoreMenu({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (!open) return null;

  const archiveActive = isArchiveNavActive(pathname);
  const settingsActive =
    pathname === "/settings" || pathname.startsWith("/settings/");

  const items = [
    {
      href: ARCHIVE_NAV.href,
      label: ARCHIVE_NAV.label,
      icon: ARCHIVE_NAV.icon,
      active: archiveActive,
    },
    {
      href: "/settings",
      label: "设置",
      icon: "⚙",
      active: settingsActive,
    },
  ] as const;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] right-4 z-[70] w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">更多</p>
        </div>
        <ul className="p-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  router.push(item.href);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition active:scale-[0.98]",
                  item.active
                    ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
