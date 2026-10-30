---
phase: 01-foundation
plan: 01
subsystem: frontend
tags: [nextjs, typescript, mantine-v7, supabase, recharts, auth-migration]

# Dependency graph
requires:
  - phase: none
    provides: "First frontend plan, no prior dependencies"
provides:
  - "Zero TypeScript errors across entire frontend codebase"
  - "Successful pnpm build producing all 10 static pages"
  - "All components using useSupabase() from SupabaseProvider"
  - "All components compatible with Mantine UI v7 API"
  - "Recharts replacing chart.js in all chart components"
affects: [01-03, 01-04, 02-authentication]

# Tech tracking
tech-stack:
  added: [recharts]
  removed: [chart.js, react-chartjs-2, "@supabase/auth-helpers-react"]
  patterns: ["useSupabase() hook with null guards for all Supabase operations", "Mantine v7 prop naming (justify, gap, leftSection, decimalScale, ta, c, fs)"]

key-files:
  created:
    - frontend/src/lib/types/training.ts
  modified:
    - frontend/package.json
    - frontend/src/components/wellbeing/Reflection.tsx
    - frontend/src/components/wellbeing/WellbeingAssessment.tsx
    - frontend/src/components/wellbeing/WellbeingTrends.tsx
    - frontend/src/components/wellbeing/RecoveryHealth.tsx
    - frontend/src/components/wellbeing/MoodTracking.tsx
    - frontend/src/components/wellbeing/PhysicalMetrics.tsx
    - frontend/src/components/check-in/DailyCheckIn.tsx
    - frontend/src/components/check-in/WeeklyReview.tsx
    - frontend/src/components/dashboard/AthleteDashboard.tsx
    - frontend/src/components/dashboard/CoachDashboard.tsx
    - frontend/src/components/dashboard/AdminDashboard.tsx
    - frontend/src/components/dashboard/AthleteOverview.tsx
    - frontend/src/components/dashboard/PerformanceChart.tsx
    - frontend/src/components/training/TrainingAnalytics.tsx
    - frontend/src/components/training/TrainingAssessment.tsx
    - frontend/src/components/training/TrainingTabs.tsx
    - frontend/src/components/training/WorkoutDayCard.tsx
    - frontend/src/components/training/WorkoutForm.tsx
    - frontend/src/components/performance/PerformanceAssessment.tsx
    - frontend/src/components/performance/PerformanceTrends.tsx
    - frontend/src/components/settings/MFASetup.tsx
    - frontend/src/components/onboarding/Onboarding.tsx
    - frontend/src/components/onboarding/AthleteProfile.tsx
    - frontend/src/components/onboarding/GoalSetting.tsx
    - frontend/src/components/onboarding/TrainingPreferences.tsx
    - frontend/src/components/onboarding/InitialAssessment.tsx
    - frontend/src/components/coach/TrainingApprovalPanel.tsx
    - frontend/src/components/profile/ProfileCard.tsx
    - frontend/src/app/demo/page.tsx
  deleted:
    - frontend/src/utils/api.ts

key-decisions:
  - "Replace chart.js with recharts across 4 chart components rather than placeholder text"
  - "Use Mantine v7 prop names consistently: justify, gap, leftSection, decimalScale, ta, c, fs"
  - "Add if (!supabase) return null/void guards at function level rather than component level loading states"
  - "Replace TimeInput (removed from @mantine/core in v7) with TextInput for time inputs"
  - "Use Record<string, string> for string lookup maps to fix index signature errors"
  - "Convert Select multiple to single Select for WorkoutDayCard feedback (Mantine v7 Select no longer supports multiple prop)"

patterns-established:
  - "Supabase null guard: if (!supabase) return; at start of every async function using supabase"
  - "Mantine v7 migration: position->justify, spacing->gap, align->ta, color->c (for dimmed), icon->leftSection, leftIcon->leftSection, precision->decimalScale, italic->fs='italic'"
  - "TypeScript strict handlers: all component props and event handlers explicitly typed"

# Metrics
duration: ~30min
completed: 2026-05-02
---

# Phase 1 Plan 1: Frontend Compilation Fix Summary

**Zero TypeScript errors achieved across 30+ component files with Mantine v7 migration, auth provider replacement, and chart.js removal**

## Performance

- **Duration:** ~30 min (across 3 continuation sessions)
- **Completed:** 2026-05-02
- **Tasks:** 2/2 completed
- **Files modified:** 30+
- **Files deleted:** 1 (frontend/src/utils/api.ts)
- **Files created:** 1 (frontend/src/lib/types/training.ts)

## Accomplishments

- Removed chart.js + react-chartjs-2 + @supabase/auth-helpers-react from package.json
- Migrated 4 chart components from chart.js to recharts (TrainingAnalytics, PerformanceChart, PerformanceTrends, WellbeingTrends)
- Fixed catastrophic duplicate imports in Reflection.tsx and WellbeingAssessment.tsx
- Replaced demo page with placeholder (removed 4 non-existent module imports)
- Deleted duplicate API client (frontend/src/utils/api.ts)
- Migrated 19 components from useSupabaseClient() to useSupabase() hook
- Added supabase null safety guards in all 14 components with async operations
- Fixed 120+ Mantine v7 API breaking changes across 10+ components
- Added explicit TypeScript types to all handler functions and component props
- Created shared training types module (frontend/src/lib/types/training.ts)
- `pnpm build` succeeds with all 10 pages generating static content
- `pnpm dev` starts without crashes

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix broken imports and remove dead dependencies** - `0b4aeb8` (fix)
2. **Task 2: Migrate auth provider and fix Mantine v7 API across 19 components** - `2493aa9` (fix)

## Verification Results

All 6 verification checks pass:

1. `pnpm build` -- exits 0, compiles successfully in 44s, generates 12 static pages
2. `pnpm dev` -- starts dev server, ready in 2.3s
3. `grep -r "auth-helpers-react" frontend/src/` -- returns nothing (exit 1)
4. `grep -r "chart.js\|react-chartjs-2" frontend/src/` -- returns nothing (exit 1)
5. `grep -r "@/utils/api" frontend/src/` -- returns nothing (exit 1)
6. `ls frontend/src/utils/api.ts` -- does not exist

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Mantine v7 API breaking changes across 10+ components**
- **Found during:** Task 2 (TypeScript compilation check)
- **Issue:** 120+ TypeScript errors from Mantine v6 props used with Mantine v7 library. Errors across TrainingApprovalPanel, WorkoutDayCard, WorkoutForm, TrainingTabs, ProfileCard, InitialAssessment, AthleteProfile, TrainingPreferences, GoalSetting, Onboarding
- **Fix:** Systematically replaced all deprecated Mantine v6 props:
  - `position="apart"` -> `justify="space-between"`, `position="right"` -> `justify="flex-end"`
  - `spacing="xs"` -> `gap="xs"` on Stack components
  - `align="center"` -> `ta="center"` on Title/Text components
  - `color="dimmed"` -> `c="dimmed"` on Text components
  - `icon={...}` -> `leftSection={...}` on Tabs.Tab components
  - `leftIcon={...}` -> `leftSection={...}` on Button components
  - `italic` -> `fs="italic"` on Text components
  - `precision={N}` -> `decimalScale={N}` on NumberInput components
  - Removed `breakpoint` prop from Stepper (removed in v7)
  - Replaced `TimeInput` with `TextInput` (removed from @mantine/core in v7)
  - Removed `TabsValue` type import (not exported in v7)
  - Fixed `Select multiple` prop (not supported in v7, changed to single Select)
- **Files modified:** 10 component files
- **Committed in:** 2493aa9

**2. [Rule 3 - Blocking] Added explicit TypeScript types to all handler functions**
- **Found during:** Task 2 (TypeScript strict mode)
- **Issue:** 30+ implicit 'any' type errors (TS7006/TS7031) in onboarding components and others due to missing parameter type annotations
- **Fix:** Added explicit types to all handler functions: `handleTextChange(field: string) => (event: React.ChangeEvent<HTMLInputElement>)`, `handleSelectChange(field: string) => (value: string | null)`, etc.
- **Files modified:** InitialAssessment.tsx, AthleteProfile.tsx, TrainingPreferences.tsx, GoalSetting.tsx, Onboarding.tsx
- **Committed in:** 2493aa9

**3. [Rule 1 - Bug] Fixed NumberInput onChange type incompatibility**
- **Found during:** Task 2 (TypeScript compilation)
- **Issue:** Mantine v7 NumberInput onChange returns `string | number`, but handlers expected just `number`. Also `setRpe` dispatch had incompatible signature.
- **Fix:** Added `typeof value === 'string' ? parseFloat(value) || 0 : value` guards in onChange handlers
- **Files modified:** WorkoutDayCard.tsx
- **Committed in:** 2493aa9

**4. [Rule 3 - Blocking] Created shared training types module**
- **Found during:** Task 1 (resolving "has no exported member" errors)
- **Issue:** Components imported types from non-existent `@/lib/types/training` module
- **Fix:** Created `frontend/src/lib/types/training.ts` with TrainingSession, Exercise, ExerciseSet, DailyFeedback and other interfaces
- **Files modified:** frontend/src/lib/types/training.ts (created)
- **Committed in:** 0b4aeb8

**5. [Rule 1 - Bug] Fixed duplicate code blocks in RecoveryHealth.tsx and wellbeing page**
- **Found during:** Task 1 (import cleanup)
- **Issue:** RecoveryHealth.tsx had duplicate injury submission code; wellbeing/page.tsx had duplicate closing tags
- **Fix:** Removed duplicate code blocks
- **Committed in:** 0b4aeb8

---

**Total deviations:** 5 auto-fixed (3 bugs, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correct compilation. No scope creep. The Mantine v7 migration was the largest unplanned effort but was required for `pnpm build` to succeed.

## Issues Encountered
- Mantine v7 had significantly more breaking API changes than anticipated (120+ errors vs the ~42 expected from auth migration alone)
- Required 3 continuation sessions due to the volume of cross-file edits needed

## Next Phase Readiness
- Frontend compiles cleanly with zero TypeScript errors
- All pages generate static content successfully
- Dev server starts without crashes
- Ready for real data integration (Plan 01-03) and Docker Compose (Plan 01-04)
- Components use the unified useSupabase() hook, ready for authentication work in Phase 2

---
*Phase: 01-foundation*
*Completed: 2026-05-02*
