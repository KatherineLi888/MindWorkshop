import Link from "next/link";
import type { ReactNode } from "react";

type SubModule = {
  label: string;
  href: string;
};

type SecondaryLink = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  description?: string;
  subModule?: SubModule;
  secondaryLink?: SecondaryLink;
  actions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  subModule,
  secondaryLink,
  actions,
}: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {subModule && (
            <Link
              href={subModule.href}
              className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-[#3B82F6]/40 hover:text-[#3B82F6]"
            >
              {subModule.label}
            </Link>
          )}
        </div>
        {description && (
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {secondaryLink && (
          <Link
            href={secondaryLink.href}
            className="text-xs text-slate-500 hover:text-[#3B82F6] hover:underline"
          >
            {secondaryLink.label}
          </Link>
        )}
        {actions}
      </div>
    </div>
  );
}
