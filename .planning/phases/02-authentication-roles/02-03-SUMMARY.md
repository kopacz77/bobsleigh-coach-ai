---
phase: 02-authentication-roles
plan: 03
subsystem: auth
tags: [supabase, rbac, app_metadata, role, navigation, mantine]

# Dependency graph
requires:
  - phase: 02-01
    provides: "useAuth hook with login/signup/logout/session"
  - phase: 02-02
    provides: "Backend Supabase token validation via get_current_user"
provides:
  - "UserRole type and role/isCoach/isAthlete/isAdmin from useAuth()"
  - "SQL trigger for default athlete role on signup"
  - "get_user_role() and is_coach() SQL helpers for RLS policies"
  - "Role-based dashboard rendering (CoachDashboard vs AthleteDashboard)"
  - "Role-based navigation sidebar (coach links vs athlete links)"
  - "Logout button in sidebar"
affects: [02-04-rls-policies, phase-3-training]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "app_metadata for secure role storage (not user-writable)"
    - "Role-conditional component rendering via useAuth().isCoach"
    - "Role-filtered navigation arrays in AppShell"

key-files:
  created:
    - "backend/sql/auth_roles_migration.sql"
  modified:
    - "frontend/src/hooks/useAuth.ts"
    - "frontend/src/app/dashboard/page.tsx"
    - "frontend/src/components/layout/AppShell.tsx"
    - "frontend/src/components/dashboard/CoachDashboard.tsx"
    - "frontend/src/components/dashboard/AthleteDashboard.tsx"

key-decisions:
  - "Use app_metadata (not user_metadata) for role -- app_metadata is not client-writable"
  - "Default role is 'athlete' set by database trigger on auth.users insert"
  - "Coach promotion is manual via SQL or Supabase dashboard (no self-service)"

patterns-established:
  - "Role derivation: useAuth() reads session.user.app_metadata.role"
  - "Role-conditional rendering: isCoach ? <CoachView /> : <AthleteView />"
  - "Navigation filtering: separate link arrays per role, selected by isCoach flag"

# Metrics
duration: 6min
completed: 2026-05-03
---

# Phase 2 Plan 3: Role-Based Access Control Summary

**RBAC via Supabase app_metadata with role-conditional dashboard and navigation rendering**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-03T02:52:01Z
- **Completed:** 2026-05-03T02:58:07Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- SQL migration ready for Supabase that auto-assigns 'athlete' role on signup via database trigger
- useAuth() hook now exposes role, isCoach, isAthlete, isAdmin derived from secure app_metadata
- Dashboard page conditionally renders CoachDashboard or AthleteDashboard based on user role
- Navigation sidebar shows coach-specific links (Athletes, Performance) or athlete-specific links (Training, Wellbeing, Profile)
- Logout button added to sidebar footer
- User email displayed in header

## Task Commits

Each task was committed atomically:

1. **Task 1: Create role migration SQL and expose role in useAuth hook** - `eba2ae2` (feat)
2. **Task 2: Implement role-based dashboard routing and navigation** - `2f06c85` (feat)

## Files Created/Modified

- `backend/sql/auth_roles_migration.sql` - SQL trigger for default role, helper functions for RLS
- `frontend/src/hooks/useAuth.ts` - Added UserRole type, role/isCoach/isAthlete/isAdmin properties
- `frontend/src/app/dashboard/page.tsx` - Role-conditional rendering of CoachDashboard vs AthleteDashboard
- `frontend/src/components/layout/AppShell.tsx` - Role-filtered navigation links, logout button, user email
- `frontend/src/components/dashboard/CoachDashboard.tsx` - Fixed router import, added "use client"
- `frontend/src/components/dashboard/AthleteDashboard.tsx` - Added "use client" directive

## Decisions Made

- **app_metadata over user_metadata:** app_metadata is not writable by the client SDK, making it the secure choice for role storage. user_metadata can be modified by users and should not be trusted for authorization.
- **Default athlete role:** New signups get 'athlete' automatically via database trigger. Coach promotion is intentionally manual (SQL update or Supabase dashboard).
- **Coach dashboard props:** Passed userId and userProfile=null from dashboard page since CoachDashboard expects these props. The component fetches its own data internally.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed CoachDashboard useRouter import**
- **Found during:** Task 2 (role-based dashboard routing)
- **Issue:** CoachDashboard imported `useRouter` from `next/router` (Pages Router) which crashes in App Router
- **Fix:** Changed import to `next/navigation` which provides the same `router.push()` API
- **Files modified:** frontend/src/components/dashboard/CoachDashboard.tsx
- **Verification:** pnpm build passes, no runtime errors
- **Committed in:** 2f06c85 (Task 2 commit)

**2. [Rule 1 - Bug] Added missing "use client" directives**
- **Found during:** Task 2 (role-based dashboard routing)
- **Issue:** CoachDashboard and AthleteDashboard use React hooks (useState, useEffect) but lacked "use client" directive, which would cause server-rendering errors in App Router
- **Fix:** Added "use client" to both component files
- **Files modified:** frontend/src/components/dashboard/CoachDashboard.tsx, frontend/src/components/dashboard/AthleteDashboard.tsx
- **Verification:** pnpm build passes
- **Committed in:** 2f06c85 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for App Router compatibility. No scope creep.

## Issues Encountered

None - plan executed smoothly after auto-fixing the App Router compatibility issues.

## User Setup Required

**SQL migration must be run manually in Supabase:**
1. Go to Supabase Dashboard > SQL Editor
2. Paste contents of `backend/sql/auth_roles_migration.sql`
3. Execute the SQL
4. To promote a user to coach: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "coach"}'::jsonb WHERE id = '<user-uuid>';`

## Next Phase Readiness

- Role infrastructure complete: trigger, helpers, and frontend integration all in place
- Ready for Plan 02-04 (RLS policies) which can use `get_user_role()` and `is_coach()` SQL helpers
- SQL migration file ready but requires manual deployment to Supabase

---
*Phase: 02-authentication-roles*
*Completed: 2026-05-03*
