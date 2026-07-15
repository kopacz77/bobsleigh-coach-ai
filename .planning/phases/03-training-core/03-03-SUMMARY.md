---
phase: 03-training-core
plan: 03
subsystem: ui, api
tags: [react, mantine, fastapi, supabase, workout-filters, weekly-plan, tabs]

# Dependency graph
requires:
  - phase: 03-training-core/03-01
    provides: ExerciseLibrary component and exercise API
  - phase: 03-training-core/03-02
    provides: WorkoutForm, useCreateWorkout, PATCH endpoint
provides:
  - Filtered workout history endpoint (GET /workouts with filters)
  - Weekly workouts endpoint (GET /workouts/week)
  - WorkoutList with real data and filter UI
  - WeeklyPlanView with mobile-friendly 7-day layout
  - TrainingTabs with 6 integrated tabs
  - Planned vs Actual inline comparison view
  - WorkoutForm modal on training page
affects: [03-training-core/03-04, 04-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase query filter chaining (.eq, .gte, .lte, .ilike)"
    - "Accordion-based expandable day cards for weekly view"
    - "Inline placeholder components for future features"
    - "Modal-based form pattern (useDisclosure + onSuccess callback)"

key-files:
  created:
    - frontend/src/components/training/WeeklyPlanView.tsx
  modified:
    - backend/app/api/endpoints/training.py
    - backend/app/services/training_service.py
    - frontend/src/hooks/useTraining.ts
    - frontend/src/lib/api.ts
    - frontend/src/components/training/WorkoutList.tsx
    - frontend/src/components/training/TrainingTabs.tsx
    - frontend/src/components/training/WorkoutForm.tsx
    - frontend/src/components/training/index.tsx
    - frontend/src/app/training/page.tsx

key-decisions:
  - "Pagination via offset/limit with forward-estimation (full page = more pages exist)"
  - "RPE-to-intensity mapping: 1-3=Low, 4-6=Medium, 7-10=High"
  - "WeeklyPlanView uses Accordion (not separate routes) for drill-down"
  - "PlannedVsActual inline placeholder until 03-04 builds full component"
  - "WorkoutForm accepts optional onSuccess prop for modal close"
  - "Weekly plan is default tab (replaces old Calendar tab)"

patterns-established:
  - "Filter chaining: build Supabase query conditionally with optional params"
  - "Modal form: useDisclosure + queryClient.invalidateQueries on success"
  - "Inline placeholder: implement minimal version when dependency not yet built"

# Metrics
duration: 5min
completed: 2026-05-03
---

# Phase 3 Plan 3: Training Views Summary

**Workout history with API-backed filters, mobile-friendly weekly plan view, and 6-tab training page integrating Exercise Library and Planned vs Actual comparison**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-03T04:03:27Z
- **Completed:** 2026-05-03T04:08:39Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Backend GET /workouts now accepts workout_type, date_from, date_to, search, and offset filter params
- Added GET /workouts/week endpoint returning workouts for a specific Mon-Sun range
- Replaced all mock data in WorkoutList with real API calls using useWorkouts hook with filter controls
- Created WeeklyPlanView with 7-day stacked cards, week navigation, and accordion drill-down to exercises
- Rewrote TrainingTabs with 6 tabs: Weekly Plan, Workout History, Exercise Library, Planned vs Actual, Recommendations, Analytics
- Training page now uses TrainingTabs as main layout with "Log Workout" button opening WorkoutForm in a modal

## Task Commits

Each task was committed atomically:

1. **Task 1: Add filtering to backend workouts endpoint and wire WorkoutList** - `e8e7cf3` (feat)
2. **Task 2: Create weekly plan view and wire all components into TrainingTabs** - `258fbeb` (feat)

## Files Created/Modified
- `backend/app/api/endpoints/training.py` - Added filter params (workout_type, date_from, date_to, search, offset) to GET /workouts; added GET /workouts/week endpoint
- `backend/app/services/training_service.py` - Updated get_recent_workouts with filter chaining; added get_weekly_workouts method
- `frontend/src/hooks/useTraining.ts` - Added WorkoutFilters interface, updated useWorkouts to accept filters, added useWeeklyWorkouts hook
- `frontend/src/lib/api.ts` - Updated trainingAPI.getWorkouts to accept params object
- `frontend/src/components/training/WorkoutList.tsx` - Replaced mock data with API-backed list, added filter UI (type select, date pickers, search, clear)
- `frontend/src/components/training/WeeklyPlanView.tsx` - New mobile-friendly weekly plan with day cards, week navigation, accordion drill-down
- `frontend/src/components/training/TrainingTabs.tsx` - 6 tabs: weekly plan (default), history, exercise library, planned vs actual, recommendations, analytics
- `frontend/src/components/training/WorkoutForm.tsx` - Added onSuccess prop for modal close callback
- `frontend/src/components/training/index.tsx` - Added WeeklyPlanView export
- `frontend/src/app/training/page.tsx` - Replaced Grid layout with TrainingTabs + WorkoutForm modal

## Decisions Made
- **Pagination via offset/limit:** Estimate if more pages exist by checking if result set is full (avoids COUNT query). Simple and works without extra backend complexity.
- **RPE-to-intensity mapping:** RPE 1-3 = Low (green), 4-6 = Medium (yellow), 7-10 = High (red). Consistent with sports science conventions.
- **Accordion for weekly drill-down:** Used Mantine Accordion instead of separate routes for exercise detail. Keeps the user on the same page, better mobile UX.
- **PlannedVsActual inline placeholder:** Built a functional table showing planned vs actual values from workout_exercises. Plan 03-04 will replace this with the full component.
- **WorkoutForm onSuccess prop:** Added optional callback so the modal can close and invalidate queries after successful save. Non-breaking change (prop is optional).
- **Default tab changed to Weekly Plan:** The old "Calendar" tab was replaced by the more useful weekly view as the default landing tab.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added onSuccess prop to WorkoutForm**
- **Found during:** Task 2 (Training page modal integration)
- **Issue:** WorkoutForm had no callback mechanism for parent components to react to successful saves (needed for modal close)
- **Fix:** Added optional `onSuccess` prop to WorkoutForm, called after successful mutation
- **Files modified:** frontend/src/components/training/WorkoutForm.tsx
- **Verification:** TypeScript compiles, prop is optional so existing usage is unaffected
- **Committed in:** 258fbeb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Minimal -- added an optional prop to support the modal pattern. No scope creep.

## Issues Encountered
- Backend Python verification failed due to FastAPI not installed in global Python. Verified via AST syntax parsing instead. This is the same pattern as prior plans.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Training views are fully integrated. ExerciseLibrary, WorkoutList, and WeeklyPlanView are all accessible via tabs.
- Plan 03-04 (Planned vs Actual) can replace the inline placeholder in TrainingTabs with the full PlannedVsActual component.
- All hooks and API endpoints are in place for the remaining training features.

---
*Phase: 03-training-core*
*Completed: 2026-05-03*
