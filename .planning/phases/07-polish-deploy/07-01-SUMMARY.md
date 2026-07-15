---
phase: 07-polish-deploy
plan: 01
subsystem: auth
tags: [auth, dev-mode, provider-pattern, fastapi, nextjs, supabase]

# Dependency graph
requires:
  - phase: 02-auth-roles
    provides: Supabase auth integration (security.py, useAuth hook, AuthGuard)
provides:
  - Swappable auth provider abstraction (backend + frontend)
  - Dev mode that works without any Supabase credentials
  - AuthUser dataclass compatible with Supabase User attribute API
  - AuthModeContext for components to detect active auth mode
affects:
  - 07-03a (Docker compose -- needs AUTH_PROVIDER=dev env var)
  - 07-04 (E2E testing -- can run with dev auth)
  - 07-08 (Supabase rebuild -- switches AUTH_PROVIDER to supabase)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Provider pattern for auth abstraction (Protocol + factory function)"
    - "Build-time constant branching for hook selection (AUTH_MODE)"
    - "AuthModeContext for child components to detect dev vs supabase mode"

key-files:
  created:
    - backend/app/core/auth_provider.py
    - frontend/src/providers/DevAuthProvider.tsx
    - frontend/src/providers/AuthProvider.tsx
  modified:
    - backend/app/core/config.py
    - backend/app/core/security.py
    - frontend/src/lib/api.ts
    - frontend/src/app/layout.tsx
    - frontend/src/components/auth/AuthGuard.tsx
    - frontend/src/components/dashboard/AdminDashboard.tsx
    - .env.example

key-decisions:
  - "DevAuthProvider returns a static user for any token (no validation)"
  - "Auth mode selected by env var: AUTH_PROVIDER (backend), NEXT_PUBLIC_AUTH_MODE (frontend)"
  - "SupabaseProvider still rendered in dev mode as inner wrapper so useSupabase() calls get safe defaults"
  - "AuthGuard checks AuthModeContext to skip Supabase checks in dev mode"
  - "Auth provider singleton cached in module-level variable"

patterns-established:
  - "Provider pattern: Protocol-based auth provider with factory function (backend)"
  - "Conditional provider wrapping: AuthProvider selects dev or supabase subtree"
  - "Build-time constant hook branching: AUTH_MODE determines which hook runs"

# Metrics
duration: 8min
completed: 2026-05-11
---

# Phase 7 Plan 1: Dev Auth Provider Summary

**Swappable auth provider abstraction on backend (Python Protocol + factory) and frontend (React context wrapper) enabling credential-free local development**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-11T16:31:17Z
- **Completed:** 2026-05-11T16:39:29Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Backend auth provider abstraction with DevAuthProvider (static user) and SupabaseAuthProvider (real JWT validation) behind a Protocol interface
- Frontend AuthProvider wrapper that conditionally renders DevAuthProvider or SupabaseProvider based on NEXT_PUBLIC_AUTH_MODE env var
- Full build succeeds with NEXT_PUBLIC_AUTH_MODE=dev and no Supabase credentials (all 13 pages generated)

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend auth provider abstraction** - `7130f19` (feat)
2. **Task 2: Frontend auth provider abstraction** - `370d47b` (feat)

## Files Created/Modified
- `backend/app/core/auth_provider.py` - AuthUser dataclass, DevAuthProvider, SupabaseAuthProvider, factory function
- `backend/app/core/config.py` - Added AUTH_PROVIDER, DEV_USER_ID, DEV_USER_EMAIL, DEV_USER_ROLE settings
- `backend/app/core/security.py` - Refactored to use auth provider abstraction instead of direct Supabase calls
- `frontend/src/providers/DevAuthProvider.tsx` - Dev mode auth context with static user, no-op signIn/signOut
- `frontend/src/providers/AuthProvider.tsx` - Unified provider wrapper with AuthModeContext and useAuth hook
- `frontend/src/lib/api.ts` - Request interceptor sends dev-token in dev mode, skips 401 redirect
- `frontend/src/app/layout.tsx` - Replaced SupabaseProvider with AuthProvider
- `frontend/src/components/auth/AuthGuard.tsx` - Added dev mode bypass via AuthModeContext
- `frontend/src/components/dashboard/AdminDashboard.tsx` - Fixed broken import from missing package
- `.env.example` - Added AUTH_PROVIDER, DEV_USER_* and NEXT_PUBLIC_AUTH_MODE vars

## Decisions Made
- DevAuthProvider returns a static user for any token value (no validation in dev mode)
- Auth mode selected purely by environment variables (AUTH_PROVIDER on backend, NEXT_PUBLIC_AUTH_MODE on frontend)
- SupabaseProvider still rendered as inner wrapper in dev mode so legacy useSupabase() calls get safe defaults ({supabase: null, loading: false})
- AuthGuard reads AuthModeContext and immediately passes through children in dev mode (no loading state)
- Auth provider factory caches singleton instance at module level for performance

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] AuthGuard infinite loading in dev mode**
- **Found during:** Task 2 (Frontend auth provider abstraction)
- **Issue:** AuthGuard uses useSupabase() which returns {supabase: null} in dev mode, causing useEffect to early-return and isLoading to stay true forever (infinite loader)
- **Fix:** Added AuthModeContext check to AuthGuard -- in dev mode, immediately sets isAuthenticated=true and renders children
- **Files modified:** frontend/src/components/auth/AuthGuard.tsx
- **Verification:** pnpm build succeeds, all 13 pages prerender
- **Committed in:** 370d47b (Task 2 commit)

**2. [Rule 3 - Blocking] AdminDashboard import from missing @supabase/auth-helpers-react**
- **Found during:** Task 2 (Frontend auth provider abstraction)
- **Issue:** AdminDashboard.tsx imported useSupabaseClient from @supabase/auth-helpers-react which is not installed (pre-existing error)
- **Fix:** Replaced with useSupabase from @/providers/SupabaseProvider (project's own provider)
- **Files modified:** frontend/src/components/dashboard/AdminDashboard.tsx
- **Verification:** Build compiles successfully
- **Committed in:** 370d47b (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes necessary for the build to succeed. No scope creep.

## Issues Encountered
- git stash/pop conflict during build testing -- stashed changes conflicted with linter auto-modifications. Resolved by dropping stash and re-applying changes manually.

## User Setup Required

None - no external service configuration required. Dev mode works out of the box with default settings.

## Next Phase Readiness
- Dev mode fully operational -- backend returns configured user for any token, frontend renders without Supabase credentials
- Ready for 07-02 (env and config consolidation) and 07-03a (Docker compose)
- Switching to supabase mode requires setting AUTH_PROVIDER=supabase and NEXT_PUBLIC_AUTH_MODE=supabase plus valid Supabase credentials

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-11*
