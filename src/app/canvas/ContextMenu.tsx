"use client";

import { useEffect } from "react";

export type ContextMenuItem =
  | { type: "action"; label: string; danger?: boolean; onClick: () => void }
  | { type: "separator" };

type Props = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: Props) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [onClose]);

  return (
    <div
      className="fixed z-[90] min-w-[10rem] rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item.type === "separator" ? (
          <div key={i} className="my-1 border-t border-[#E2E8F0]" />
        ) : (
          <button
            key={i}
            type="button"
            className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 ${
              item.danger ? "text-red-600" : "text-slate-700"
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.onClick();
              onClose();
            }}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
