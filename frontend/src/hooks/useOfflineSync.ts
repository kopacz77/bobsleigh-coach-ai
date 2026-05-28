"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useState } from "react";
import { trainingAPI } from "@/lib/api";
import {
  offlineDb,
  type PendingWorkout,
  type PendingWorkoutPayload,
} from "@/lib/offlineDb";

/**
 * Detect whether the navigator reports an online state.
 * SSR-safe: returns true when window is not defined (assume online).
 */
function getInitialOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export interface UseOfflineSyncResult {
  /** True if the navigator reports online connectivity. */
  isOnline: boolean;
  /** Number of workouts currently waiting in the offline queue. */
  pendingCount: number;
  /** Add a workout payload to the offline queue. */
  queueWorkout: (payload: PendingWorkoutPayload) => Promise<void>;
  /** Attempt to POST every pending workout to the API. */
  syncPending: () => Promise<{ synced: number; failed: number }>;
}

/**
 * Hook for queuing failed workout submissions to IndexedDB and
 * automatically retrying them when network connectivity returns.
 */
export function useOfflineSync(): UseOfflineSyncResult {
  const [isOnline, setIsOnline] = useState<boolean>(getInitialOnline);
  const [isSyncing, setIsSyncing] = useState(false);

  // Reactive count of items in the queue.
  // useLiveQuery is SSR-safe -- it returns undefined on the server.
  const pendingCount =
    useLiveQuery(async () => {
      if (typeof window === "undefined") return 0;
      return offlineDb.pendingWorkouts.count();
    }, []) ?? 0;

  const queueWorkout = useCallback(
    async (payload: PendingWorkoutPayload): Promise<void> => {
      if (typeof window === "undefined") return;
      const record: PendingWorkout = {
        payload,
        created_at: new Date().toISOString(),
        retries: 0,
      };
      await offlineDb.pendingWorkouts.add(record);
    },
    [],
  );

  const syncPending = useCallback(async (): Promise<{
    synced: number;
    failed: number;
  }> => {
    if (typeof window === "undefined") {
      return { synced: 0, failed: 0 };
    }
    if (isSyncing) {
      return { synced: 0, failed: 0 };
    }
    setIsSyncing(true);

    let synced = 0;
    let failed = 0;

    try {
      const queued = await offlineDb.pendingWorkouts
        .orderBy("created_at")
        .toArray();

      for (const item of queued) {
        if (item.id === undefined) continue;
        try {
          await trainingAPI.createWorkout(
            item.payload as unknown as Record<string, unknown>,
          );
          await offlineDb.pendingWorkouts.delete(item.id);
          synced += 1;
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown sync error";
          await offlineDb.pendingWorkouts.update(item.id, {
            retries: item.retries + 1,
            last_error: message,
          });
          failed += 1;
        }
      }
    } finally {
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [isSyncing]);

  // Listen for online/offline events and auto-sync on reconnect.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      // Fire-and-forget sync; errors are recorded per-item inside syncPending.
      void syncPending();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // If we mounted online with pending items left from a previous session,
    // try to sync them right away.
    if (navigator.onLine) {
      void syncPending();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncPending]);

  // Periodic safety-net poll (every 30s) -- catches the case where the
  // browser silently restored connectivity without firing an 'online' event.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = window.setInterval(() => {
      if (navigator.onLine && pendingCount > 0) {
        void syncPending();
      }
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [pendingCount, syncPending]);

  return {
    isOnline,
    pendingCount,
    queueWorkout,
    syncPending,
  };
}
