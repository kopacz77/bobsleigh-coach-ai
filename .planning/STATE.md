# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-02)

**Core value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.
**Current focus:** Phase 7 -- Polish & Deploy

## Current Position

Phase: 7 of 7 (Polish & Deploy)
Plan: 6 of 9 in phase 7
Status: In progress
Last activity: 2026-05-11 -- Completed 07-06-PLAN.md

Progress: ███████████████████░ 97% (30 plans complete, ~2 remaining in phase 7)

## Performance Metrics

**Velocity:**
- Total plans completed: 30
- Average duration: ~5min
- Total execution time: ~141min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 4/4 | ~40min | ~10min |
| 2. Auth & Roles | 4/4 | ~19min | ~5min |
| 3. Training Core | 4/4 | ~16min | ~4min |
| 4. Wellness & Recovery | 3/3 | ~9min | ~3min |
| 5. Perf & Coach Dash | 4/4 | ~9min | ~2min |
| 6. AI Training Engine | 5/5 | ~18min | ~4min |
| 7. Polish & Deploy | 6/9 | ~34min | ~6min |

**Recent Trend:**
- Last 5 plans: 07-01 (8min), 07-02 (6min), 07-05 (8min), 07-03a (5min), 07-06 (7min)
- Trend: Steady pace, mobile workout UX complete

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
- InjuryRiskService as standalone service (reusable by API endpoints and plan generation independently)
- Route /current before /{plan_id} in plans.py to prevent FastAPI path parameter capture
- Rejection auto-triggers background plan regeneration (new version with parent_plan_id)
- Batch generation uses BackgroundTasks to avoid HTTP timeout on large rosters
- Pydantic request models (GeneratePlanRequest, RejectPlanRequest) for type-safe body validation
- Morning adaptation computed on read, never stored (weekly_plans immutable after approval)
- adapted_weight_kg and adapted_reps are additional fields (planned values preserved)
- Wellbeing query failure returns plan unmodified (graceful degradation, not 500)
- Route /today before /{plan_id} in plans.py (same pattern as /current)
- Plans tab placed 2nd in CoachDashboard (after Athletes, before Check-Ins) -- plan review is primary coach activity
- Pending count badge on Plans tab for at-a-glance visibility
- Rejection modal enforces min 10-char feedback for meaningful AI feedback
- GenerateAllButton calculates next Monday automatically (no manual date picker)
- PlanReviewCard uses Collapse for expandable detail (not separate route/page)
- Injury risk display thresholds: <0.3 low/green, 0.3-0.6 moderate/yellow, >=0.6 high/red
- BaseRepository uses engine.connect() context manager for lightweight SQLAlchemy Core queries
- Wellbeing repository uses schema column names (assessment_date, athlete_id) not legacy Supabase names
- TrainingLoadRepository colocated in workout_repo.py (same training domain)
- Coach readiness uses DISTINCT ON + batch fetch instead of N+1 per-athlete queries
- get_supabase() deprecated but kept until all files migrated
- Repository instantiation as module-level singletons (e.g., athlete_repo = AthleteRepository())
- Steel Blue (#1971C2) as primary color -- athletic authority, universal trust, no team-color bias
- 44px minimum touch target height for all interactive elements (gym use)
- 14px minimum font size in workout-active views (readable at arm's length)
- 12px card radius (lg), 8px button/input radius (md) -- professional not bubbly
- defaultColorScheme=auto follows OS preference, manual toggle in header
- Auth provider abstraction: Protocol + factory pattern with dev/supabase implementations (backend)
- Dev mode: AUTH_PROVIDER=dev (backend) + NEXT_PUBLIC_AUTH_MODE=dev (frontend) for credential-free development
- DevAuthProvider returns static configured user for any token (no validation)
- SupabaseProvider still rendered in dev mode as inner wrapper so useSupabase() calls get safe defaults
- AuthGuard checks AuthModeContext and passes through immediately in dev mode
- Auth provider singleton cached at module level (get_auth_provider factory)
- TrainingLoadRepository also in separate training_load_repo.py (in addition to workout_repo.py) for cleaner service imports
- All endpoint files migrated off get_supabase() -- zero Supabase PostgREST calls in endpoint layer
- plan_repo.update_status handles approved/rejected branching internally (single method for both transitions)
- Audio is primary timer notification; vibration is Android Chrome enhancement only
- Wake lock uses wantLockRef pattern to track intent vs actual state for re-acquire
- Rest timer auto-starts on set completion with 120s default
- RPE selector shown only after all sets completed for an exercise
- Complete Workout maps SetLogger state to WorkoutCreate schema (sets count, last-set weight/reps, exercise RPE)

### Pending Todos

- ~~Deploy database schema to Supabase~~ -> Absorbed into Phase 7
- ~~Deploy RLS policies migration to Supabase~~ -> Absorbed into Phase 7
- ~~Deploy auth_roles_migration.sql to Supabase~~ -> Absorbed into Phase 7
- ~~Deploy weekly_plans_migration.sql to Supabase~~ -> Absorbed into Phase 7
- ~~Set up .env with Supabase credentials~~ -> Absorbed into Phase 7
- ~~Run docker-compose verification~~ -> Absorbed into Phase 7
- ~~Migrate remaining endpoint files (plans.py, coach.py, performance.py, auth.py) to repository layer~~ -> Done in 07-03a
- Migrate all service files off get_supabase() to repository layer
- Remove supabase dependency from requirements.txt after full migration

### Blockers/Concerns

- ~150+ modified but uncommitted files from 6 months of work (non-planning files)
- SQLAlchemy models use Integer PKs but Supabase uses UUIDs (kept as-is for now)
- Old Supabase project is paused -- needs data recovery, new project creation, and consolidated schema deployment (all Phase 7)
- Docker full-stack verification not yet run (requires Supabase credentials -- Phase 7)
- TrainingService still uses Supabase internally (deferred to service migration plan)

## Session Continuity

Last session: 2026-05-11
Stopped at: Completed 07-06-PLAN.md (active workout flow). Mobile-optimized gym UX with wake lock, rest timer, set logging, and dashboard integration.
Resume file: None
