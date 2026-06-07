import { useRef } from "react";

/** 移动端长按打开节点菜单（约 480ms） */
export function useNodeLongPress(
  onLongPress: (clientX: number, clientY: number) => void,
  delayMs = 480
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const originRef = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  return {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      originRef.current = { x: t.clientX, y: t.clientY };
      clear();
      timerRef.current = setTimeout(() => {
        onLongPress(originRef.current.x, originRef.current.y);
        timerRef.current = undefined;
      }, delayMs);
    },
    onTouchEnd: clear,
    onTouchCancel: clear,
    onTouchMove: (e: React.TouchEvent) => {
      if (!timerRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - originRef.current.x;
      const dy = t.clientY - originRef.current.y;
      if (Math.hypot(dx, dy) > 12) clear();
    },
  };
}
