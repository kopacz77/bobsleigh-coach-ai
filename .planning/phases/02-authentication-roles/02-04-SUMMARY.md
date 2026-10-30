---
phase: 02-authentication-roles
plan: 04
subsystem: auth
tags: [rls, supabase, row-level-security, authorization, defense-in-depth, fastapi]

# Dependency graph
requires:
  - phase: 02-authentication-roles
    provides: Supabase JWT validation via get_current_user, auth guards on all endpoints (Plan 02-02)
provides:
  - RLS migration SQL with auth.uid()-based policies for all data tables
  - Backend defense-in-depth data filtering by authenticated user ID
  - 403 Forbidden responses for unauthorized data access
  - Coach read access patterns in RLS (via coach_athletes join)
  - get_athlete_for_user helper function for user-to-athlete lookup
  - Performance indexes on athletes.user_id and coaches.user_id
affects: [03-training-data, 04-ai-engine, 05-coach-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns: [rls-auth-uid, defense-in-depth-filtering, ownership-verification]

key-files:
  created:
    - backend/sql/rls_policies_migration.sql
  modified:
    - backend/app/api/endpoints/athletes.py
    - backend/app/api/endpoints/training.py
    - backend/app/api/endpoints/performance.py

key-decisions:
  - "Wellbeing assessments RLS uses athlete_id join to athletes.user_id (no user_id column on wellbeing_assessments table)"
  - "Training recommendations include coach INSERT policy (coaches create recommendations for assigned athletes)"
  - "Training endpoint athlete_id query param made optional (defaults to authenticated user's own athlete)"
  - "Backend uses service role key (bypasses RLS) -- RLS protects frontend direct access, Python code provides defense-in-depth"

patterns-established:
  - "Ownership verification: _verify_athlete_ownership checks athlete.user_id == auth user.id before returning data"
  - "Auto-set user_id/athlete_id on create endpoints (never trust client input for ownership fields)"
  - "get_athlete_for_user helper: look up athlete record from auth user ID"
  - "403 Forbidden for unauthorized access, 404 for missing profiles"

# Metrics
duration: 3min
completed: 2026-05-03
---

# Phase 2 Plan 4: Row-Level Security & Data Filtering Summary

**RLS policies with auth.uid()-based isolation for 7 data tables, plus backend defense-in-depth ownership checks on all athlete/training/performance endpoints**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-03T02:52:23Z
- **Completed:** 2026-05-03T02:55:23Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created comprehensive RLS migration SQL replacing 7 permissive USING(true) policies with 27 auth.uid()-based policies covering athletes, workouts, workout_exercises, performance_metrics, training_loads, wellbeing_assessments, and training_recommendations
- Added backend defense-in-depth data filtering: all endpoints verify authenticated user owns the requested athlete data before returning results
- Unauthorized access now returns 403 Forbidden instead of silently returning other users' data
- Coach read access patterns included in RLS for future coach dashboard (Phase 5)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create RLS policies migration SQL** - `7231877` (feat)
2. **Task 2: Add user-based data filtering to backend endpoints** - `558dd5e` (feat)

## Files Created/Modified
- `backend/sql/rls_policies_migration.sql` - RLS migration with 27 auth.uid()-based policies, drops 7 permissive policies, adds performance indexes
- `backend/app/api/endpoints/athletes.py` - Added get_athlete_for_user helper, _verify_ownership checks, auto-set user_id on create, filter by user_id on list
- `backend/app/api/endpoints/training.py` - Added _get_athlete_id_for_user and _verify_athlete_ownership helpers, ownership checks on all endpoints, made athlete_id optional
- `backend/app/api/endpoints/performance.py` - Added _verify_athlete_ownership checks on all 4 endpoints (metrics, trends, load, comparison)

## Decisions Made
- **Wellbeing RLS via athlete_id join:** The wellbeing_assessments table in fresh_clean_schema has no user_id column, so RLS policies use athlete_id joined to athletes.user_id for ownership checks
- **Coach INSERT for recommendations:** Added coach INSERT policy on training_recommendations (coaches create plans for assigned athletes), beyond the read-only access specified for other tables
- **Optional athlete_id on training endpoints:** Made athlete_id query param optional on GET /workouts and GET /recommendations -- defaults to the authenticated user's own athlete, reducing frontend boilerplate
- **Service role bypass is intentional:** Backend deliberately uses service role key to bypass RLS, with Python-level authorization as defense-in-depth; RLS protects frontend direct Supabase client access

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added training_recommendations RLS policies**
- **Found during:** Task 1 (RLS migration SQL)
- **Issue:** Plan did not include RLS policies for training_recommendations table, but it had a permissive USING(true) policy that needed replacement
- **Fix:** Added athlete SELECT/UPDATE and coach SELECT/INSERT policies for training_recommendations
- **Files modified:** backend/sql/rls_policies_migration.sql
- **Verification:** Policy count verified, auth.uid() used consistently
- **Committed in:** 7231877 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added performance indexes for RLS subquery performance**
- **Found during:** Task 1 (RLS migration SQL)
- **Issue:** RLS subqueries on athletes.user_id and coaches.user_id would be slow without indexes
- **Fix:** Added idx_athletes_user_id and idx_coaches_user_id indexes
- **Files modified:** backend/sql/rls_policies_migration.sql
- **Verification:** CREATE INDEX IF NOT EXISTS statements present
- **Committed in:** 7231877 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both additions necessary for completeness and performance. No scope creep.

## Issues Encountered
None

## User Setup Required
**RLS migration requires manual deployment.** Run the SQL in Supabase dashboard:
1. Open Supabase project > SQL Editor
2. Run `backend/sql/auth_roles_migration.sql` first (from Plan 02-03, when executed)
3. Run `backend/sql/rls_policies_migration.sql`
4. Verify with: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;`

## Next Phase Readiness
- All AUTH requirements covered across Plans 02-01 through 02-04
- Phase 2 (Authentication & Roles) is complete pending 02-03 execution
- Backend endpoints are now secured: auth guard (02-02) + data filtering (02-04)
- RLS migration ready for deployment alongside auth_roles_migration from 02-03
- Ready for Phase 3 (Training Data) which will build on the secured endpoints

---
*Phase: 02-authentication-roles*
*Completed: 2026-05-03*
