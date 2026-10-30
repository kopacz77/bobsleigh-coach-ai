---
phase: 03-training-core
plan: 01
subsystem: api, ui
tags: [fastapi, supabase, mantine, exercise-library, search, filters]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client setup, exercises table schema, API router pattern
  - phase: 02-auth-roles
    provides: get_current_user auth dependency, Bearer token auth
provides:
  - Exercise library API (GET /exercises with search/filter, GET /exercises/categories)
  - ExerciseLibrary frontend component with searchable/filterable table
  - exerciseAPI client functions in api.ts
affects: [03-02 workout logging, 03-03 training plans, 03-04 performance tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase .ilike() with asterisk wildcards for text search"
    - "Supabase .contains() for array column filtering"
    - "Debounced search with setTimeout/clearTimeout pattern"
    - "SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} for responsive filter layout"

key-files:
  created:
    - backend/app/api/endpoints/exercises.py
    - frontend/src/components/training/ExerciseLibrary.tsx
  modified:
    - backend/app/api/router.py
    - frontend/src/lib/api.ts
    - frontend/src/components/training/index.tsx

key-decisions:
  - "Used measurement_type instead of movement_type (plan referenced non-existent column)"
  - "Used equipment_needed array with .contains() filter instead of scalar equipment column"
  - "Exercises endpoint has no ownership check -- any authenticated user can browse the library"

patterns-established:
  - "Exercise library API pattern: select * with chained eq/ilike/contains filters"
  - "Categories endpoint: query all rows, extract unique values from scalar and array columns"

# Metrics
duration: 4min
completed: 2026-05-03
---

# Phase 3 Plan 1: Exercise Library Summary

**Exercise library API with text search, category/muscle group/equipment/measurement type filters, and Mantine table UI with debounced search and loading skeletons**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-03T03:57:28Z
- **Completed:** 2026-05-03T04:01:05Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- GET /api/exercises endpoint with search, category, muscle_group, equipment, measurement_type filters and pagination
- GET /api/exercises/categories endpoint returning distinct values for all four filter dimensions
- ExerciseLibrary component (318 lines) with text search, four filter dropdowns, results table with badges, loading skeletons, and empty state
- exerciseAPI added to frontend api.ts with search() and getCategories() methods

## Task Commits

Each task was committed atomically:

1. **Task 1: Create exercise library backend endpoint** - `ef297d8` (feat)
2. **Task 2: Create searchable exercise library frontend component** - `40e3e5c` (feat, combined with 03-02 work from prior execution)

## Files Created/Modified

- `backend/app/api/endpoints/exercises.py` - Exercise library API with GET /exercises and GET /exercises/categories
- `backend/app/api/router.py` - Registered exercises router at /exercises prefix
- `frontend/src/components/training/ExerciseLibrary.tsx` - Searchable/filterable exercise table component
- `frontend/src/lib/api.ts` - Added exerciseAPI with search() and getCategories()
- `frontend/src/components/training/index.tsx` - Added ExerciseLibrary export

## Decisions Made

1. **measurement_type instead of movement_type** - The plan referenced a `movement_type` column that does not exist in the database schema. The closest column is `measurement_type` (values: weight, time, distance, reps). Used the actual schema column name.
2. **equipment_needed array filter** - The plan referenced a scalar `equipment` column, but the schema has `equipment_needed text[]`. Used `.contains()` for array filtering.
3. **No ownership check on exercises** - Exercises are reference data readable by any authenticated user, matching the RLS policy ("Public read exercises").

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected column names to match actual database schema**
- **Found during:** Task 1 (Backend endpoint creation)
- **Issue:** Plan referenced `movement_type` and `equipment` columns that don't exist. Schema has `measurement_type` and `equipment_needed text[]`.
- **Fix:** Used actual schema columns. Named API param `measurement_type` (not `movement_type`) and `equipment` (maps to `equipment_needed` array with `.contains()`).
- **Files modified:** backend/app/api/endpoints/exercises.py
- **Verification:** Router imports successfully, routes registered
- **Committed in:** ef297d8

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Column name correction was necessary for database compatibility. No scope creep.

## Issues Encountered

- Task 2 files were committed as part of an existing 03-02 commit (40e3e5c) from a prior execution attempt, rather than getting their own isolated commit. Content is correct and verified.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Exercise library API and UI are ready for use by workout logging (03-02)
- exerciseAPI client available for any component that needs exercise search
- Categories endpoint provides filter dropdown data

---
*Phase: 03-training-core*
*Completed: 2026-05-03*
