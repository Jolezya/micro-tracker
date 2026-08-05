import React, { useCallback, useRef, useState } from 'react';
import { Spinner } from '../components/ui/kit.jsx';

// Lightweight pull-to-refresh for touch. Returns handlers to spread on a
// wrapper element plus an indicator node to render at the top.
export function usePullToRefresh(onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const THRESHOLD = 64;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY <= 0 && !refreshing) startY.current = e.touches[0].clientY;
    else startY.current = null;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (startY.current == null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.5, 90));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (startY.current == null) return;
    if (pull > THRESHOLD) {
      setRefreshing(true);
      setPull(40);
      Promise.resolve(onRefresh?.()).finally(() => {
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
        }, 700);
      });
    } else {
      setPull(0);
    }
    startY.current = null;
  }, [pull, onRefresh]);

  const active = pull > 4 || refreshing;
  const indicator = (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center overflow-hidden transition-[height] duration-200"
      style={{ height: active ? pull : 0 }}
    >
      <div
        className="mt-2 grid h-9 w-9 place-items-center rounded-full glass text-accent shadow-soft"
        style={{ transform: `rotate(${pull * 3}deg)`, opacity: Math.min(pull / THRESHOLD, 1) }}
      >
        <Spinner size={16} className={refreshing ? '' : 'opacity-90'} />
      </div>
    </div>
  );

  return {
    bind: { onTouchStart, onTouchMove, onTouchEnd, style: { position: 'relative' } },
    indicator,
    refreshing,
  };
}
