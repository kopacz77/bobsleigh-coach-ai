---
phase: 01-foundation
plan: 04
subsystem: infra
tags: [docker, docker-compose, pnpm, nextjs-standalone, supabase, health-check]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: "Frontend compilation fixes (Mantine v7, React 19 compat)"
  - phase: 01-foundation/01-03
    provides: "Backend wired to Supabase with service role key"
provides:
  - "Working Docker Compose config with frontend, backend, and db services"
  - "Frontend Dockerfile using pnpm with standalone Next.js output"
  - "Backend health check with Supabase connectivity test"
  - "Environment variable passthrough for Supabase credentials"
affects: [02-core-training, deployment, ci-cd]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Next.js standalone output for Docker builds"
    - "Multi-stage Dockerfile with pnpm corepack"
    - "Health check endpoint with database connectivity test"
    - "Environment variable passthrough from .env to Docker services"

key-files:
  modified:
    - "docker-compose.yml"
    - "frontend/Dockerfile"
    - "frontend/next.config.js"
    - "backend/app/main.py"

key-decisions:
  - "Removed deprecated docker-compose version key (v2+ default)"
  - "Removed frontend volume mount to preserve standalone build output"
  - "Added output: standalone to next.config.js for Docker deployment"
  - "Health check queries sports table to verify Supabase connectivity"

patterns-established:
  - "Docker env vars: use ${VAR:-${FALLBACK}} pattern for Supabase keys"
  - "Frontend Docker: pnpm via corepack, multi-stage with standalone output"
  - "Health endpoint: returns database connectivity status alongside app status"

# Metrics
duration: 1min
completed: 2026-05-02
---

# Phase 1 Plan 4: Docker Configuration Summary

**Fixed Docker Compose with pnpm frontend Dockerfile, standalone Next.js output, Supabase env passthrough, and health check database connectivity test**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-02T17:44:11Z
- **Completed:** 2026-05-02T17:45:25Z
- **Tasks:** 1 completed + 1 checkpoint documented
- **Files modified:** 4

## Accomplishments
- Frontend Dockerfile switched from npm to pnpm with corepack, multi-stage build with standalone output
- docker-compose.yml updated with full Supabase credential passthrough (SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY, SECRET_KEY)
- next.config.js gains `output: "standalone"` required for Docker standalone builds
- Backend health check now tests Supabase database connectivity and reports status
- Removed frontend volume mount that would override the standalone build output in Docker

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix Docker configuration and verify full stack** - `eaec146` (feat)

**Plan metadata:** (see below)

## Files Modified
- `docker-compose.yml` - Removed deprecated version key, added Supabase env vars and build args, removed frontend volume mount
- `frontend/Dockerfile` - Switched to pnpm via corepack, added build-time ARGs for Supabase env vars
- `frontend/next.config.js` - Added `output: "standalone"` for Docker standalone builds
- `backend/app/main.py` - Enhanced health check with Supabase database connectivity test

## Decisions Made
- **Removed deprecated `version: '3.8'` key** - Docker Compose v2+ ignores it and emits warnings
- **Removed frontend volume mount** - Volume mounts override the `.next/standalone` build output, breaking the production container. Backend keeps volume mount for development hot-reload.
- **Used `corepack prepare pnpm@9`** - Aligns with project's pnpm requirement from global CLAUDE.md instructions
- **Health check queries `sports` table** - Lightweight table to verify Supabase connectivity without heavy queries

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Checkpoint: Manual Verification Required

Task 2 is a `checkpoint:human-verify` that requires runtime Docker environment and Supabase credentials. Since these are not available in the current execution environment, the verification steps are documented here for manual execution.

### Prerequisites
1. Supabase project created with schema deployed (from 01-02 pending todo)
2. `.env` file populated with real credentials:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SECRET_KEY=your-secret-key
   ```

### Verification Commands
```bash
# 1. Build all services
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Wait for services to start
sleep 10

# 4. Check backend health (should show database: "connected" or "empty")
curl http://localhost:8000/health

# 5. Check athletes endpoint (should return JSON)
curl http://localhost:8000/api/athletes/

# 6. Check frontend responds (should return 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 7. Open in browser
# http://localhost:3000 - Should show app (login/landing page, no white screen)
# http://localhost:8000/docs - Should show Swagger API documentation

# 8. Test round-trip: create athlete via Swagger, verify in Supabase Dashboard

# 9. Clean up
docker-compose down
```

### Expected Results
- `docker-compose build` completes without errors for all 3 services
- `docker-compose up -d` starts frontend, backend, and db containers
- Health check returns `{"status":"healthy","environment":"development","database":"connected"}`
- Athletes endpoint returns `[]` or athlete data
- Frontend returns HTTP 200 and renders without white-screen crash

## Next Phase Readiness
- All Docker configuration files are corrected and committed
- Phase 1 foundation is complete pending manual verification
- Ready for Phase 2 (core training features) once Docker verification passes
- **Pending manual steps:** Deploy Supabase schema, set up .env, run docker-compose verification

---
*Phase: 01-foundation*
*Completed: 2026-05-02*
