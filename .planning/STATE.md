# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 2 — Authentication & Roles

## Current Position

Phase: 2 of 7 (Authentication & Roles)
Plan: 2 of 4 in phase (02-01 and 02-02 complete)
Status: In progress
Last activity: 2026-05-03 — Completed 02-01-PLAN.md (Supabase Auth wiring)

Progress: █████░░░░░ 21% (6 plans complete, ~22 remaining across phases 2-7)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~8min
- Total execution time: ~50min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~40min | ~10min |
| 2. Auth & Roles | 2/4 | ~10min | ~5min |

**Recent Trend:**
- Last 5 plans: 01-03 (4min), 01-04 (1min), 02-02 (4min), 02-01 (6min)
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

### Pending Todos

- Deploy database schema to Supabase (manual step from 01-02 Task 2)
- Set up .env with Supabase credentials
- Run docker-compose verification (manual step from 01-04 Task 2)

### Blockers/Concerns

- ~150+ modified but uncommitted files from 6 months of work (non-planning files)
- SQLAlchemy models use Integer PKs but Supabase uses UUIDs (kept as-is for now)
- Supabase schema not yet deployed (manual step deferred)
- Docker full-stack verification not yet run (requires Supabase credentials)

## Session Continuity

Last session: 2026-05-03
Stopped at: Completed 02-01-PLAN.md (Supabase Auth wiring). Next: 02-03.
Resume file: None
