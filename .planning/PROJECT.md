# Bobsleigh Coach AI

## What This Is

An AI-powered training application for bobsleigh athletes that generates personalized weekly training plans, tracks workouts and wellbeing, and provides coaching insights using machine learning. The coach creates athlete profiles and oversees AI-generated plans, athletes log workouts and how they feel from their phones, and the system learns and adapts over time. Built for a single coach and their athletes initially.

## Core Value

The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.

## Requirements

### Validated

- ✓ Frontend scaffold with pages for dashboard, training, performance, wellbeing, settings, profile — existing
- ✓ Backend FastAPI scaffold with API endpoints for auth, athletes, training, performance — existing (mock data only)
- ✓ Database schema design for athletes, workouts, performance tests, wellbeing, exercises — existing (SQL files)
- ✓ ML model definitions for PMC calculation, injury risk prediction, weekly plan generation — existing (standalone, not integrated)
- ✓ Supabase integration for frontend authentication — existing (partially broken)
- ✓ Docker Compose setup for local development — existing
- ✓ Joshua Hudson training data pipeline and exercise library — existing (one-off scripts)
- ✓ React Query hooks for server state management — existing
- ✓ Pydantic schemas for API validation — existing

### Active

- [ ] Backend wired to real Supabase database (replace all mock/placeholder data)
- [ ] Unified auth flow — single Supabase auth path for both frontend and backend
- [ ] Frontend compiles and runs without errors (fix broken imports, duplicate code)
- [ ] ML models integrated into backend API for real-time recommendations
- [ ] AI-generated weekly training plans that are sport-specific and personalized
- [ ] Working end-to-end core loop: AI generates plan → athlete logs workout → coach reviews → AI adapts
- [ ] Mobile-responsive UI that athletes can use at the gym/track
- [ ] Professional, polished UI design (not a developer prototype)
- [ ] Push notifications for training plans, recovery warnings, check-in reminders
- [ ] Media attachments — exercise videos and form check recordings on workouts
- [ ] Exercise knowledge graph for smarter recommendations (exercises, progressions, muscle groups, sport demands)
- [ ] PMC tracking with real athlete data (fitness, fatigue, form)
- [ ] Wellbeing tracking integrated into training recommendations
- [ ] Injury risk predictions based on training load and wellbeing data
- [ ] Production deployment (Google Cloud Run + Supabase)

### Out of Scope

- Multi-sport support — bobsleigh only for now, architecture should allow expansion later
- Other coaches signing up — single coach deployment, no multi-tenancy
- Native mobile apps — responsive web first, native apps are a future milestone
- Real-time chat between coach and athletes — out of scope, not core to training workflow
- Payment/subscription system — no monetization in v1
- Social features — no athlete-to-athlete interaction needed

## Context

- **Existing codebase:** ~150+ files modified but uncommitted over 6 months. Substantial frontend and backend scaffolding exists but most features are incomplete or use mock data.
- **Critical tech debt:** Backend returns hardcoded data instead of DB queries. SQLAlchemy models use Integer PKs but Supabase uses UUIDs. 20+ frontend components crash because `@supabase/auth-helpers-react` lacks its required provider. Multiple files won't compile due to duplicate imports.
- **Data:** Real training data from athlete Joshua Hudson has been parsed into JSON. Exercise library with progressions exists. This is the seed data for the ML models.
- **ML models:** PMC model, injury risk model, weekly plan generator, and recommendation engine exist as standalone Python classes but are not integrated into the backend API.
- **Codebase map:** Full analysis available in `.planning/codebase/` (7 documents covering stack, architecture, structure, conventions, testing, integrations, concerns).

## Constraints

- **Tech stack:** Next.js 14 + React 19 + Mantine UI (frontend), FastAPI + SQLAlchemy (backend), Supabase (auth + DB), Python ML pipeline — all already chosen and partially built
- **Package manager:** pnpm for frontend, pip for Python
- **Database:** Supabase PostgreSQL — already provisioned, schema designed
- **Deployment:** Google Cloud Run with Docker containers — deployment script exists
- **Auth:** Supabase Auth — already integrated on frontend, needs unification with backend
- **Single user:** Coach + their athletes only — no multi-tenancy complexity

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Keep existing tech stack | Substantial code already written, no reason to switch | — Pending |
| Supabase for auth + DB | Already integrated, managed service reduces ops burden | — Pending |
| Fix foundations before new features | Mock data, broken imports, auth issues must be resolved before building on top | — Pending |
| Exercise knowledge graph as enhancement, not blocker | App should work with current exercise library first, graph adds intelligence later | — Pending |
| Mobile-responsive web over native app | Faster to ship, single codebase, athletes just need a phone browser | — Pending |
| Standardize on recharts | More components already use it, remove chart.js to reduce bundle | — Pending |

---
*Last updated: 2026-05-02 after initialization*
