---
phase: 07-polish-deploy
plan: 03b
type: execute
wave: 3
depends_on: ["07-03a"]
files_modified:
  - backend/app/services/plan_generation_service.py
  - backend/app/services/pmc_service.py
  - backend/app/services/coach_service.py
  - backend/app/services/training_service.py
  - backend/app/services/performance_service.py
  - backend/app/services/exercise_selection_service.py
  - backend/app/services/injury_risk_service.py
  - backend/app/services/morning_adaptation_service.py
  - backend/app/main.py
autonomous: true

must_haves:
  truths:
    - "All services use repository layer for data access -- zero Supabase PostgREST calls remain in services"
    - "Health check endpoint uses SQLAlchemy instead of Supabase client"
    - "Backend starts without Supabase credentials when AUTH_PROVIDER=dev"
    - "get_supabase() is deprecated and only remains in session.py and auth_provider.py"
  artifacts:
    - path: "backend/app/services/plan_generation_service.py"
      provides: "Plan generation using repository layer"
      contains: "plan_repo"
    - path: "backend/app/services/pmc_service.py"
      provides: "PMC calculations using repository layer"
      contains: "training_load_repo"
    - path: "backend/app/main.py"
      provides: "Health check using SQLAlchemy engine"
      contains: "engine.connect"
  key_links:
    - from: "backend/app/services/plan_generation_service.py"
      to: "backend/app/db/repositories/plan_repo.py"
      via: "repository replaces direct Supabase queries"
      pattern: "plan_repo\\."
    - from: "backend/app/services/pmc_service.py"
      to: "backend/app/db/repositories/training_load_repo.py"
      via: "repository for training load queries"
      pattern: "training_load_repo\\."
    - from: "backend/app/main.py"
      to: "backend/app/db/session.py"
      via: "health check uses SQLAlchemy engine"
      pattern: "engine\\.connect"
---

<objective>
Migrate all 8 service files from Supabase PostgREST to repository layer. Update health check to use SQLAlchemy. Deprecate get_supabase(). Complete the backend Supabase decoupling.

Purpose: After Plan 03a migrates all endpoints, this plan finishes the remaining service-level Supabase calls. Combined with 03a, this fully decouples the backend from the Supabase Python client, enabling local PostgreSQL development.

Output: All 8 service files migrated to repositories. Health check uses SQLAlchemy engine. get_supabase() deprecated. Backend runs without Supabase credentials when AUTH_PROVIDER=dev.
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
@.planning/phases/07-polish-deploy/07-03a-SUMMARY.md

@backend/app/db/repositories/base.py
@backend/app/services/plan_generation_service.py
@backend/app/services/pmc_service.py
@backend/app/services/coach_service.py
@backend/app/services/training_service.py
@backend/app/services/performance_service.py
@backend/app/services/exercise_selection_service.py
@backend/app/services/injury_risk_service.py
@backend/app/services/morning_adaptation_service.py
@backend/app/main.py
</context>

<tasks>

<task type="auto">
  <name>Task 1: Migrate all service files to repository layer</name>
  <files>
    backend/app/services/plan_generation_service.py
    backend/app/services/pmc_service.py
    backend/app/services/coach_service.py
    backend/app/services/training_service.py
    backend/app/services/performance_service.py
    backend/app/services/exercise_selection_service.py
    backend/app/services/injury_risk_service.py
    backend/app/services/morning_adaptation_service.py
  </files>
  <action>
    Read ALL service files first to identify every get_supabase() call pattern.

    1. Migrate each service file to use the appropriate repository:
       - `plan_generation_service.py`: Uses athlete, workout, training_load, exercise, and plan repos. This is the largest service -- build dependency dict for which repos it needs.
       - `pmc_service.py`: Uses training_load repo for CTL/ATL/TSB calculation.
       - `coach_service.py`: Uses coach and athlete repos.
       - `training_service.py`: Uses workout and training_load repos. Handles sRPE upsert logic.
       - `performance_service.py`: Uses performance and training_load repos.
       - `exercise_selection_service.py`: Uses exercise repo. Falls back to hardcoded defaults.
       - `injury_risk_service.py`: Uses training_load and wellbeing repos. Standalone service.
       - `morning_adaptation_service.py`: Uses wellbeing repo. Adapts plan based on morning check-in.

    2. For each service:
       - Replace `from app.db.session import get_supabase` with repository imports
       - Create repository instances at the class level or module level
       - Map each `sb.table("X").select(...)...execute()` call to the equivalent repository method
       - Keep the same method signatures (other code calls these services)
       - Keep business logic unchanged -- only the data access layer changes
  </action>
  <verify>
    Run: `cd backend && grep -r "get_supabase" app/services/ --include="*.py" | grep -v __pycache__` -- should return zero results
    Run: `cd backend && python -c "from app.services.plan_generation_service import PlanGenerationService; print('Plan service OK')"`
    Run: `cd backend && python -c "from app.services.pmc_service import PMCService; print('PMC service OK')"`
  </verify>
  <done>
    - All 8 service files migrated to repository layer
    - Zero get_supabase() calls in any service file
    - Same method signatures maintained (no breaking changes for callers)
    - Business logic unchanged -- only data access layer swapped
  </done>
</task>

<task type="auto">
  <name>Task 2: Health check migration + get_supabase deprecation + final sweep</name>
  <files>
    backend/app/main.py
    backend/app/db/session.py
  </files>
  <action>
    1. Update `backend/app/main.py`:
       - Replace the health check's `get_supabase().table("sports")...` call with SQLAlchemy engine query:
         ```python
         from app.db.session import engine
         from sqlalchemy import text
         with engine.connect() as conn:
             result = conn.execute(text("SELECT id FROM sports LIMIT 1"))
             db_status = "connected" if result.fetchone() else "empty"
         ```
       - Remove the health check's import of get_supabase

    2. Add deprecation warning to get_supabase() in session.py:
       ```python
       import warnings
       def get_supabase() -> Client:
           """DEPRECATED: Use repositories instead. Kept only for SupabaseAuthProvider."""
           warnings.warn("get_supabase() is deprecated. Use repository classes.", DeprecationWarning, stacklevel=2)
           ...
       ```

    3. Final verification sweep:
       - Run `grep -r "get_supabase\|from supabase" backend/app/ --include="*.py" | grep -v __pycache__ | grep -v session.py`
       - The ONLY files that should still reference Supabase are `session.py` (deprecated get_supabase) and `auth_provider.py` (SupabaseAuthProvider)
       - If any other file still has get_supabase, migrate it
  </action>
  <verify>
    Run: `cd backend && grep -r "get_supabase" app/ --include="*.py" | grep -v __pycache__ | grep -v session.py | grep -v auth_provider.py` -- should return zero results
    Run: `cd backend && python -c "from app.main import app; print('App imports OK')"`
  </verify>
  <done>
    - Health check uses SQLAlchemy engine, not Supabase client
    - get_supabase() deprecated with warning in session.py
    - get_supabase() only remains in session.py (deprecated) and auth_provider.py (SupabaseAuthProvider)
    - Backend can start and serve requests with AUTH_PROVIDER=dev and DATABASE_URL pointing to local PostgreSQL
    - Zero runtime dependency on Supabase Python client when using dev auth mode
  </done>
</task>

</tasks>

<verification>
- `grep -r "get_supabase" backend/app/ --include="*.py" | grep -v __pycache__ | grep -v session.py | grep -v auth_provider.py` returns empty
- `cd backend && python -c "from app.main import app"` succeeds
- All service files import from repositories, not from session.get_supabase
- Health check endpoint uses SQLAlchemy engine
</verification>

<success_criteria>
- Complete Supabase PostgREST decoupling: zero active get_supabase() calls in endpoints or services
- All 8 service files use repositories for data access
- Health check uses SQLAlchemy engine
- Backend can run against any PostgreSQL database (not just Supabase)
- No behavior changes from the user's perspective (same API contracts)
</success_criteria>

<output>
After completion, create `.planning/phases/07-polish-deploy/07-03b-SUMMARY.md`
</output>
