# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 1 -- Foundation

## Current Position

Phase: 1 of 7 (Foundation)
Plan: 2 of 4
Status: In progress
Last activity: 2026-05-02 -- Completed 01-01-PLAN.md and 01-02-PLAN.md

Progress: ██░░░░░░░░ 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~18min
- Total execution time: ~35min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2/4 | ~35min | ~18min |

**Recent Trend:**
- Last 5 plans: 01-01 (~30min), 01-02 (5min)
- Trend: 01-01 was larger scope (30+ files), 01-02 was focused (8 files)

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

### Pending Todos

- Deploy database schema to Supabase (manual step from 01-02 Task 2)
- Set up .env with Supabase credentials

### Blockers/Concerns

- ~150+ modified but uncommitted files from 6 months of work (non-planning files)
- SQLAlchemy models use Integer PKs but Supabase uses UUIDs (kept as-is for now)
- Supabase schema not yet deployed (manual step deferred)
- Frontend compiles and builds successfully (resolved in 01-01)

## Session Continuity

Last session: 2026-05-02T17:34:52Z
Stopped at: Completed 01-01-PLAN.md
Resume file: None
