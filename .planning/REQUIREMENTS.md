# Requirements: Bobsleigh Coach AI

**Defined:** 2026-05-02
**Core Value:** The AI generates genuinely useful, personalized weekly training plans that a bobsleigh coach would actually trust and use with their athletes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Foundation

- [ ] **FOUND-01**: Frontend compiles and runs without errors (fix broken imports, duplicate code)
- [ ] **FOUND-02**: Database schema deployed to Supabase with all required tables
- [ ] **FOUND-03**: Backend API connects to Supabase database (replace all mock/placeholder data)
- [ ] **FOUND-04**: Docker Compose dev environment works with all services connected

### Authentication

- [ ] **AUTH-01**: User can sign up and log in via Supabase Auth (email + Google OAuth)
- [ ] **AUTH-02**: Unified auth flow — single Supabase auth path for both frontend and backend
- [ ] **AUTH-03**: Role-based access control (coach sees coach views, athlete sees athlete views)
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: Row-level security policies enforce data isolation between athletes

### Training Management

- [ ] **TRAIN-01**: Exercise library searchable in UI with categorization (muscle group, movement, equipment)
- [ ] **TRAIN-02**: Workout logging persists to database (sets, reps, weight, time, RPE)
- [ ] **TRAIN-03**: Training history with filtering by date range, workout type, exercise
- [ ] **TRAIN-04**: Weekly training plan view showing daily workouts (mobile-friendly)
- [ ] **TRAIN-05**: Planned vs actual comparison for prescribed workouts
- [ ] **TRAIN-06**: Workout completion status tracking visible to coach

### Wellness & Recovery

- [ ] **WELL-01**: Daily wellness check-in captures sleep, soreness, mood, energy (under 60 seconds)
- [ ] **WELL-02**: Readiness score / traffic light system for at-a-glance athlete status
- [ ] **WELL-03**: Athlete can flag injury or concern that surfaces to coach
- [ ] **WELL-04**: Wellbeing trends visualization over time

### Performance Tracking

- [ ] **PERF-01**: PMC tracking with real athlete data (CTL, ATL, TSB)
- [ ] **PERF-02**: Performance charts showing progress trends over time
- [ ] **PERF-03**: Training load tracking (volume/intensity over time)

### Coach Experience

- [ ] **COACH-01**: Coach dashboard displays real athlete data (not mock/hardcoded)
- [ ] **COACH-02**: Multi-athlete roster view with check-in and workout status
- [ ] **COACH-03**: Alert system for concerning athlete trends (fatigue, missed check-ins, declining metrics)
- [ ] **COACH-04**: Coach-athlete relationship management (invite, assign, remove)

### AI & Intelligence

- [ ] **AI-01**: Rule-based weekly training plan generation (sport-specific, personalized to athlete)
- [ ] **AI-02**: Coach approval workflow for AI-generated plans (AI proposes, coach disposes)
- [ ] **AI-03**: Adaptive load adjustment based on morning readiness data
- [ ] **AI-04**: ML models integrated into backend API for real-time recommendations
- [ ] **AI-05**: Injury risk predictions based on training load and wellbeing data

### UX & Deployment

- [ ] **UX-01**: Mobile-responsive UI athletes can use at the gym/track (large touch targets, minimal typing)
- [ ] **UX-02**: Professional, polished UI design (consistent theming, not a developer prototype)
- [ ] **DEPLOY-01**: Production deployment on Google Cloud Run with Docker containers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Notifications

- **PUSH-01**: Push notifications for training plan delivery and reminders
- **PUSH-02**: Recovery warnings and check-in reminder notifications
- **PUSH-03**: Coach alert notifications when athlete trends are concerning

### Media & Content

- **MEDIA-01**: Exercise video/image attachments on workout entries
- **MEDIA-02**: Form check video recording and coach review

### Advanced Intelligence

- **GRAPH-01**: Exercise knowledge graph (relationships, progressions, muscle groups, sport demands)
- **GRAPH-02**: Exercise substitution engine using knowledge graph
- **COMP-01**: Competition calendar integration with auto-taper planning
- **SPORT-01**: Push start time tracking correlated with gym metrics

### Engagement

- **PR-01**: Personal records (PR) auto-detection and celebration
- **EXPORT-01**: CSV data export for coach analysis

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Social feed / athlete chat | Not a social network; teams use WhatsApp/Slack already |
| Nutrition tracking | MyFitnessPal owns this; simple quality slider in wellness suffices |
| Wearable integrations | Integration maintenance nightmare; manual entry covers 80% of value |
| Video analysis / CV | GPU infrastructure, pose estimation — years of development |
| Complex periodization builder | AI templates + coach modification is simpler and better |
| Payment/subscription | Premature before product-market fit |
| Multi-language / i18n | English-only initially; bobsleigh community is international but English-speaking |
| Gamification | Elite athletes are intrinsically motivated; badges feel patronizing |
| Real-time chat | WhatsApp/iMessage do this better; use comments on workouts |
| PDF reports | Screenshot-friendly dashboards + CSV export instead |
| Multi-sport support | Bobsleigh first; architecture supports expansion later |
| Native mobile apps | Responsive web first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 1 | Complete |
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| AUTH-05 | Phase 2 | Complete |
| TRAIN-01 | Phase 3 | Complete |
| TRAIN-02 | Phase 3 | Complete |
| TRAIN-03 | Phase 3 | Complete |
| TRAIN-04 | Phase 3 | Complete |
| TRAIN-05 | Phase 3 | Complete |
| TRAIN-06 | Phase 3 | Complete |
| WELL-01 | Phase 4 | Complete |
| WELL-02 | Phase 4 | Complete |
| WELL-03 | Phase 4 | Complete |
| WELL-04 | Phase 4 | Complete |
| PERF-01 | Phase 5 | Complete |
| PERF-02 | Phase 5 | Complete |
| PERF-03 | Phase 5 | Complete |
| COACH-01 | Phase 5 | Complete |
| COACH-02 | Phase 5 | Complete |
| COACH-03 | Phase 5 | Complete |
| COACH-04 | Phase 5 | Complete |
| AI-01 | Phase 6 | Pending |
| AI-02 | Phase 6 | Pending |
| AI-03 | Phase 6 | Pending |
| AI-04 | Phase 6 | Pending |
| AI-05 | Phase 6 | Pending |
| UX-01 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |
| DEPLOY-01 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-02*
*Last updated: 2026-05-03 after Phase 5 completion*
