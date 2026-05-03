# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 3 — Training Core

## Current Position

Phase: 3 of 7 (Training Core)
Plan: 2 of 4 complete
Status: In progress
Last activity: 2026-05-03 — Completed 03-02-PLAN.md

Progress: ███░░░░░░░ 36% (10 plans complete, ~18 remaining across phases 3-7)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~6min
- Total execution time: ~62min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~40min | ~10min |
| 2. Auth & Roles | 4/4 | ~19min | ~5min |
| 3. Training Core | 2/4 | ~3min | ~2min |

**Recent Trend:**
- Last 5 plans: 02-01 (6min), 02-04 (3min), 02-03 (6min), 03-01 (?min), 03-02 (3min)
- Trend: Consistently fast execution on focused plans

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Fix foundations before new features (mock data, broken imports, auth issues must be resolved first)
- Standardize on recharts (remove chart.js to reduce bundle)
- Use Mantine v7 prop naming consistently: justify, gap, leftSection, decimalScale, ta, c, fs
- Use useSupabase() hook with null guards for all Supabase operations
- Use flexible pydantic version pin (>=2.5.3) to avoid conflicts with supabase 2.3.0
- Pin httpx to >=0.24.0,<0.25.0 for supabase compatibility
- Keep SQLAlchemy models with Integer PKs untouched (not actively used)
- Rename workout schema field 'type' to 'workout_type' matching Supabase column
- Return raw dicts from Supabase (no response_model) to avoid Pydantic validation mismatches
- PMC returns empty defaults when no training data exists (not fake random data)
- Soft-delete athletes (is_active=False) instead of hard delete
- Remove deprecated docker-compose version key (v2+ default)
- Remove frontend volume mount in Docker to preserve standalone build output
- Use output: "standalone" in next.config.js for Docker deployment
- Health check endpoint queries Supabase to verify database connectivity
- Use supabase.auth.get_user(token) instead of manual JWT decode with jose
- Use HTTPBearer scheme since no /token endpoint exists
- Auth guard as Depends(get_current_user) per endpoint, not router middleware
- useAuth hook wraps all Supabase Auth methods so pages never import supabase directly
- getSession() for initial session hydration (local storage, no network call) over getUser()
- Auth pages use useAuth() exclusively, never import from @/lib/supabase
- Backend uses service role key (bypasses RLS); RLS protects frontend direct access; Python code is defense-in-depth
- Auto-set user_id/athlete_id on create endpoints (never trust client input for ownership fields)
- Training endpoint athlete_id query param made optional (defaults to authenticated user's own athlete)
- Use app_metadata (not user_metadata) for role storage -- app_metadata is not client-writable
- Default role is 'athlete' set by database trigger on auth.users insert
- Coach promotion is manual via SQL or Supabase dashboard (no self-service)
- WorkoutCreate schema decoupled from WorkoutBase (athlete_id set server-side only)
- PATCH endpoint uses allowed-fields whitelist for safe updates
- Use Mantine notifications.show() for form feedback (not browser alerts)
- Training hook/API ID types changed from number to string (UUIDs)

### Pending Todos

- Deploy database schema to Supabase (manual step from 01-02 Task 2)
- Deploy RLS policies migration to Supabase (manual step from 02-04 Task 1)
- Deploy auth_roles_migration.sql to Supabase (manual step from 02-03 Task 1)
- Set up .env with Supabase credentials
- Run docker-compose verification (manual step from 01-04 Task 2)

### Blockers/Concerns

- ~150+ modified but uncommitted files from 6 months of work (non-planning files)
- SQLAlchemy models use Integer PKs but Supabase uses UUIDs (kept as-is for now)
- Supabase schema not yet deployed (manual step deferred)
- Docker full-stack verification not yet run (requires Supabase credentials)

## Session Continuity

Last session: 2026-05-03
Stopped at: Completed 03-02-PLAN.md (workout logging wired to API)
Resume file: None
