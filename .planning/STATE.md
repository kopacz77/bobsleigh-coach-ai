# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 6 — AI Training Engine

## Current Position

Phase: 6 of 7 (AI Training Engine)
Plan: 1 of ~4 in phase 6
Status: In progress
Last activity: 2026-05-04 — Completed 06-01-PLAN.md

Progress: ███████████░░░░░ 71% (20 plans complete, ~8 remaining across phases 6-7)

## Performance Metrics

**Velocity:**
- Total plans completed: 20
- Average duration: ~5min
- Total execution time: ~95min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~40min | ~10min |
| 2. Auth & Roles | 4/4 | ~19min | ~5min |
| 3. Training Core | 4/4 | ~16min | ~4min |
| 4. Wellness & Recovery | 3/3 | ~9min | ~3min |
| 5. Perf & Coach Dash | 4/4 | ~9min | ~2min |
| 6. AI Training Engine | 1/? | ~6min | ~6min |

**Recent Trend:**
- Last 5 plans: 05-01 (2min), 05-02 (2min), 05-03 (3min), 05-04 (2min), 06-01 (6min)
- Trend: 06-01 slightly longer due to large plan generation service (1200 lines)

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
- Exercises table uses measurement_type (not movement_type) and equipment_needed text[] (not scalar equipment)
- Exercises are public reference data -- any authenticated user can browse (no ownership check)
- Supabase .ilike() uses asterisk wildcards for text search, .contains() for array filtering
- WorkoutCreate schema decoupled from WorkoutBase (athlete_id set server-side only)
- PATCH endpoint uses allowed-fields whitelist for safe updates
- Use Mantine notifications.show() for form feedback (not browser alerts)
- Training hook/API ID types changed from number to string (UUIDs)
- Pagination via offset/limit with forward-estimation (full page implies more pages)
- RPE-to-intensity mapping: 1-3=Low, 4-6=Medium, 7-10=High
- Weekly plan default tab replaces old Calendar tab
- WorkoutForm accepts optional onSuccess prop for modal close callback
- Coach role extracted via _get_user_role helper (app_metadata first, user_metadata fallback)
- PlannedVsActual uses per-exercise Card layout for readability across different metric types
- Diff badge colors: green=met/exceeded, red=fell short, gray=not logged
- Readiness score calculated on read, not stored in DB (no schema migration needed)
- Concern flag encoded as [CONCERN] prefix in notes column (no new DB column)
- Coach readiness returns "gray" for athletes without today's check-in
- Upsert wellbeing check-in via check-then-update/insert (Supabase PostgREST constraint)
- DailyCheckIn takes no props (backend identifies user via auth token)
- RecoveryHealth/Reflection userId made optional for forward compatibility
- Coach dashboard readiness via API-backed React Query hook, not direct Supabase
- Removed daily_checkins direct query (table did not exist) and dependent alert generation
- Removed objective metrics chart from WellbeingTrends (daily_metrics table not in schema)
- sRPE upsert wrapped in try/except so failure does not break workout update response
- Multiple workouts on same day sum their training loads (additive upsert)
- Return full PMC time series (removed [-8:] truncation from performance service)
- Performance hook/API ID types changed from number to string (UUIDs)
- Use Intl.DateTimeFormat for chart date labels (no dayjs dependency)
- Dynamic metric grouping from API metric_type field (not hardcoded categories)
- Default PMC chart to 42 days (6 weeks) for better training load visibility
- Coach alerts computed on read (not stored in notifications table)
- Batch wellbeing queries using .in_() to avoid N+1 problem
- Wellbeing alerts map through athlete.user_id (assessments use user_id not athlete_id)
- Coach-athlete soft-remove via ended_at (preserves relationship history)
- Fatigue spike at TSB < -20, overtraining risk at TSB < -30 (separate alert types)
- CoachDashboard has zero direct Supabase imports (all data via React Query -> coachAPI -> /api/coach/*)
- TSB color thresholds in PMC Summary: >0 green, -10..0 yellow, <-10 red
- Alert filter values match real API alert types (fatigue_spike, overtraining_risk, low_readiness, missed_checkin)
- Rule-based plan generation in backend/app/services/ (not ml/ module) -- deterministic, debuggable, works with limited data
- 5 periodization phases: general_prep, specific_prep, pre_competition, competition, transition
- Injury risk at plan generation time uses TSB + ACWR + wellbeing signals (no separate ML model for v1)
- Coach feedback learning via simple keyword matching on rejection notes (volume_high -> reduce sets)
- Exercise selection queries DB first, falls back to hardcoded bobsleigh defaults
- Weight assignment uses _round_to_plate(2.5kg) for all planned weights
- Plan versioning via parent_plan_id for rejection-regeneration lineage
- week_start constrained to Monday via CHECK(DOW = 1)

### Pending Todos

- Deploy database schema to Supabase (manual step from 01-02 Task 2)
- Deploy RLS policies migration to Supabase (manual step from 02-04 Task 1)
- Deploy auth_roles_migration.sql to Supabase (manual step from 02-03 Task 1)
- Deploy weekly_plans_migration.sql to Supabase (manual step from 06-01 Task 1)
- Set up .env with Supabase credentials
- Run docker-compose verification (manual step from 01-04 Task 2)

### Blockers/Concerns

- ~150+ modified but uncommitted files from 6 months of work (non-planning files)
- SQLAlchemy models use Integer PKs but Supabase uses UUIDs (kept as-is for now)
- Supabase schema not yet deployed (manual step deferred)
- Docker full-stack verification not yet run (requires Supabase credentials)

## Session Continuity

Last session: 2026-05-04
Stopped at: Completed 06-01-PLAN.md (plan generation engine). Ready for 06-02.
Resume file: None
