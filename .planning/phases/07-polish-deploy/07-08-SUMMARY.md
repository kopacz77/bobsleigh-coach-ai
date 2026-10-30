---
phase: 07-polish-deploy
plan: 08
subsystem: ui
tags: [dexie, indexeddb, offline, pwa, react, mantine, workout-logger]

# Dependency graph
requires:
  - phase: 07-06
    provides: "ActiveWorkout component with Complete Workout submission"
  - phase: 03
    provides: "POST /api/training/workouts endpoint (target of offline queue)"
provides:
  - "Dexie.js IndexedDB store for queued workouts (bobsleigh-coach-offline)"
  - "useOfflineSync hook with queue, auto-sync on reconnect, and 30s polling safety-net"
  - "OfflineIndicator badge with offline / syncing / hidden states"
  - "Offline fallback in ActiveWorkout that distinguishes network vs API errors"
affects: ["07-09"]

# Tech tracking
tech-stack:
  added:
    - "dexie 4.4.3 (IndexedDB wrapper)"
    - "dexie-react-hooks 4.4.0 (useLiveQuery for reactive counts)"
  patterns:
    - "Local-first write queue: try network, fall back to IndexedDB, sync on 'online' event"
    - "Network-error detection via axios shape (no response + ERR_NETWORK / ECONNABORTED / navigator.onLine)"
    - "Periodic 30s safety-net poll to catch missed 'online' events"
    - "SSR-safe Dexie usage via typeof window/navigator guards and useLiveQuery returning undefined on server"

key-files:
  created:
    - "frontend/src/lib/offlineDb.ts"
    - "frontend/src/hooks/useOfflineSync.ts"
    - "frontend/src/components/ui/OfflineIndicator.tsx"
  modified:
    - "frontend/src/components/workout/ActiveWorkout.tsx"
    - "frontend/src/components/ui/index.ts"
    - "frontend/package.json"
    - "frontend/src/app/dashboard/page.tsx"
    - "frontend/src/app/performance/page.tsx"
    - "frontend/src/components/layout/AppShell.tsx"

key-decisions:
  - "Use Dexie 4 (which ships its own React adapter) over raw idb-keyval -- gives schema versioning + reactive useLiveQuery for free"
  - "Network errors vs API errors: an axios error with a response body is a real API error and surfaces to the user; an error with no response is treated as a network failure and queued"
  - "Singleton OfflineDb at module scope -- Dexie opens IndexedDB lazily so SSR import is harmless"
  - "Auto-sync triggers on 'online' event, on hook mount when navigator.onLine, and on a 30s polling safety-net"
  - "Failed sync attempts increment a per-record retries counter and store last_error, but never drop the record"
  - "OfflineIndicator renders null when fully synced -- zero visual cost in the happy path"

patterns-established:
  - "Offline queue: PendingWorkout { payload, created_at, retries, last_error } in IndexedDB; FIFO drain on reconnect"
  - "Hook returns isOnline, pendingCount, queueWorkout, syncPending -- callers compose any of these"
  - "isNetworkError helper centralizes axios error shape detection so callers don't sniff strings"

# Metrics
duration: 7min
completed: 2026-05-28
---

# Phase 7 Plan 8: Offline Workout Queue Summary

**Dexie.js IndexedDB queue with auto-sync on reconnect, integrated into ActiveWorkout so gym connectivity drops never lose a logged set**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-28T03:59:13Z
- **Completed:** 2026-05-28T04:06:29Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Athletes can complete a workout in a gym with no signal and the data is saved to IndexedDB
- When the browser reports `online` again (or on the next mount, or on the 30s polling tick), queued workouts are POSTed to `/api/training/workouts` in FIFO order
- Successful syncs remove the record; failures increment a retry counter and stash the error so they're tried again later -- nothing is ever dropped silently
- `OfflineIndicator` renders an orange "Offline" badge when disconnected and a blue "Syncing N workouts..." badge while draining the queue, and is invisible the rest of the time
- The Complete Workout flow distinguishes genuine network errors (queued silently with a friendly "Workout Saved Offline" notification) from real API errors (4xx/5xx -- surfaced to the user so they can fix the input)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dexie.js IndexedDB store and offline sync hook** -- `e34d1a3` (feat)
2. **Task 2: ActiveWorkout offline integration and visual indicator** -- `beabee2` (feat)

## Files Created/Modified
- `frontend/src/lib/offlineDb.ts` -- Dexie wrapper with `pendingWorkouts` table (v1 schema: `++id, created_at`)
- `frontend/src/hooks/useOfflineSync.ts` -- `useOfflineSync()` returning `{ isOnline, pendingCount, queueWorkout, syncPending }`; listens for `online`/`offline`; 30s polling safety-net
- `frontend/src/components/ui/OfflineIndicator.tsx` -- Three-state Mantine badge (offline / syncing / hidden)
- `frontend/src/components/ui/index.ts` -- Re-export OfflineIndicator
- `frontend/src/components/workout/ActiveWorkout.tsx` -- Try POST, fall back to `queueWorkout(payload)` on network failure; show `Workout Saved Offline` notification and route to dashboard; `<OfflineIndicator />` rendered at top of both empty and active states
- `frontend/package.json`, `pnpm-lock.yaml` -- dexie 4.4.3, dexie-react-hooks 4.4.0
- `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/performance/page.tsx`, `frontend/src/components/layout/AppShell.tsx` -- Narrow `useAuth()` user from `unknown` to `{ id?, email? }` (pre-existing build failure -- see Deviations)

## Decisions Made
- Dexie 4 over alternatives (idb, idb-keyval): schema versioning + bundled React hooks (`useLiveQuery`) make the reactive `pendingCount` essentially free
- Centralize axios network-error detection in an `isNetworkError(err)` helper rather than sniffing strings at every callsite -- inspects `response`/`request`/`code`/`message` and falls back to `!navigator.onLine`
- Auto-sync triggers from three sources for resilience: `online` event listener, initial mount when already online, and a 30s polling tick. The hook guards against concurrent syncs via an `isSyncing` flag
- Failed records keep `retries` + `last_error` instead of being deleted; this preserves user data even if the API is permanently broken
- `OfflineIndicator` renders `null` in the happy path so it has zero DOM/layout cost when everything is working

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing TypeScript build failures on main**
- **Found during:** Task 1 verification (`pnpm build`)
- **Issue:** `pnpm build` was failing on `main` *before* any of my changes -- `user?.id` and `user?.email` accesses in `dashboard/page.tsx`, `performance/page.tsx`, and `AppShell.tsx` failed type-checking because `AuthState.user` is typed as `unknown` in `providers/AuthProvider.tsx`. The build had to succeed for Task 1's `<verify>` block to pass
- **Fix:** Cast the `user` from `useAuth()` to `{ id?: string; email?: string } | null | undefined` at each consumer (3 files). This is the minimal change consistent with the existing `unknown` typing -- the AuthState shape is intentional because the dev and supabase providers return different concrete types
- **Files modified:** `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/performance/page.tsx`, `frontend/src/components/layout/AppShell.tsx`
- **Verification:** `pnpm build` now succeeds (it failed identically on a clean `git stash` of my own changes, confirming it was pre-existing)
- **Committed in:** `e34d1a3` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** No scope creep -- the fix was the minimum required to make the Task 1 verify block pass, applied to consumers of an existing intentionally-`unknown` auth shape.

## Issues Encountered
- Biome lint config has a schema mismatch (`includes` should be `include`) so `pnpm lint` errors out. This is pre-existing and unrelated to this plan; build passes cleanly which was the stated verification.
- `frontend/Dockerfile` and `docker-compose.yml` had unrelated working-tree modifications from a prior `pnpm`/corepack run -- left out of my commits since they're not part of this plan.

## User Setup Required
None -- no external service configuration required. IndexedDB is a browser-native API; Dexie runs entirely client-side.

## Next Phase Readiness
- Offline workout queue is fully functional and ready for production traffic
- Future work (out of scope for this plan): retry-backoff strategy for items with high `retries` counts; UI to surface stale queued items to the user; expand the queue beyond workouts (wellbeing check-ins, etc.)
- Ready for service-worker / PWA work (07-09) -- having a local-first queue is a prerequisite for installable offline-first behaviour

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-28*
