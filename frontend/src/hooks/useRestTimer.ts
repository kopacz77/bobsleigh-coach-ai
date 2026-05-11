"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Countdown rest timer hook with audio and vibration notifications.
 *
 * Audio is the PRIMARY notification (works on all browsers).
 * Vibration is an ENHANCEMENT (Android Chrome only -- no Safari/Firefox support).
 *
 * @param defaultSeconds Default countdown duration (default: 120s = 2 minutes)
 */
export function useRestTimer(defaultSeconds = 120) {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const notifyComplete = useCallback(() => {
    // Audio notification (primary) -- catch for autoplay policy restrictions
    if (typeof window !== "undefined") {
      new Audio("/sounds/timer-end.mp3").play().catch(() => {});
    }
    // Vibration (enhancement -- Android Chrome only)
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const start = useCallback(
    (seconds?: number) => {
      clearTimer();
      const duration = seconds ?? defaultSeconds;
      setRemaining(duration);
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            notifyComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [defaultSeconds, clearTimer, notifyComplete],
  );

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setRemaining(0);
  }, [clearTimer]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return { remaining, isRunning, start, stop, reset };
}
