---
phase: 07-polish-deploy
plan: 05
subsystem: ui
tags: [mantine, design-system, dark-mode, color-scheme, responsive, design.md]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Next.js app with Mantine v7 provider and basic theme"
provides:
  - "DESIGN.md design system specification (Google Stitch format)"
  - "Mantine theme with sport-coaching design tokens"
  - "Dark/light mode toggle with system preference detection"
  - "Polished AppShell layout with professional navigation"
affects: [07-06, 07-07, 07-08, 07-09]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DESIGN.md Google Stitch format for design token specification"
    - "Mantine defaultColorScheme=auto for system preference detection"
    - "useMantineColorScheme + useComputedColorScheme for manual toggle"
    - "Mantine NavLink component for sidebar navigation with ThemeIcon"

key-files:
  created:
    - "DESIGN.md"
    - "frontend/src/components/ui/ColorSchemeToggle.tsx"
  modified:
    - "frontend/src/styles/theme.ts"
    - "frontend/src/app/layout.tsx"
    - "frontend/src/components/layout/AppShell.tsx"
    - "frontend/src/components/ui/index.ts"
    - "frontend/src/app/training/page.tsx"
    - "frontend/src/components/plans/PlanReviewCard.tsx"

key-decisions:
  - "Steel Blue (#1971C2) as primary color -- athletic authority, universal trust, no team-color bias"
  - "Forest Green (#2B8A3E) for positive/recovery states, Burnt Orange (#E8590C) for warnings/intensity"
  - "44px minimum touch target height for all interactive elements (gym use with sweaty hands)"
  - "14px minimum font size for workout-active views (readable at arm's length)"
  - "12px (lg) card radius, 8px (md) button/input radius -- professional, not bubbly"
  - "Inter font family with system font stack fallback"
  - "defaultColorScheme=auto follows OS preference, manual toggle in header"

patterns-established:
  - "Design tokens: DESIGN.md YAML frontmatter -> theme.ts Mantine createTheme"
  - "Color scheme: auto system preference with manual ActionIcon toggle"
  - "NavLink pattern: Mantine NavLink with ThemeIcon leftSection and active state"

# Metrics
duration: 8min
completed: 2026-05-11
---

# Phase 7 Plan 5: Design System and Dark Mode Summary

**DESIGN.md with Steel Blue/Green/Orange sport-coaching palette, Mantine theme tokens, dark mode with system preference and manual toggle, polished AppShell navigation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-11T16:31:29Z
- **Completed:** 2026-05-11T16:39:28Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created comprehensive DESIGN.md following Google Stitch format with colors, typography, spacing, shapes, and component patterns
- Applied design tokens to Mantine v7 theme: Steel Blue primary with custom color tuples, 44px touch targets, 12px card radius
- Implemented dark mode with system preference detection (defaultColorScheme="auto") and manual sun/moon toggle in header
- Polished AppShell layout: gradient app title, Mantine NavLink with ThemeIcon, narrower 260px sidebar, mobile-responsive with close-on-navigate

## Task Commits

Each task was committed atomically:

1. **Task 1: DESIGN.md and Mantine theme** - `09c0f5f` (feat)
2. **Task 2: Dark mode and layout shell polish** - `9f0e667` (feat)

## Files Created/Modified
- `DESIGN.md` - Design system specification with YAML tokens and markdown rationale
- `frontend/src/styles/theme.ts` - Mantine theme with steelBlue/coaching/intensity color tuples and component overrides
- `frontend/src/components/ui/ColorSchemeToggle.tsx` - Dark/light mode toggle with sun/moon icons
- `frontend/src/components/ui/index.ts` - Added ColorSchemeToggle export
- `frontend/src/app/layout.tsx` - Added defaultColorScheme="auto" to ColorSchemeScript and MantineProvider
- `frontend/src/components/layout/AppShell.tsx` - Polished layout with NavLink, ThemeIcon, gradient title, ColorSchemeToggle
- `frontend/src/app/training/page.tsx` - Wrapped TrainingTabs in Suspense boundary
- `frontend/src/components/plans/PlanReviewCard.tsx` - Fixed Table prop (size -> fz for Mantine v7)

## Decisions Made
- Steel Blue (#1971C2) as primary: conveys precision and trust, avoids gender/team-color bias
- 44px minimum touch target: follows Apple HIG and WCAG 2.5.8 for gym use
- Inter font with 14px minimum in workout views: readable at arm's length during sets
- 12px card radius, 8px button radius: professional but modern aesthetic
- System-preference dark mode with manual override: athletes train at all hours

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed PlanReviewCard Table prop**
- **Found during:** Task 1 (build verification)
- **Issue:** Mantine v7 Table does not have a `size` prop; uses `fz` for font size
- **Fix:** Changed `<Table size="xs">` to `<Table fz="xs">`
- **Files modified:** frontend/src/components/plans/PlanReviewCard.tsx
- **Verification:** pnpm build succeeds
- **Committed in:** 09c0f5f (Task 1 commit)

**2. [Rule 3 - Blocking] Wrapped TrainingTabs in Suspense boundary**
- **Found during:** Task 2 (build verification)
- **Issue:** `useSearchParams()` in TrainingTabs requires a Suspense boundary in Next.js 15; build failed during static page generation
- **Fix:** Added `<Suspense>` wrapper around `<TrainingTabs />` in training page
- **Files modified:** frontend/src/app/training/page.tsx
- **Verification:** pnpm build succeeds, all 13 pages generate
- **Committed in:** 9f0e667 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for successful build. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design system fully defined in DESIGN.md and applied to Mantine theme
- Dark mode works with system preference and manual toggle
- Layout shell is polished and mobile-responsive
- All pages build successfully
- Ready for mobile UX enhancements (plan 06+)

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-11*
