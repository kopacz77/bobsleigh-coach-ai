---
phase: 03-training-core
plan: 04
subsystem: ui, api
tags: [react, mantine, fastapi, supabase, planned-vs-actual, coach-view, workout-compliance]

# Dependency graph
requires:
  - phase: 03-training-core/03-03
    provides: TrainingTabs with placeholder comparison tab, useWorkouts hook, workout endpoints
  - phase: 02-auth-roles/02-03
    provides: Role-based access via app_metadata
provides:
  - PlannedVsActual component with per-exercise metric comparison and color-coded diffs
  - CoachWorkoutView component showing athlete workout compliance
  - Coach-only endpoints for athlete workout visibility (GET /coach/athletes/workout-status, GET /coach/athletes/{id}/workouts)
  - Role-check helper function for coach endpoints
affects: [04-analytics, 05-wellbeing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Coach role check via _get_user_role helper (app_metadata then user_metadata)"
    - "ComparisonTab wrapper: workout selector + PlannedVsActual component composition"
    - "Accordion-based expandable list for drill-down views (CoachWorkoutView)"

key-files:
  created:
    - frontend/src/components/training/PlannedVsActual.tsx
    - frontend/src/components/training/CoachWorkoutView.tsx
  modified:
    - backend/app/api/endpoints/training.py
    - frontend/src/hooks/useTraining.ts
    - frontend/src/lib/api.ts
    - frontend/src/components/training/index.tsx
    - frontend/src/components/training/TrainingTabs.tsx
    - frontend/src/components/dashboard/CoachDashboard.tsx

key-decisions:
  - "Coach role extracted via helper function checking app_metadata first, user_metadata fallback"
  - "workout-status endpoint must be registered before {athlete_id}/workouts to avoid route conflict"
  - "PlannedVsActual uses per-exercise Card layout (not single flat table) for better readability"
  - "Diff badge colors: green=met/exceeded, red=fell short, gray=not logged"

patterns-established:
  - "Coach-only endpoint pattern: _get_user_role(user) + 403 if not coach"
  - "Component composition: wrapper selects ID, child component fetches and renders detail"

# Metrics
duration: 4min
completed: 2026-05-03
---

# Phase 3 Plan 4: Planned vs Actual & Coach Visibility Summary

**Per-exercise planned-vs-actual comparison with color-coded diffs and coach workout compliance dashboard using accordion drill-down**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-03T04:11:17Z
- **Completed:** 2026-05-03T04:14:51Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Added two coach-only backend endpoints with role checks: workout-status summary and per-athlete workout listing
- Created PlannedVsActual component showing per-exercise Metric/Planned/Actual/Diff table with color-coded badges
- Created CoachWorkoutView showing all athletes' workout completion compliance in an accordion layout
- Replaced the inline placeholder in TrainingTabs with real PlannedVsActual behind a workout selector
- Integrated CoachWorkoutView into CoachDashboard as a "Workout Compliance (Last 7 Days)" section

## Task Commits

Each task was committed atomically:

1. **Task 1: Add coach workout visibility endpoint and planned-vs-actual data** - `3eb71e6` (feat)
2. **Task 2: Create PlannedVsActual and CoachWorkoutView components and integrate into UI** - `c176d51` (feat)

## Files Created/Modified
- `backend/app/api/endpoints/training.py` - Added _get_user_role helper, GET /coach/athletes/workout-status, GET /coach/athletes/{id}/workouts
- `frontend/src/lib/api.ts` - Added getAthleteWorkoutsForCoach and getAthletesWorkoutStatus API functions
- `frontend/src/hooks/useTraining.ts` - Added useAthleteWorkoutsForCoach and useAthletesWorkoutStatus hooks
- `frontend/src/components/training/PlannedVsActual.tsx` - Per-exercise planned vs actual comparison with color-coded diffs
- `frontend/src/components/training/CoachWorkoutView.tsx` - Accordion-based athlete workout compliance view
- `frontend/src/components/training/index.tsx` - Added PlannedVsActual and CoachWorkoutView exports
- `frontend/src/components/training/TrainingTabs.tsx` - Replaced placeholder with ComparisonTab using real PlannedVsActual
- `frontend/src/components/dashboard/CoachDashboard.tsx` - Added CoachWorkoutView in "Workout Compliance" section

## Decisions Made
- **Coach role helper function:** Created `_get_user_role()` to centralize role extraction logic (checks app_metadata first, user_metadata fallback). Avoids duplicating the same check in every coach endpoint.
- **Route ordering:** Registered `/coach/athletes/workout-status` before `/coach/athletes/{athlete_id}/workouts` to prevent FastAPI treating "workout-status" as an athlete_id path parameter.
- **Per-exercise Card layout:** Each exercise gets its own Card with a comparison Table inside, rather than one flat table for all exercises. Better readability when exercises have different metrics (sets/reps vs distance/time).
- **Diff badge colors:** Green = met or exceeded target, Red = fell short, Gray = not yet logged. Consistent with sports training conventions where meeting targets is positive.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 3 (Training Core) is now complete with all 4 plans executed
- Exercises, workouts, weekly plans, filters, planned-vs-actual comparison, and coach visibility are all in place
- Ready to proceed to Phase 4 (Analytics) which can build on the workout and exercise data infrastructure

---
*Phase: 03-training-core*
*Completed: 2026-05-03*
