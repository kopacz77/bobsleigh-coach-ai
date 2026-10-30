---
phase: 02-authentication-roles
plan: 02
subsystem: auth
tags: [supabase, jwt, fastapi, axios, bearer-token, interceptor]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Supabase client (get_supabase), FastAPI endpoints, Axios API client
provides:
  - Supabase JWT validation via get_current_user dependency
  - get_optional_user dependency for optional auth endpoints
  - Auth guards on all API endpoints (athletes, training, performance)
  - GET /api/auth/me endpoint returning user profile
  - Frontend Axios interceptor sending Supabase access token
  - 401 response handling with redirect to login
affects: [02-authentication-roles, 03-training-data, 04-ai-engine]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-auth-get-user, fastapi-depends-auth-guard, axios-session-interceptor]

key-files:
  created: []
  modified:
    - backend/app/core/security.py
    - backend/app/api/endpoints/auth.py
    - backend/app/api/endpoints/athletes.py
    - backend/app/api/endpoints/training.py
    - backend/app/api/endpoints/performance.py
    - frontend/src/lib/api.ts

key-decisions:
  - "Use supabase.auth.get_user(token) instead of manual JWT decode with jose -- avoids JWKS rotation, algorithm, and audience claim issues"
  - "Use HTTPBearer scheme (not OAuth2PasswordBearer) since we no longer have a tokenUrl endpoint"
  - "Auth guard as Depends parameter on each endpoint rather than router-level middleware -- explicit and visible per-endpoint"

patterns-established:
  - "Auth guard pattern: user=Depends(get_current_user) on every protected endpoint"
  - "Optional auth pattern: user=Depends(get_optional_user) for public/mixed endpoints"
  - "Frontend token flow: supabase.auth.getSession() -> Bearer header via Axios interceptor"
  - "401 handling: Axios response interceptor redirects to /auth/login"

# Metrics
duration: 4min
completed: 2026-05-03
---

# Phase 2 Plan 2: Unified Auth Flow Summary

**Supabase JWT validation via auth.get_user(token) on all backend endpoints, with frontend Axios interceptor attaching session tokens automatically**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-03T02:44:11Z
- **Completed:** 2026-05-03T02:48:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Replaced custom bcrypt/jose JWT system with Supabase's auth.get_user(token) validation
- Added auth guards (Depends(get_current_user)) to all 14 API endpoint functions across 4 files
- Wired frontend Axios client to automatically send Supabase access tokens via request interceptor
- Added 401 response interceptor that redirects to /auth/login on token expiry

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace backend auth with Supabase JWT validation + add auth guards** - `2e951aa` (feat)
2. **Task 2: Wire frontend Axios client to send Supabase access token** - `6f25019` (feat)

## Files Created/Modified
- `backend/app/core/security.py` - Rewritten: get_current_user and get_optional_user dependencies using Supabase auth.get_user()
- `backend/app/api/endpoints/auth.py` - Rewritten: GET /me endpoint replacing hardcoded login and mock Google OAuth
- `backend/app/api/endpoints/athletes.py` - Added Depends(get_current_user) to all 5 endpoints
- `backend/app/api/endpoints/training.py` - Added Depends(get_current_user) to all 4 endpoints
- `backend/app/api/endpoints/performance.py` - Added Depends(get_current_user) to all 4 endpoints
- `frontend/src/lib/api.ts` - Replaced localStorage token with Supabase session interceptor, added 401 redirect, simplified authAPI

## Decisions Made
- **supabase.auth.get_user(token) over manual JWT decode:** Avoids JWKS rotation issues, algorithm mismatches, and audience claim problems. The Supabase SDK handles all validation internally.
- **HTTPBearer over OAuth2PasswordBearer:** Since we no longer have a /token endpoint, HTTPBearer is the correct scheme for extracting Bearer tokens.
- **Per-endpoint auth guards over router middleware:** Using Depends(get_current_user) on each endpoint function makes auth requirements explicit and visible. This also allows mixing protected and optional-auth endpoints on the same router.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth foundation is in place: all endpoints require valid Supabase JWT
- Ready for Plan 02-03 (role-based access control) which will use the user object returned by get_current_user to enforce coach/athlete permissions
- The get_optional_user dependency is ready for any future public endpoints

---
*Phase: 02-authentication-roles*
*Completed: 2026-05-03*
