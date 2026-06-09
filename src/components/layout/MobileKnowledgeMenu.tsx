"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KNOWLEDGE_NAV_GROUP, isNavItemActive } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function MobileKnowledgeMenu({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (!open) return null;

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
          <p className="text-sm font-semibold text-slate-800">知识库</p>
        </div>
        <ul className="p-2">
          {KNOWLEDGE_NAV_GROUP.items.map((item) => {
            const active = isNavItemActive(pathname, item.href);
            return (
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
                    active
                      ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
