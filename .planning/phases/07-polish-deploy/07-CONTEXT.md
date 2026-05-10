# Phase 7: Polish & Deploy - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Production-ready application with professional UX, local PostgreSQL development environment, and database-agnostic architecture. Mobile-optimized gym experience for athletes, consistent design system across all screens, full-stack Docker setup, and automated weekly plan generation.

**Key constraint change:** Supabase is no longer available (all free slots used by other projects). Local PostgreSQL via Docker for development. Neon (with Neon Auth) is the target for future deployment. Architecture must be database-agnostic to support this transition.

</domain>

<decisions>
## Implementation Decisions

### UX — Mobile Gym Experience
- Dashboard with quick-start is the landing experience: readiness score, today's focus, prominent "Start Workout" button
- One tap from dashboard drops athlete into active workout logging flow
- Rest timer between sets with vibrate/sound notification when rest period ends
- Keep screen awake (wake lock) during active workout to prevent phone sleeping
- Offline support: queue workout data locally if gym has bad signal, sync when back online
- Claude's discretion on logging interaction pattern (checklist vs card-per-exercise vs hybrid)

### UI — Design Polish
- System preference for dark/light mode (follow OS setting, design both equally)
- Claude's discretion on visual aesthetic (sport-coaching direction, no specific app reference locked in)
- Leverage design tooling: Storybook for component library, Stitch CLI / DESIGN.md for design system, and other available design tools
- Goal is "excellent" — not just functional polish, but genuinely well-designed. Use the tooling to achieve this.

### Behavior — Local Dev Setup
- Auth bypass in development: auto-login as configurable user (coach or athlete), no login screen in dev mode
- Auth system must be swappable — design for future Neon Auth or other provider without deep refactoring
- Full stack in Docker: `docker-compose up` starts PostgreSQL + backend + frontend in one command
- Seed data: Joshua Hudson training data (workouts, wellbeing, performance, exercises) imported on first run
- Cyrus Gray training methodology knowledge graph factored into exercise library and training protocols as coaching intelligence
- Database-agnostic backend: service layer abstracts all DB access so switching from local Postgres to Neon (or back to Supabase) is a config change, not a rewrite

### Claude's Discretion
- Mobile workout logging interaction pattern (checklist, swipeable cards, or hybrid)
- Visual aesthetic direction (sport-coaching appropriate)
- Loading states, error states, empty states design
- Exact spacing, typography, color palette within Mantine + design system
- Dev environment details (hot-reload strategy, environment variable management)

</decisions>

<specifics>
## Specific Ideas

- Athlete opens app at gym → sees dashboard with readiness + "Start Workout" → one tap into today's adapted workout → logs sets/reps/weight → rest timer runs between sets → phone stays awake throughout
- Cyrus Gray knowledge graph provides expert coaching intelligence for exercise selection, progressions, and training methodology — this is domain knowledge, not just data
- The Supabase backup (db_cluster-04-08-2025) contains the original schema and ~65 rows of seed data, but Joshua Hudson JSON files in the repo are the primary data source
- Design tooling stack: Storybook for component development/documentation, Stitch CLI for DESIGN.md-driven design system, Mantine v7 as the component library

</specifics>

<deferred>
## Deferred Ideas

- Neon Auth integration — future phase when deploying to production (currently local-only)
- Neon database deployment — future phase (local Postgres for now)
- Push notifications for training plans, recovery warnings, check-in reminders — separate phase
- Media attachments (exercise videos, form check recordings) — separate phase
- Native mobile app (PWA or React Native) — future milestone

</deferred>

---

*Phase: 07-polish-deploy*
*Context gathered: 2026-05-09*
