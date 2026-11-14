"use client";

import { useCallback, useSyncExternalStore } from "react";

function useSyncedNumberStorage(
  storageKey: string,
  shouldReplace: (candidate: number, current: number) => boolean
) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined") return () => {};
      const handleStorage = (e: StorageEvent) => {
        if (!e.key || e.key === storageKey) onStoreChange();
      };
      const handleCustom = () => onStoreChange();
      window.addEventListener("storage", handleStorage);
      window.addEventListener(`bestmetric:${storageKey}`, handleCustom);
      return () => {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(`bestmetric:${storageKey}`, handleCustom);
      };
    },
    [storageKey]
  );

  const getSnapshot = useCallback(() => {
    try {
      const val = window.localStorage.getItem(storageKey);
      const parsed = val ? Number(val) : 0;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }, [storageKey]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  const commitValue = useCallback(
    (candidate: number) => {
      try {
        if (!Number.isFinite(candidate) || candidate <= 0) return;
        const current = getSnapshot();
        if (shouldReplace(candidate, current)) {
          window.localStorage.setItem(storageKey, String(candidate));
          window.dispatchEvent(new Event(`bestmetric:${storageKey}`));
        }
      } catch {}
    },
    [getSnapshot, shouldReplace, storageKey]
  );

  return { value, commitValue };
}

export function useBestScore(storageKey: string) {
  const isHigher = useCallback((candidate: number, current: number) => candidate > current, []);
  const { value, commitValue } = useSyncedNumberStorage(storageKey, isHigher);
  return { bestScore: value, commitScore: commitValue };
}

export function useBestTimeMs(storageKey: string) {
  const isFaster = useCallback(
    (candidate: number, current: number) => current === 0 || candidate < current,
    []
  );
  const { value, commitValue } = useSyncedNumberStorage(storageKey, isFaster);
  return { bestTimeMs: value, commitTimeMs: commitValue };
}
