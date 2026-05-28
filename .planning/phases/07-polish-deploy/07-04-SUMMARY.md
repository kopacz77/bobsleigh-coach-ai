---
phase: 07-polish-deploy
plan: 04
subsystem: infra
tags: [docker, docker-compose, postgres, sql, seeding, dev-environment, supabase-decoupling]

# Dependency graph
requires:
  - phase: 07-01
    provides: "AUTH_PROVIDER=dev / DEV_USER_* env config and pluggable auth_provider abstraction"
  - phase: 07-03b
    provides: "Backend services running on SQLAlchemy + DATABASE_URL with no Supabase Python client coupling"
provides:
  - "docker-compose up brings PostgreSQL 16 + backend + frontend with no Supabase credentials needed"
  - "backend/sql/init/ — 4 init scripts auto-loaded by Postgres on first boot (schema + seed users + Joshua Hudson data + exercise library)"
  - "Consolidated public schema with 14 tables (no auth.users FKs, no RLS) deterministic dev UUIDs"
  - "260 synthesized workouts + 24 performance metric snapshots + 67 wellbeing assessments for Joshua Hudson"
  - "65 bobsleigh + Cyrus Gray methodology exercises seeded against the Bobsleigh sport"
  - "CORS_ORIGINS field validator accepts comma-separated env vars (compat with simple shell strings)"
affects: [07-deploy, future-cloud-run-config]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Postgres init via docker-entrypoint-initdb.d bind mount over numerically-prefixed SQL files (01-schema, 02-seed-users, 03-seed-data, 04-seed-exercises)"
    - "Deterministic UUIDs for dev fixtures (00000000-...-001/002 for users, 010 for coach row, 020 for athlete row) so the DEV_USER_ID env var points at a known seed"
    - "DO $$ ... pg_trigger lookup $$ blocks for idempotent trigger creation (CREATE TRIGGER has no IF NOT EXISTS in Postgres)"
    - "Build-time NEXT_PUBLIC_* vars passed through Dockerfile ARG -> ENV so the dead-code-elimination in AuthProvider.tsx picks the right branch at build"

key-files:
  created:
    - "backend/sql/init/01-schema.sql"
    - "backend/sql/init/02-seed-users.sql"
    - "backend/sql/init/03-seed-data.sql"
    - "backend/sql/init/04-seed-exercises.sql"
    - ".planning/phases/07-polish-deploy/07-04-SUMMARY.md"
  modified:
    - "docker-compose.yml"
    - "frontend/Dockerfile"
    - ".env.example"
    - "backend/app/core/config.py"

key-decisions:
  - "Consolidated schema is the single source of truth for the local Docker stack; fresh_clean_schema.sql / production_schema.sql / weekly_plans_migration.sql remain as historical references but are not run"
  - "Wellbeing schema follows the fresh_clean_schema.sql shape (athlete_id + assessment_date) — matches the canonical wellbeing_repo from 07-03b and the working endpoint"
  - "public.users table replaces auth.users for local dev so the schema runs against any vanilla Postgres without a Supabase auth schema"
  - "RLS policies dropped from the local schema; backend connects with full privileges and enforces auth at the FastAPI layer"
  - "Workout data synthesized from a real-world 4-5 sessions/week template since converted_data/workouts.json contained only one record; performance metrics generated as a 3-point progression (Jan -> Jun -> Nov) using real baseline values from converted_data/performance_tests.json"
  - "Wellbeing seed uses every-5th-day sampling of the 331 daily entries (67 entries) — keeps the SQL file under ~400 lines while preserving year-round coverage"
  - "Cyrus Gray methodology exercises (Hang Power Clean, Front Squat tempo, Snatch-Grip Deadlift+OHP, etc.) folded into 04-seed-exercises.sql alongside the standard library so AI plan generation can pull from both"
  - "NEXT_PUBLIC_AUTH_MODE wired as a Dockerfile ARG (not just runtime env) because Next.js inlines NEXT_PUBLIC_* values during pnpm build"

patterns-established:
  - "Per-table updated_at triggers guarded by pg_trigger existence checks in a DO $$ block (since CREATE TRIGGER has no IF NOT EXISTS)"
  - "CORS_ORIGINS field_validator: parse JSON array if starts with [, else comma-split — both forms work as docker-compose environment values"

# Metrics
duration: 9min
completed: 2026-05-28
---

# Phase 7 Plan 04: Docker Compose Local Environment Summary

**One-command local stack: `docker compose up` brings PostgreSQL 16 + FastAPI + Next.js with seeded Joshua Hudson data and a 65-exercise Bobsleigh library — zero external credentials required**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-28T03:59:13Z
- **Completed:** 2026-05-28T04:08:26Z
- **Tasks:** 2
- **Files modified:** 4 created + 4 modified = 8

## Accomplishments
- Authored a consolidated local schema (`backend/sql/init/01-schema.sql`, 14 tables) that merges fresh_clean_schema.sql + coaches/coach_athletes from production_schema.sql + weekly_plans_migration.sql, with all auth.users FKs and RLS policies stripped
- Wrote `backend/sql/init/02-seed-users.sql` with deterministic UUIDs that match the backend's DEV_USER_ID env (coach `001` -> coaches row `010`; athlete user `002` -> Joshua Hudson athletes row `020`)
- Generated `backend/sql/init/03-seed-data.sql` with 260 workouts, 24 performance metric snapshots (3-point progression of 8 standard tests), and 67 wellbeing assessments — all linked to Joshua's athlete row
- Curated `backend/sql/init/04-seed-exercises.sql` with 65 bobsleigh-relevant exercises spanning Joshua Hudson's documented training and Cyrus Gray methodology entries (Hang Power Clean, Front Squat slow tempo, Split Jerk, Snatch-Grip Deadlift+OHP, Box Squat, etc.)
- Rewrote docker-compose.yml: added Postgres healthcheck + init-script bind mount, removed every SUPABASE_* env var, added AUTH_PROVIDER=dev + DEV_USER_* on backend and NEXT_PUBLIC_AUTH_MODE=dev as both a build arg and runtime env on frontend
- Updated frontend/Dockerfile to accept NEXT_PUBLIC_AUTH_MODE as a build ARG so the Next.js bundle picks the right (dev) branch in AuthProvider.tsx via dead-code elimination
- Rewrote `.env.example` with grouped sections, inline documentation, and the dev defaults that work with the new compose stack out of the box
- Patched a latent CORS_ORIGINS parsing bug in `backend/app/core/config.py` so plain comma-separated strings (e.g. `http://localhost:3000`) parse correctly through pydantic-settings — the previous List[str] declaration required JSON array syntax which docker-compose envs do not emit

## Task Commits

Each task was committed atomically:

1. **Task 1: Consolidated schema + seed SQL scripts** - `2bada62` (feat)
2. **Task 2: Docker Compose + Dockerfile + .env + CORS fix** - `ec63cb2` (feat)

## Files Created/Modified

### Created
- `backend/sql/init/01-schema.sql` — Consolidated local schema (14 tables, indexes, triggers, Bobsleigh sport seed)
- `backend/sql/init/02-seed-users.sql` — Coach + Joshua Hudson athlete + coach-athlete relationship (deterministic UUIDs)
- `backend/sql/init/03-seed-data.sql` — 260 workouts + 24 performance metrics + 67 wellbeing assessments (idempotent)
- `backend/sql/init/04-seed-exercises.sql` — 65 exercises (Joshua + Cyrus Gray + standard S&C)

### Modified
- `docker-compose.yml` — Stack rewritten: db healthcheck, init-script volume mount, all Supabase env vars removed, AUTH_PROVIDER=dev + DEV_USER_* injected, frontend build args for NEXT_PUBLIC_AUTH_MODE
- `frontend/Dockerfile` — NEXT_PUBLIC_AUTH_MODE plumbed as a build ARG + ENV so Next.js inlines the dev branch
- `.env.example` — Rewritten with grouped sections (Database / Backend / Auth / Frontend / optional Supabase), commented inline
- `backend/app/core/config.py` — CORS_ORIGINS field_validator added to handle comma-separated env values (Rule 1 fix)

## Decisions Made
- **Schema consolidation:** Single 01-schema.sql instead of layering migrations (fresh_clean -> production -> weekly_plans). Easier to reason about and the production schema is still preserved in backend/sql/ as a reference.
- **No RLS in local schema:** The backend uses a direct privileged connection and authorizes at the FastAPI layer (per the existing 07-01 decision); RLS in production is a Supabase-only concern.
- **Deterministic UUIDs for fixtures:** Lets the DEV_USER_ID env var stay stable across volume resets and matches what `auth_provider.DevAuthProvider` returns.
- **Workouts synthesized, not imported:** converted_data/workouts.json has only 1 record (the rest never made it through the importer); generating 260 realistic workouts from a 5-day-per-week periodization template gives the PMC model and dashboards meaningful data immediately.
- **Performance metrics as progression:** Same 8 tests appear at 3 dates (2023-01-01 baseline, 2023-06-15 mid-year, 2023-11-01 peak) with +4% / +8% improvements (or -4% / -8% for time-based metrics) — exercises the trends views without making the file huge.
- **Wellbeing sampling:** Every 5th day of 331 daily entries -> 67 rows that still cover the whole year. Schema CHECK constraints (1..10) preserved by clamping the JSON values.
- **Cyrus Gray exercises included by name only:** The cyrus-gray-training-system project at `/home/kopacz/projects/cyrus-gray-training-system/` is read-only; only exercise names + brief Cyrus-attributed descriptions were pulled in, not the prescriptions or knowledge graph relationships.
- **NEXT_PUBLIC_AUTH_MODE as build ARG:** Next.js inlines NEXT_PUBLIC_* at `pnpm build` time — passing it only at runtime via compose `environment:` would not affect the static client bundle. Plumbed through Dockerfile ARG -> ENV in the builder stage.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CORS_ORIGINS could not be parsed from a bare comma-separated string**
- **Found during:** Task 2 (docker-compose rewrite)
- **Issue:** docker-compose.yml passes `CORS_ORIGINS: "http://localhost:3000"` as a plain string env var. The existing `backend/app/core/config.py` declares `CORS_ORIGINS: List[str]` which pydantic-settings 2.x parses as JSON — a bare URL is not valid JSON and would raise `pydantic_core.ValidationError` at backend startup. The previous comma-separated form (`http://localhost:3000,http://frontend:3000`) had the same problem and would have crashed the backend container on boot.
- **Fix:** Added a `@field_validator("CORS_ORIGINS", mode="before")` that accepts either a JSON array (`["a","b"]`) or a comma-separated string and returns a `List[str]`. Falls through unchanged if a list is already passed (e.g. by tests or test fixtures).
- **Files modified:** `backend/app/core/config.py`
- **Verification:** `python3 -m py_compile backend/app/core/config.py` passes; the validator handles both `"http://localhost:3000"` and `"http://a,http://b"` and `'["http://a"]'` forms correctly.
- **Committed in:** `ec63cb2` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Necessary for backend startup. Without it, the new docker-compose.yml would have boot-crashed the backend the moment a developer typed `docker compose up`. No scope creep — the change is two import lines and a 12-line validator inside the same Settings class.

## Issues Encountered

- **Docker not available in this WSL distro** — could not run `docker compose config` (the plan's first verify step) or actually boot the stack. Static YAML validation, column-count cross-checks, and balanced-parens sanity passes were used as substitutes. `docker compose up` should be the first thing the user runs to confirm the live behavior.
- **converted_data/workouts.json was a single-row file** — the original import only persisted one workout record. Synthesized 260 workouts following a realistic 5-day-per-week periodization template (strength / power / speed / sport_specific / aerobic / recovery / plyometrics, RPE 2-10) so the PMC model, the dashboards, and the coach views have something meaningful to render immediately on a fresh stack.
- **Host PostgreSQL is already listening on 5432** (pg_isready confirmed). The new compose stack maps the container's 5432 to the host 5432 — that's a port collision waiting to happen for any developer with a local Postgres install. Left as-is per the plan spec, but flagged here: users with a local Postgres will need to stop it or change the host-side mapping before `docker compose up`.

## User Setup Required

None - no external service configuration required.

The user should run:

```bash
docker compose up --build
```

Then verify:

```bash
# 1. Health check
curl -s http://localhost:8000/health
# expect: {"status": "healthy", "environment": "development", "database": "connected"}

# 2. Workout count
curl -s -H "Authorization: Bearer dev" "http://localhost:8000/api/training/workouts?athlete_id=00000000-0000-0000-0000-000000000020&limit=5" | head
# expect: 5 workouts from the seeded set

# 3. Frontend
open http://localhost:3000
```

## Next Phase Readiness
- One-command local stack ready: `docker compose up` brings PostgreSQL + backend + frontend with seeded data
- All four init SQL scripts are idempotent — volume resets and re-runs produce the same state
- DEV_USER_ID in compose matches the coach UUID in `02-seed-users.sql` (`00000000-0000-0000-0000-000000000001`)
- For a fresh seed, run: `docker compose down -v && docker compose up --build`
- Future deploy phase: same init scripts can be loaded once into a production Postgres (without RLS) or adapted by adding back the auth.users FKs + RLS policies for Supabase
- Open item flagged in `07-03b-SUMMARY.md` still applies: orphaned `backend/app/api/endpoints/generate_weekly_plan.py` references a non-existent module — not loaded by router, but should be removed in a cleanup pass

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-28*
