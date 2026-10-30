import Dexie, { type Table } from "dexie";

/**
 * Shape of the payload sent to POST /api/training/workouts.
 * Mirrors the WorkoutCreate schema on the backend.
 */
export interface PendingWorkoutPayload {
  athlete_id?: string;
  date: string;
  workout_type: string;
  notes?: string;
  exercises: Array<{
    exercise_id?: string;
    exercise_name?: string;
    sets: number;
    reps: number;
    weight_kg: number;
    rpe?: number;
  }>;
}

/**
 * A workout that has been queued locally because the network was
 * unavailable when the user completed it. Will be retried on reconnect.
 */
export interface PendingWorkout {
  id?: number; // auto-increment local ID
  payload: PendingWorkoutPayload;
  created_at: string; // ISO timestamp when queued
  retries: number; // number of sync attempts
  last_error?: string; // last sync error message
}

/**
 * IndexedDB wrapper for queuing workout data when offline.
 *
 * Schema version 1:
 *   pendingWorkouts: ++id (auto-increment PK), created_at (indexed)
 */
class OfflineDb extends Dexie {
  pendingWorkouts!: Table<PendingWorkout, number>;

  constructor() {
    super("bobsleigh-coach-offline");
    this.version(1).stores({
      pendingWorkouts: "++id, created_at",
    });
  }
}

// Singleton -- IndexedDB connections are inherently shared per-origin.
// Dexie is SSR-safe: it only opens the DB lazily on first read/write,
// and operations during SSR will throw harmlessly if called.
export const offlineDb = new OfflineDb();
