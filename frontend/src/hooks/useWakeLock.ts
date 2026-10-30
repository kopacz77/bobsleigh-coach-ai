"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Screen Wake Lock hook -- keeps the screen awake during active workouts.
 *
 * The browser releases the wake lock when the tab becomes hidden (spec requirement).
 * This hook listens for `visibilitychange` and automatically re-acquires the lock
 * when the document becomes visible again (critical for athletes who check a text
 * message during a set and then return to the app).
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const wantLockRef = useRef(false);

  const isSupported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return;
    wantLockRef.current = true;
    try {
      const lock = await navigator.wakeLock.request("screen");
      lockRef.current = lock;
      setIsActive(true);
      lock.addEventListener("release", () => {
        lockRef.current = null;
        setIsActive(false);
      });
    } catch {
      // Battery low, system restriction, or permission denied
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    wantLockRef.current = false;
    if (lockRef.current) {
      await lockRef.current.release();
      lockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-acquire on visibility change when we want the lock active
  useEffect(() => {
    if (!isSupported) return;

    const handler = async () => {
      if (
        document.visibilityState === "visible" &&
        wantLockRef.current &&
        lockRef.current === null
      ) {
        try {
          const lock = await navigator.wakeLock.request("screen");
          lockRef.current = lock;
          setIsActive(true);
          lock.addEventListener("release", () => {
            lockRef.current = null;
            setIsActive(false);
          });
        } catch {
          // Battery low or system restriction
        }
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [isSupported]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      wantLockRef.current = false;
      if (lockRef.current) {
        lockRef.current.release().catch(() => {});
        lockRef.current = null;
      }
    };
  }, []);

  return { isActive, isSupported, request, release };
}
