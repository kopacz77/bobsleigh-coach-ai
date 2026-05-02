# Roadmap: Bobsleigh Coach AI

## Overview

Take the existing scaffolding — broken frontend, mock-data backend, standalone ML models — and build it into a working AI-powered coaching platform. Foundation fixes first (compilable code, real database), then layer on training and wellness data capture, then coach tools and performance analytics, and finally the AI training engine that is the product's core differentiator. Polish and deploy last.

## Phases

- [ ] **Phase 1: Foundation** - Fix compilation, deploy schema, wire backend to real database
- [ ] **Phase 2: Authentication & Roles** - Unified Supabase auth with coach/athlete role routing
- [ ] **Phase 3: Training Core** - Exercise library, workout logging, training history, plan view
- [ ] **Phase 4: Wellness & Recovery** - Daily check-in, readiness scoring, injury flagging, trends
- [ ] **Phase 5: Performance & Coach Dashboard** - PMC tracking, real-data coach dashboard, alerts
- [ ] **Phase 6: AI Training Engine** - Plan generation, coach approval, adaptive load, injury risk
- [ ] **Phase 7: Polish & Deploy** - Mobile UX optimization, design polish, production deployment

## Phase Details

### Phase 1: Foundation
**Goal**: Codebase compiles, backend talks to real database, dev environment works
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04
**Research**: Unlikely
**Success Criteria** (what must be TRUE):
  1. Frontend compiles and runs with `pnpm dev` without errors
  2. Backend starts and connects to Supabase PostgreSQL database
  3. API endpoints return data from database (not mock/hardcoded data)
  4. `docker-compose up` starts all services successfully
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — Fix frontend compilation errors (broken imports, remove chart.js, migrate Supabase auth hooks)
- [ ] 01-02-PLAN.md — Clean backend deps, fix schemas for UUID, create Python Dockerfile, deploy DB schema
- [ ] 01-03-PLAN.md — Wire all backend endpoints to Supabase (replace mock data with real queries)
- [ ] 01-04-PLAN.md — Fix Docker Compose, verify full stack integration

### Phase 2: Authentication & Roles
**Goal**: Users can securely log in and see role-appropriate views
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05
**Research**: Unlikely
**Success Criteria** (what must be TRUE):
  1. User can sign up, log in, and log out via the app
  2. Coach sees coach dashboard, athlete sees athlete dashboard (role routing works)
  3. Athlete can only access their own data (RLS enforced)
  4. Auth session persists across browser refresh
**Plans**: TBD

### Phase 3: Training Core
**Goal**: Athletes can log workouts and view training plans; coaches can see training history
**Depends on**: Phase 2
**Requirements**: TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-04, TRAIN-05, TRAIN-06
**Research**: Unlikely
**Success Criteria** (what must be TRUE):
  1. Coach can search and browse the exercise library in the UI
  2. Athlete can log a workout with exercises, sets, reps, and weight that persists to database
  3. Athlete can view their training history and filter by date/exercise
  4. Athlete can see their weekly training plan with daily workouts on mobile
**Plans**: TBD

### Phase 4: Wellness & Recovery
**Goal**: Athletes report daily wellness; coaches see readiness status at a glance
**Depends on**: Phase 2
**Requirements**: WELL-01, WELL-02, WELL-03, WELL-04
**Research**: Unlikely
**Success Criteria** (what must be TRUE):
  1. Athlete can complete daily wellness check-in in under 60 seconds
  2. Coach sees readiness traffic light (green/yellow/red) for each athlete
  3. Athlete can flag an injury or concern that surfaces to coach
  4. Athlete can view their wellbeing trends over time
**Plans**: TBD

### Phase 5: Performance & Coach Dashboard
**Goal**: Coach has a real-data command center; PMC and performance trends work
**Depends on**: Phase 3, Phase 4
**Requirements**: PERF-01, PERF-02, PERF-03, COACH-01, COACH-02, COACH-03, COACH-04
**Research**: Likely — PMC time constants and load calculation need adaptation for power sports (bobsleigh) vs the endurance model (TrainingPeaks)
**Success Criteria** (what must be TRUE):
  1. Coach dashboard shows real athlete data (check-ins, workouts, readiness)
  2. PMC chart displays real CTL/ATL/TSB calculated from logged workouts
  3. Coach can view and manage their athlete roster with status indicators
  4. Coach receives alerts for concerning athlete trends (fatigue spikes, missed check-ins)
**Plans**: TBD

### Phase 6: AI Training Engine
**Goal**: System generates personalized weekly training plans that coach reviews and approves
**Depends on**: Phase 5
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05
**Research**: Likely — rule-based plan generation logic, periodization model for bobsleigh, ML integration patterns, injury risk thresholds
**Success Criteria** (what must be TRUE):
  1. System generates a personalized weekly training plan based on athlete data and training phase
  2. Coach can review, modify, and approve AI-generated plans before athlete sees them
  3. Today's workout adjusts based on athlete's morning wellness check-in
  4. Injury risk warnings surface when training load patterns are concerning
**Plans**: TBD

### Phase 7: Polish & Deploy
**Goal**: Production-ready application with professional UX
**Depends on**: Phase 6
**Requirements**: UX-01, UX-02, DEPLOY-01
**Research**: Unlikely
**Success Criteria** (what must be TRUE):
  1. All primary screens are usable on a mobile phone at the gym/track
  2. UI has consistent professional design (not developer prototype aesthetic)
  3. Application is deployed and accessible on the public internet
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/4 | Planned | - |
| 2. Authentication & Roles | 0/TBD | Not started | - |
| 3. Training Core | 0/TBD | Not started | - |
| 4. Wellness & Recovery | 0/TBD | Not started | - |
| 5. Performance & Coach Dashboard | 0/TBD | Not started | - |
| 6. AI Training Engine | 0/TBD | Not started | - |
| 7. Polish & Deploy | 0/TBD | Not started | - |
