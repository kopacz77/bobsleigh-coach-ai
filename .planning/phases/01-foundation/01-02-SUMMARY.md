---
phase: 01-foundation
plan: 02
subsystem: backend, database
tags: [fastapi, pydantic, supabase, docker, uuid, python]

# Dependency graph
requires:
  - phase: none
    provides: "First backend plan, no prior dependencies"
provides:
  - "Clean backend requirements.txt without ML dependencies"
  - "Pydantic schemas with UUID string IDs matching Supabase"
  - "Supabase client factory (get_supabase) for backend data access"
  - "SUPABASE_SERVICE_ROLE_KEY config setting"
  - "Proper Python/FastAPI Dockerfile"
affects: [01-03, 01-04, 02-authentication]

# Tech tracking
tech-stack:
  added: [supabase-py, email-validator]
  patterns: ["UUID string IDs in all Pydantic schemas", "get_supabase() factory for Supabase client", "keep SQLAlchemy alongside supabase-py"]

key-files:
  created: []
  modified:
    - backend/requirements.txt
    - backend/app/core/config.py
    - backend/app/schemas/athlete.py
    - backend/app/schemas/training.py
    - backend/app/db/session.py
    - backend/Dockerfile
    - backend/app/api/endpoints/athletes.py
    - backend/app/api/endpoints/training.py

key-decisions:
  - "Use pydantic[email]>=2.5.3 with flexible pin to avoid conflicts with supabase 2.3.0 transitive deps"
  - "Pin httpx>=0.24.0,<0.25.0 to satisfy supabase 2.3.0 constraint"
  - "Keep SQLAlchemy models untouched (Integer PKs) for potential future migration tooling"
  - "Rename workout schema field 'type' to 'workout_type' to match Supabase column name"

patterns-established:
  - "UUID string IDs: All Pydantic response schemas use str for id fields"
  - "Dual data access: SQLAlchemy session + Supabase client coexist in session.py"
  - "Service role key: Backend uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS"

# Metrics
duration: 5min
completed: 2026-05-02
---

# Phase 1 Plan 2: Backend Cleanup Summary

**Clean backend deps (removed torch/transformers), UUID-compatible Pydantic schemas, Supabase client factory, and proper Python Dockerfile**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-02T17:01:22Z
- **Completed:** 2026-05-02T17:06:05Z
- **Tasks:** 1 completed, 1 deferred (manual Supabase step)
- **Files modified:** 8

## Accomplishments
- Removed 2GB+ of unused ML dependencies (torch, transformers, pytorch-lightning, scikit-learn, fastapi-cors)
- Updated all Pydantic schemas to use UUID string IDs matching Supabase database schema
- Added Supabase client factory (`get_supabase()`) to session.py for backend data access
- Replaced broken Node.js Dockerfile with proper Python/FastAPI Dockerfile
- Backend starts cleanly and serves health endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean backend deps, fix schemas, create proper Dockerfile** - `7e1ecbb` (feat)

**Plan metadata:** (included below)

## Files Created/Modified
- `backend/requirements.txt` - Lean dependencies without torch/transformers/pytorch-lightning
- `backend/app/core/config.py` - Added SUPABASE_SERVICE_ROLE_KEY setting
- `backend/app/schemas/athlete.py` - UUID string IDs, added training_level and is_active fields
- `backend/app/schemas/training.py` - UUID string IDs, renamed type->workout_type, added rpe/is_completed/training_phase
- `backend/app/db/session.py` - Added get_supabase() client factory alongside SQLAlchemy
- `backend/Dockerfile` - Replaced Node.js Dockerfile with Python 3.11-slim FastAPI setup
- `backend/app/api/endpoints/athletes.py` - Updated mock data for UUID string IDs
- `backend/app/api/endpoints/training.py` - Updated mock data for UUID string IDs and workout_type field

## Decisions Made
- **Flexible pydantic version pin** (`>=2.5.3` not `==2.5.3`): supabase 2.3.0 pulls in pydantic 2.13.3 transitively; pinning exact would cause conflicts
- **httpx pinned to `>=0.24.0,<0.25.0`**: supabase 2.3.0 requires this range; original plan had 0.26.0 which conflicts
- **Keep SQLAlchemy models as-is**: Integer PKs in SQLAlchemy models are left untouched since they are not actively used yet; migrating them is a future concern
- **Renamed `type` to `workout_type` in training schema**: matches the Supabase `workouts.workout_type` column name

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed httpx version conflict with supabase**
- **Found during:** Task 1 (pip install)
- **Issue:** Plan specified `httpx==0.26.0` but `supabase==2.3.0` requires `httpx<0.25.0,>=0.24.0`
- **Fix:** Changed httpx pin to `>=0.24.0,<0.25.0`
- **Files modified:** backend/requirements.txt
- **Verification:** `pip install -r requirements.txt` succeeds
- **Committed in:** 7e1ecbb

**2. [Rule 3 - Blocking] Added email-validator dependency**
- **Found during:** Task 1 (schema import test)
- **Issue:** Pydantic `EmailStr` requires `email-validator` package which was not in requirements
- **Fix:** Changed pydantic pin to `pydantic[email]>=2.5.3` which pulls in email-validator
- **Files modified:** backend/requirements.txt
- **Verification:** `from app.schemas.athlete import Athlete` succeeds
- **Committed in:** 7e1ecbb

**3. [Rule 1 - Bug] Updated endpoint mock data for UUID string IDs**
- **Found during:** Task 1 (schema change)
- **Issue:** athletes.py and training.py endpoints used hardcoded integer IDs that would fail validation with new str-typed schemas
- **Fix:** Updated all mock data to use UUID-format strings, changed path parameter types from int to str
- **Files modified:** backend/app/api/endpoints/athletes.py, backend/app/api/endpoints/training.py
- **Verification:** App starts without errors, all routes registered
- **Committed in:** 7e1ecbb

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## User Setup Required

**Database schema must be deployed to Supabase manually.** Task 2 (checkpoint:human-action) was deferred since we are in autonomous mode.

### Steps to complete:

1. Open your **Supabase Dashboard** (https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar) -> **New Query**
4. Paste the contents of `backend/sql/fresh_clean_schema.sql`
5. Click **Run**
6. Verify output shows "Fresh clean schema created successfully!"
7. Go to **Table Editor** and confirm these 9 tables exist:
   - sports, exercises, athletes, workouts, workout_exercises
   - performance_metrics, training_loads, wellbeing_assessments, training_recommendations
8. Confirm `sports` table has a "Bobsleigh" row
9. Confirm `exercises` table has 10 seed exercises

### Environment variables needed in `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Verification after setup:

```bash
cd backend
.venv/bin/python -c "from app.db.session import get_supabase; sb = get_supabase(); result = sb.table('sports').select('*').execute(); print(f'Sports: {len(result.data)} rows')"
```

## Issues Encountered
- None beyond the dependency conflicts documented in deviations

## Next Phase Readiness
- Backend starts cleanly with lean dependencies
- Schemas are UUID-compatible and ready for real Supabase data
- `get_supabase()` factory ready for endpoint wiring in Plan 01-03
- Dockerfile is correct for containerized deployment in Plan 01-04
- **Blocker for full verification:** Supabase schema deployment is a manual step

---
*Phase: 01-foundation*
*Completed: 2026-05-02*
