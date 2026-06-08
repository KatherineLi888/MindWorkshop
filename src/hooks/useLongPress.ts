"use client";

import { useCallback, useRef } from "react";

type Options = {
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  delayMs?: number;
};

export function useLongPress({
  onLongPress,
  onContextMenu,
  delayMs = 500,
}: Options) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      fired.current = false;
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        onLongPress(e);
      }, delayMs);
    },
    [clear, delayMs, onLongPress]
  );

  const onTouchEnd = useCallback(() => {
    clear();
  }, [clear]);

  const onTouchMove = useCallback(() => {
    clear();
  }, [clear]);

  const onContextMenuHandler = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenu) {
        e.preventDefault();
        onContextMenu(e);
      }
    },
    [onContextMenu]
  );

  return {
    fired,
    handlers: {
      onTouchStart,
      onTouchEnd,
      onTouchMove,
      onContextMenu: onContextMenuHandler,
    },
  };
}
