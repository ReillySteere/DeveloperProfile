import { useState, useCallback, useEffect, useRef } from 'react';
import type { FocusableElement } from '../accessibility.types';

function getElementLabel(el: Element): string {
  return (
    el.getAttribute('aria-label') ||
    el.getAttribute('aria-labelledby') ||
    el.textContent?.trim().substring(0, 50) ||
    el.tagName.toLowerCase()
  );
}

export function useFocusTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [focusHistory, setFocusHistory] = useState<FocusableElement[]>([]);
  const [currentFocus, setCurrentFocus] = useState<FocusableElement | null>(
    null,
  );
  const orderRef = useRef(0);

  const startTracking = useCallback(() => {
    orderRef.current = 0;
    setFocusHistory([]);
    setCurrentFocus(null);
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const clearHistory = useCallback(() => {
    setFocusHistory([]);
    setCurrentFocus(null);
    orderRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as Element;
      orderRef.current += 1;
      const entry: FocusableElement = {
        tagName: target.tagName.toLowerCase(),
        role: target.getAttribute('role'),
        label: getElementLabel(target),
        order: orderRef.current,
        isCurrent: true,
      };
      setCurrentFocus(entry);
      setFocusHistory((prev) => [
        ...prev.map((item) => ({ ...item, isCurrent: false })),
        entry,
      ]);
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, [isTracking]);

  return {
    isTracking,
    focusHistory,
    currentFocus,
    startTracking,
    stopTracking,
    clearHistory,
  };
}
