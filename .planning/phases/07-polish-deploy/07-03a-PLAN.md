---
phase: 07-polish-deploy
plan: 03a
type: execute
wave: 2
depends_on: ["07-02"]
files_modified:
  - backend/app/db/repositories/plan_repo.py
  - backend/app/db/repositories/coach_repo.py
  - backend/app/db/repositories/training_load_repo.py
  - backend/app/db/repositories/performance_repo.py
  - backend/app/api/endpoints/plans.py
  - backend/app/api/endpoints/coach.py
  - backend/app/api/endpoints/performance.py
  - backend/app/api/endpoints/auth.py
autonomous: true

must_haves:
  truths:
    - "Plan CRUD and approval workflow endpoints use repository layer instead of Supabase PostgREST"
    - "Coach roster and dashboard endpoints use repository layer"
    - "Performance metrics endpoints use repository layer"
    - "Auth endpoints have zero Supabase PostgREST calls"
  artifacts:
    - path: "backend/app/db/repositories/plan_repo.py"
      provides: "PlanRepository for weekly plans CRUD, approval workflow, batch queries"
      contains: "class PlanRepository"
    - path: "backend/app/db/repositories/coach_repo.py"
      provides: "CoachRepository for roster, relationships, dashboard queries"
      contains: "class CoachRepository"
    - path: "backend/app/db/repositories/training_load_repo.py"
      provides: "TrainingLoadRepository for PMC data and sRPE upsert"
      contains: "class TrainingLoadRepository"
    - path: "backend/app/db/repositories/performance_repo.py"
      provides: "PerformanceRepository for metrics and test results"
      contains: "class PerformanceRepository"
  key_links:
    - from: "backend/app/api/endpoints/plans.py"
      to: "backend/app/db/repositories/plan_repo.py"
      via: "repository replaces direct Supabase queries"
      pattern: "plan_repo\\."
    - from: "backend/app/api/endpoints/coach.py"
      to: "backend/app/db/repositories/coach_repo.py"
      via: "repository replaces direct Supabase queries"
      pattern: "coach_repo\\."
    - from: "backend/app/api/endpoints/performance.py"
      to: "backend/app/db/repositories/performance_repo.py"
      via: "repository replaces direct Supabase queries"
      pattern: "performance_repo\\."
---

<objective>
Create remaining repositories (plan, coach, training_load, performance) and migrate the remaining four endpoint files (plans, coach, performance, auth) from Supabase PostgREST to repository layer.

Purpose: After Plan 02 migrates 4 endpoint files, this plan creates the remaining 4 repositories and migrates the remaining 4 endpoint files. This completes the endpoint-level Supabase decoupling, leaving only service files for Plan 03b.

Output: Four new repositories (plan, coach, training_load, performance). Four endpoint files fully migrated off Supabase PostgREST. Updated repositories __init__.py with all exports.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/07-polish-deploy/07-RESEARCH.md
@.planning/phases/07-polish-deploy/07-02-SUMMARY.md

@backend/app/db/repositories/base.py
@backend/app/api/endpoints/plans.py
@backend/app/api/endpoints/coach.py
@backend/app/api/endpoints/performance.py
@backend/app/api/endpoints/auth.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remaining repositories (plan, coach, training_load, performance)</name>
  <files>
    backend/app/db/repositories/plan_repo.py
    backend/app/db/repositories/coach_repo.py
    backend/app/db/repositories/training_load_repo.py
    backend/app/db/repositories/performance_repo.py
  </files>
  <action>
    1. Create `backend/app/db/repositories/plan_repo.py` -- `PlanRepository(BaseRepository)`:
       - `get_by_id(plan_id: str) -> dict | None`
       - `get_current_for_athlete(athlete_id: str) -> dict | None` -- latest approved plan for current/upcoming week
       - `get_today_for_athlete(athlete_id: str, today: str) -> dict | None` -- approved plan covering today's date
       - `get_pending_for_coach(coach_id: str) -> list[dict]` -- status=pending_review, ordered by week_start
       - `get_for_athlete(athlete_id: str, status: str = None, limit: int = 10) -> list[dict]`
       - `create(data: dict) -> dict` -- INSERT RETURNING *
       - `update_status(plan_id: str, status: str, user_id: str, notes: str = None) -> dict | None` -- sets approved_at/rejected_at, approved_by/rejected_by
       - `get_latest_version(athlete_id: str, week_start: str) -> dict | None`
       - `create_new_version(data: dict) -> dict` -- for regeneration after rejection

    2. Create `backend/app/db/repositories/coach_repo.py` -- `CoachRepository(BaseRepository)`:
       - `get_by_user_id(user_id: str) -> dict | None`
       - `get_by_id(coach_id: str) -> dict | None`
       - `get_athletes(coach_id: str) -> list[dict]` -- JOIN coach_athletes to get athlete records
       - `get_athlete_ids(coach_id: str) -> list[str]` -- just IDs for batch queries
       - `add_athlete(coach_id: str, athlete_id: str) -> dict`
       - `remove_athlete(coach_id: str, athlete_id: str) -> bool` -- soft remove via ended_at
       - `get_all_active() -> list[dict]` -- for batch plan generation scheduler

    3. Create `backend/app/db/repositories/training_load_repo.py` -- `TrainingLoadRepository(BaseRepository)`:
       - `get_by_athlete_and_date(athlete_id: str, date: str) -> dict | None`
       - `get_range(athlete_id: str, date_from: str, date_to: str) -> list[dict]`
       - `upsert(athlete_id: str, date: str, data: dict) -> dict` -- INSERT ON CONFLICT UPDATE (additive for training_load)
       - `get_latest(athlete_id: str, limit: int = 42) -> list[dict]` -- for PMC chart, ORDER BY date DESC

    4. Create `backend/app/db/repositories/performance_repo.py` -- `PerformanceRepository(BaseRepository)`:
       - `get_by_athlete(athlete_id: str, metric_type: str = None, date_from: str = None, date_to: str = None, limit: int = 50) -> list[dict]`
       - `get_by_id(metric_id: str) -> dict | None`
       - `create(data: dict) -> dict`
       - `get_metric_types(athlete_id: str) -> list[str]` -- DISTINCT metric_type
  </action>
  <verify>
    Run: `cd backend && python -c "from app.db.repositories.plan_repo import PlanRepository; from app.db.repositories.coach_repo import CoachRepository; from app.db.repositories.training_load_repo import TrainingLoadRepository; from app.db.repositories.performance_repo import PerformanceRepository; print('All repos import OK')"`
  </verify>
  <done>
    - PlanRepository handles plan CRUD, approval workflow, versioning
    - CoachRepository handles roster queries, athlete relationships
    - TrainingLoadRepository handles PMC data with additive upsert
    - PerformanceRepository handles metrics CRUD and type listing
  </done>
</task>

<task type="auto">
  <name>Task 2: Migrate remaining endpoint files (plans, coach, performance, auth)</name>
  <files>
    backend/app/api/endpoints/plans.py
    backend/app/api/endpoints/coach.py
    backend/app/api/endpoints/performance.py
    backend/app/api/endpoints/auth.py
    backend/app/db/repositories/__init__.py
  </files>
  <action>
    Read ALL four endpoint files first to understand every Supabase query pattern before migrating.

    1. Migrate `plans.py`:
       - Remove `from app.db.session import get_supabase`
       - Add `from app.db.repositories.plan_repo import PlanRepository`
       - Create module-level `plan_repo = PlanRepository()`
       - Replace each Supabase PostgREST call with the corresponding repository method
       - Pay attention to route ordering (/current and /today before /{plan_id})
       - Handle approval/rejection state transitions via plan_repo.update_status
       - Handle batch generation with BackgroundTasks (keep existing pattern)

    2. Migrate `coach.py`:
       - Use CoachRepository + existing athlete/wellbeing/training_load repos from Plan 02
       - The coach dashboard endpoints aggregate data from multiple tables -- use appropriate repos for each

    3. Migrate `performance.py`:
       - Use PerformanceRepository
       - Replace all PostgREST query builder calls with repository methods

    4. Migrate `auth.py`:
       - Read the file first -- it likely has minimal Supabase usage (mostly delegates to security.py which was already migrated in Plan 01)
       - Remove any remaining get_supabase() calls

    5. Update `backend/app/db/repositories/__init__.py` to export ALL repositories (from 02 and 03a) for convenient importing.
  </action>
  <verify>
    Run: `cd backend && python -c "from app.db.repositories import PlanRepository, CoachRepository, TrainingLoadRepository, PerformanceRepository; print('All repos import OK')"`
    Run: `grep -r "get_supabase" backend/app/api/endpoints/ | grep -v __pycache__` -- should return zero results
  </verify>
  <done>
    - All 8 endpoint files (4 from Plan 02 + 4 from this plan) migrated to repository layer
    - Zero get_supabase() calls in any endpoint file
    - Plan approval workflow works through repository
    - Coach dashboard queries use repositories
    - repositories __init__.py exports all 8 repository classes
  </done>
</task>

</tasks>

<verification>
- All endpoint files import from repositories, not from get_supabase
- `grep -r "get_supabase" backend/app/api/endpoints/ | grep -v __pycache__` returns no results
- All repository classes can be instantiated without errors
- repositories __init__.py exports all 8 repository classes
</verification>

<success_criteria>
- Four new repositories created (plan, coach, training_load, performance)
- Four remaining endpoint files fully migrated off Supabase PostgREST
- Zero get_supabase() calls in any endpoint file
- Same API contracts maintained (no behavior change)
</success_criteria>

<output>
After completion, create `.planning/phases/07-polish-deploy/07-03a-SUMMARY.md`
</output>
