# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 1 -- Foundation (complete)

## Current Position

Phase: 1 of 7 (Foundation)
Plan: 4 of 4
Status: Phase complete
Last activity: 2026-05-02 -- Completed 01-04-PLAN.md

Progress: ████░░░░░░ 14% (4 plans complete, ~24 remaining across phases 2-7)

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: ~10min
- Total execution time: ~40min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~40min | ~10min |

**Recent Trend:**
- Last 5 plans: 01-01 (~30min), 01-02 (5min), 01-03 (4min), 01-04 (1min)
- Trend: Accelerating as scope narrows (01-01 was 30+ files, 01-04 was 4 files)

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

Last session: 2026-05-02T17:45:25Z
Stopped at: Completed 01-04-PLAN.md (Phase 1 complete)
Resume file: None
