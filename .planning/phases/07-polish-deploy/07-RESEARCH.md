# Phase 7: Polish & Deploy - Research

**Researched:** 2026-05-09
**Domain:** Database abstraction, auth bypass, Docker orchestration, mobile UX, design system, scheduled tasks, offline support
**Confidence:** HIGH (codebase analysis) / MEDIUM (library patterns) / LOW (offline sync browser compat)

## Summary

Phase 7 requires substantial refactoring to decouple the entire backend from the Supabase Python client, replace frontend Supabase Auth with a swappable abstraction, build a full Docker Compose development environment with seed data, and then polish the UI for mobile gym usage with offline support and professional design.

The codebase has deep Supabase coupling: every backend endpoint and service calls `get_supabase()` and uses the Supabase PostgREST query builder (`sb.table("X").select("*").eq("col", val).execute()`). The frontend has dual coupling: Supabase Auth (useAuth hook, SupabaseProvider, session management) and Supabase client for the API token interceptor. All of this must be replaced with a database-agnostic repository layer on the backend and an auth-agnostic provider on the frontend.

The mobile UX work involves Screen Wake Lock API (88% browser support, Baseline 2025), Vibration API (77% support, no Safari/Firefox), offline data queuing via IndexedDB + background sync, and responsive Mantine v7 patterns. The scheduled plan generation uses APScheduler with AsyncIOScheduler in FastAPI's lifespan events.

**Primary recommendation:** Start with database/auth abstraction (foundational), then Docker environment (enables testing), then design system and mobile UX (parallel), finally scheduled tasks and deployment config.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SQLAlchemy | 2.0.25 (already installed) | Database abstraction layer | Already in requirements.txt, provides engine/session, replaces Supabase PostgREST |
| psycopg2-binary | 2.9.9 (already installed) | PostgreSQL driver | Already in requirements.txt |
| APScheduler | 3.10.x | Scheduled task execution | De facto standard for Python scheduled jobs, FastAPI compatible |
| @serwist/next | latest | Service worker / PWA support | Successor to next-pwa, works with Next.js 14/15, maintained |
| dexie | 4.x | IndexedDB wrapper for offline data | Best ergonomics for IndexedDB, React hooks via dexie-react-hooks |
| Storybook | 10.x | Component development/documentation | Official Mantine integration guide covers v10+ |
| storybook-addon-mantine | latest | Mantine theme in Storybook | Official addon from Mantine docs |
| @google/design.md | latest | Design system spec/linting | Already referenced in user's global CLAUDE.md |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @mantine/hooks | 7.15.0 (installed) | useMediaQuery, useColorScheme | Mobile responsive, dark mode |
| @storybook/addon-themes | latest | Color scheme toggling in Storybook | Storybook dark/light mode preview |
| PostCSS preset mantine | 1.12.0 (installed) | CSS module breakpoint variables | Mobile-first responsive styles |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| APScheduler | Celery + Redis | Celery is overkill for a single cron job; adds Redis dependency |
| dexie | idb (raw IndexedDB wrapper) | dexie has better ergonomics and React hooks |
| Serwist | Workbox directly | Serwist wraps Workbox specifically for Next.js; less config |
| SQLAlchemy ORM | Raw SQL via psycopg2 | SQLAlchemy already installed and provides future ORM migration path |

**Installation (backend):**
```bash
pip install apscheduler==3.10.4
```

**Installation (frontend):**
```bash
cd frontend && pnpm add @serwist/next dexie dexie-react-hooks
cd frontend && pnpm add -D @storybook/nextjs storybook @storybook/addon-themes storybook-addon-mantine
```

## Architecture Patterns

### Backend: Repository Pattern for Database Abstraction

**Current state:** Every endpoint and service directly calls `get_supabase()` and uses PostgREST query builder syntax like `sb.table("athletes").select("*").eq("user_id", uid).execute()`. There are ~90+ such calls across 8 endpoint files and 8 service files.

**Target state:** A repository layer that abstracts database access behind a common interface. The repository uses SQLAlchemy Core (not ORM) to execute queries against the `DATABASE_URL` connection.

```
backend/app/
  db/
    session.py          # SQLAlchemy engine + session (keep existing)
    repositories/
      __init__.py
      base.py           # BaseRepository with common CRUD
      athlete_repo.py   # AthleteRepository
      workout_repo.py   # WorkoutRepository
      wellbeing_repo.py # WellbeingRepository
      plan_repo.py      # PlanRepository
      coach_repo.py     # CoachRepository
      exercise_repo.py  # ExerciseRepository
      training_load_repo.py
      performance_repo.py
```

**Pattern: Repository wrapping SQLAlchemy Core queries**

```python
# Source: Codebase analysis + SQLAlchemy Core patterns
from sqlalchemy import text
from app.db.session import engine

class BaseRepository:
    """Base repository using SQLAlchemy Core for database-agnostic queries."""

    def _execute(self, query: str, params: dict = None) -> list[dict]:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            return [dict(row._mapping) for row in result]

    def _execute_one(self, query: str, params: dict = None) -> dict | None:
        rows = self._execute(query, params)
        return rows[0] if rows else None

    def _execute_insert(self, query: str, params: dict = None) -> dict:
        with engine.connect() as conn:
            result = conn.execute(text(query), params or {})
            conn.commit()
            return dict(result.mappings().first()) if result.returns_rows else {}

class AthleteRepository(BaseRepository):
    def get_by_user_id(self, user_id: str) -> dict | None:
        return self._execute_one(
            "SELECT * FROM athletes WHERE user_id = :uid AND is_active = true",
            {"uid": user_id}
        )

    def get_by_id(self, athlete_id: str) -> dict | None:
        return self._execute_one(
            "SELECT * FROM athletes WHERE id = :id",
            {"id": athlete_id}
        )
```

**Migration strategy:** Replace `get_supabase()` calls one file at a time. Each endpoint/service gets a repository injected. The Supabase PostgREST query patterns map directly to SQL:

| Supabase PostgREST | SQL Equivalent |
|---------------------|----------------|
| `sb.table("X").select("*").eq("col", val).execute()` | `SELECT * FROM X WHERE col = :val` |
| `sb.table("X").select("a, b").in_("col", list).execute()` | `SELECT a, b FROM X WHERE col = ANY(:list)` |
| `sb.table("X").insert(data).execute()` | `INSERT INTO X (...) VALUES (...) RETURNING *` |
| `sb.table("X").update(data).eq("id", id).execute()` | `UPDATE X SET ... WHERE id = :id RETURNING *` |
| `sb.table("X").select("*, Y(*)").eq(...)` | `SELECT ... FROM X LEFT JOIN Y ON ... WHERE ...` |
| `sb.table("X").order("col", desc=True).limit(n)` | `ORDER BY col DESC LIMIT n` |
| `sb.table("X").gte("date", d).lte("date", d2)` | `WHERE date >= :d AND date <= :d2` |
| `sb.table("X").ilike("name", f"*{q}*")` | `WHERE name ILIKE '%' || :q || '%'` |
| `sb.table("X").is_("col", "null")` | `WHERE col IS NULL` |
| `sb.table("X").range(offset, offset+limit-1)` | `OFFSET :offset LIMIT :limit` |

**Key join pattern to handle:** Supabase nested selects like `select("*, workout_exercises(*, exercises(name))")` become explicit JOINs or separate queries. Use separate queries for simplicity (the Supabase client does this under the hood anyway with PostgREST embedding).

### Backend: Auth Bypass with Swappable Provider

**Current state:** `security.py` calls `get_supabase().auth.get_user(token)` to validate tokens. The `user` object returned has `.id`, `.email`, `.app_metadata`, `.user_metadata`.

**Target state:** An auth provider interface that can be swapped via environment variable.

```python
# backend/app/core/auth_provider.py
from dataclasses import dataclass
from typing import Optional, Protocol

@dataclass
class AuthUser:
    """Unified user object returned by all auth providers."""
    id: str
    email: str
    app_metadata: dict
    user_metadata: dict

class AuthProvider(Protocol):
    def get_user(self, token: str) -> Optional[AuthUser]:
        """Validate token and return user, or None if invalid."""
        ...

class DevAuthProvider:
    """Development auth bypass -- always returns a configurable user."""
    def __init__(self, user_id: str, email: str, role: str):
        self.user = AuthUser(
            id=user_id,
            email=email,
            app_metadata={"role": role},
            user_metadata={},
        )

    def get_user(self, token: str) -> Optional[AuthUser]:
        return self.user

class SupabaseAuthProvider:
    """Validates tokens via Supabase auth.get_user()."""
    def get_user(self, token: str) -> Optional[AuthUser]:
        from app.db.session import get_supabase
        try:
            sb = get_supabase()
            resp = sb.auth.get_user(token)
            if resp and resp.user:
                u = resp.user
                return AuthUser(
                    id=u.id,
                    email=u.email or "",
                    app_metadata=u.app_metadata or {},
                    user_metadata=u.user_metadata or {},
                )
        except Exception:
            pass
        return None
```

**Config-driven selection:**
```python
# In config.py
AUTH_PROVIDER: str = "dev"  # "dev" | "supabase" | "neon"
DEV_USER_ID: str = "00000000-0000-0000-0000-000000000001"
DEV_USER_EMAIL: str = "coach@dev.local"
DEV_USER_ROLE: str = "coach"  # or "athlete"
```

**Frontend auth bypass:** In dev mode, skip SupabaseProvider entirely. The API interceptor sends a dummy Bearer token. The backend DevAuthProvider ignores the token value and returns the configured user.

```typescript
// frontend/src/lib/api.ts -- dev mode interceptor
api.interceptors.request.use(async (config) => {
  if (process.env.NEXT_PUBLIC_AUTH_MODE === 'dev') {
    config.headers.Authorization = 'Bearer dev-token';
    return config;
  }
  // ... existing Supabase token logic
});
```

### Frontend: Auth Provider Abstraction

Replace `useSupabase()` and `useAuth()` with an auth-mode-agnostic hook:

```typescript
// frontend/src/providers/AuthProvider.tsx
const AUTH_MODE = process.env.NEXT_PUBLIC_AUTH_MODE || 'dev';

// Dev mode: no real auth, user is always logged in
// Supabase mode: existing SupabaseProvider + useAuth flow
// Future: Neon Auth mode

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (AUTH_MODE === 'dev') {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
```

### Docker Compose: Full Stack with Seed Data

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bobsleigh
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init:/docker-entrypoint-initdb.d  # Auto-run on first start
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      ENVIRONMENT: development
      DATABASE_URL: postgresql://postgres:postgres@db:5432/bobsleigh
      AUTH_PROVIDER: dev
      DEV_USER_ID: "00000000-0000-0000-0000-000000000001"
      DEV_USER_EMAIL: "coach@dev.local"
      DEV_USER_ROLE: "coach"
      CORS_ORIGINS: "http://localhost:3000"
    depends_on:
      db:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      NEXT_PUBLIC_AUTH_MODE: dev
    depends_on:
      - backend

volumes:
  postgres_data:
```

**Seed data strategy:** Create `backend/sql/init/` directory with numbered SQL files that run in order on first `docker-compose up`:
1. `01-schema.sql` -- consolidated schema (fresh_clean_schema + coaches + coach_athletes + weekly_plans)
2. `02-seed-users.sql` -- create dev users (coach and athlete) in a local users table
3. `03-seed-data.sql` -- insert Joshua Hudson training data from converted JSON files
4. `04-seed-exercises.sql` -- full exercise library including Cyrus Gray methodology

Note: Since there is no `auth.users` table in local Postgres (that's a Supabase-specific schema), the `athletes.user_id` and `coaches.user_id` columns will reference the dev user UUIDs directly. The dev auth provider returns a matching user ID.

### Schema Adaptation for Local Postgres

The production schema references `auth.users` (Supabase-specific). For local Postgres:
- Remove all `REFERENCES auth.users(id)` foreign key constraints
- Keep `user_id uuid` columns but without FK enforcement
- Create a simple `public.users` table for dev seed data (id, email, role)
- The auth_roles_migration.sql trigger and functions are Supabase-specific and should be skipped
- RLS policies are not needed locally (backend uses direct connection, not PostgREST)

### Mobile Workout Experience

**Screen Wake Lock pattern:**
```typescript
// frontend/src/hooks/useWakeLock.ts
export function useWakeLock() {
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      setWakeLock(lock);
      lock.addEventListener('release', () => setWakeLock(null));
    } catch (e) { /* Battery low or system restriction */ }
  }, [isSupported]);

  const release = useCallback(async () => {
    await wakeLock?.release();
    setWakeLock(null);
  }, [wakeLock]);

  // Re-acquire on visibility change
  useEffect(() => {
    const handler = async () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        await request();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [wakeLock, request]);

  return { isActive: !!wakeLock, isSupported, request, release };
}
```

**Rest timer pattern:**
```typescript
// frontend/src/hooks/useRestTimer.ts
export function useRestTimer(defaultSeconds = 120) {
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback((seconds = defaultSeconds) => {
    setRemaining(seconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          // Vibrate if supported (Android Chrome only)
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
          // Audio notification as fallback
          new Audio('/sounds/timer-end.mp3').play().catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [defaultSeconds]);

  // cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  return { remaining, isRunning, start, stop: () => { clearInterval(intervalRef.current); setIsRunning(false); } };
}
```

**Vibration API note:** Vibrate only works on Android Chrome. Safari and Firefox do not support it. The rest timer MUST use audio notification as the primary notification method with vibrate as an enhancement.

### Offline Data Queue Pattern

```typescript
// frontend/src/lib/offlineDb.ts
import Dexie from 'dexie';

class OfflineDB extends Dexie {
  pendingWorkouts!: Dexie.Table<PendingWorkout, number>;

  constructor() {
    super('bobsleigh-offline');
    this.version(1).stores({
      pendingWorkouts: '++id, status, createdAt',
    });
  }
}

interface PendingWorkout {
  id?: number;
  data: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  createdAt: string;
  errorMessage?: string;
}

export const offlineDb = new OfflineDB();

// Queue a workout when offline
export async function queueWorkout(data: Record<string, unknown>) {
  await offlineDb.pendingWorkouts.add({
    data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
}

// Sync all pending workouts when online
export async function syncPendingWorkouts(api: typeof import('@/lib/api').default) {
  const pending = await offlineDb.pendingWorkouts
    .where('status').equals('pending')
    .toArray();

  for (const item of pending) {
    try {
      await offlineDb.pendingWorkouts.update(item.id!, { status: 'syncing' });
      await api.post('/api/training/workouts', item.data);
      await offlineDb.pendingWorkouts.update(item.id!, { status: 'synced' });
    } catch (e) {
      await offlineDb.pendingWorkouts.update(item.id!, {
        status: 'error',
        errorMessage: String(e),
      });
    }
  }
}
```

**Online/offline detection:**
```typescript
// Use navigator.onLine + 'online'/'offline' events
// Sync on 'online' event and on app mount if online
useEffect(() => {
  const handler = () => syncPendingWorkouts(api);
  window.addEventListener('online', handler);
  if (navigator.onLine) handler();
  return () => window.removeEventListener('online', handler);
}, []);
```

**Background Sync limitation:** The Background Sync API only works in Chromium browsers. Safari and Firefox do not support it. Use the `online` event listener approach instead, which works everywhere.

### Mantine Dark Mode Setup

```tsx
// Already partially in place in layout.tsx -- needs defaultColorScheme="auto"
<ColorSchemeScript defaultColorScheme="auto" />
<MantineProvider theme={theme} defaultColorScheme="auto">
```

```tsx
// Color scheme toggle component
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light');
  return (
    <ActionIcon onClick={() => setColorScheme(computed === 'dark' ? 'light' : 'dark')}>
      {computed === 'dark' ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
}
```

### APScheduler for Saturday Night Plan Generation

```python
# backend/app/scheduler.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = AsyncIOScheduler()

async def generate_weekly_plans_job():
    """Auto-generate training plans for all athletes Saturday night."""
    from app.db.repositories.coach_repo import CoachRepository
    from app.services.plan_generation_service import PlanGenerationService
    from datetime import date, timedelta
    import logging

    logger = logging.getLogger(__name__)
    logger.info("Running scheduled plan generation")

    # Next Monday
    today = date.today()
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7
    next_monday = (today + timedelta(days=days_until_monday)).isoformat()

    coach_repo = CoachRepository()
    coaches = coach_repo.get_all_active()
    plan_service = PlanGenerationService()

    for coach in coaches:
        try:
            await plan_service.generate_plans_batch(coach["id"], next_monday)
            logger.info("Generated plans for coach %s", coach["id"])
        except Exception as e:
            logger.error("Failed to generate plans for coach %s: %s", coach["id"], e)

# Register job: Saturday at 10 PM
scheduler.add_job(
    generate_weekly_plans_job,
    CronTrigger(day_of_week='sat', hour=22, minute=0),
    id='weekly_plan_generation',
    replace_existing=True,
)
```

```python
# In main.py, use lifespan events
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.scheduler import scheduler
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan, ...)
```

### Design System: DESIGN.md + Storybook

The user's global CLAUDE.md specifies using `@google/design.md` CLI. The spec reference is at `~/.claude/design-md-spec.md`.

**DESIGN.md creation approach:**
1. Create `DESIGN.md` in project root following the Google Stitch specification
2. Define design tokens in YAML frontmatter: colors, typography, spacing, elevation
3. Write design rationale in markdown body
4. Validate with `npx @google/design.md lint DESIGN.md`
5. Export to Tailwind/CSS variables if needed

**Storybook setup for Mantine v7 + Next.js:**
- Initialize: `npx storybook@latest init` in frontend directory
- Install addon: `pnpm add -D @storybook/addon-themes storybook-addon-mantine`
- Configure `.storybook/main.ts` with `@storybook/nextjs` framework
- Configure `.storybook/preview.tsx` to wrap stories with `MantineProvider`
- Import `@mantine/core/styles.css` in preview

### Recommended Project Structure Additions

```
backend/
  app/
    core/
      auth_provider.py    # AuthUser, DevAuthProvider, SupabaseAuthProvider
      config.py           # Updated with AUTH_PROVIDER, DEV_USER_* settings
      security.py         # Updated to use auth provider
    db/
      repositories/       # New: database abstraction layer
        __init__.py
        base.py
        athlete_repo.py
        workout_repo.py
        wellbeing_repo.py
        plan_repo.py
        coach_repo.py
        exercise_repo.py
        training_load_repo.py
        performance_repo.py
      session.py           # Keep SQLAlchemy engine; remove get_supabase()
    sql/
      init/                # New: Docker init scripts
        01-schema.sql
        02-seed-users.sql
        03-seed-data.sql
        04-seed-exercises.sql
    scheduler.py           # New: APScheduler for cron jobs
  main.py                  # Updated: lifespan events for scheduler

frontend/
  .storybook/              # New: Storybook config
    main.ts
    preview.tsx
  src/
    hooks/
      useWakeLock.ts       # New: screen wake lock
      useRestTimer.ts      # New: rest timer with vibrate/audio
      useOnlineStatus.ts   # New: online/offline detection
    lib/
      offlineDb.ts         # New: Dexie IndexedDB for offline queue
      auth.ts              # New: auth-mode-agnostic utilities
    providers/
      AuthProvider.tsx     # New: wraps dev or real auth
    components/
      workout/             # New: mobile workout flow
        ActiveWorkout.tsx
        SetLogger.tsx
        RestTimer.tsx
      ui/
        ColorSchemeToggle.tsx  # New: dark/light toggle
  public/
    sounds/
      timer-end.mp3        # New: rest timer notification sound
  DESIGN.md                # New: or in project root

DESIGN.md                  # Project root design system spec
```

### Anti-Patterns to Avoid
- **Partial Supabase removal:** Do NOT leave some endpoints using Supabase client and others using SQLAlchemy. Complete the migration for all files before removing the supabase dependency.
- **Mixing auth strategies:** Do NOT check `process.env.AUTH_MODE` in individual components. Use a single AuthProvider that wraps the entire app.
- **Storing offline data in localStorage:** localStorage has a 5-10MB limit and no querying. Use IndexedDB via Dexie for structured offline data.
- **Building custom service workers from scratch:** Use Serwist (Workbox wrapper for Next.js). Manual service worker code is error-prone.
- **Hardcoding dev user IDs:** Make dev user IDs configurable via environment variables so different team members can test as different users.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB offline storage | Raw IndexedDB API wrapper | Dexie.js | IndexedDB API is callback-hell; Dexie provides Promise-based API with React hooks |
| Service worker + caching | Manual service worker code | Serwist (@serwist/next) | Handles precaching, runtime caching, and Next.js integration automatically |
| Scheduled task execution | Custom setInterval in process | APScheduler | Handles cron expressions, missed job recovery, timezone awareness |
| CSS responsive breakpoints | Custom media query hooks | Mantine useMediaQuery + responsive style props | Already built into Mantine, SSR-aware |
| Design token management | Manual CSS variable files | DESIGN.md + @google/design.md CLI | Structured format, linting, export to Tailwind/DTCG |
| Color scheme persistence | Custom localStorage + useEffect | Mantine ColorSchemeScript + useMantineColorScheme | Prevents flash, persists automatically, SSR-safe |
| Component documentation | README files per component | Storybook | Interactive, visual, supports dark/light preview |

**Key insight:** The temptation will be to "just write a quick wrapper" for these concerns. Every one of them has edge cases (IndexedDB versioning, service worker lifecycle, timezone-aware cron, SSR hydration mismatch) that the standard libraries handle and custom code will miss.

## Common Pitfalls

### Pitfall 1: Supabase PostgREST Nested Select Translation
**What goes wrong:** Supabase PostgREST supports nested selects like `select("*, workout_exercises(*, exercises(name))")` which implicitly does JOINs. Translating these to raw SQL with multiple JOINs creates complex queries that are hard to maintain.
**Why it happens:** PostgREST embedding is a convenience feature with no direct SQL equivalent.
**How to avoid:** Use separate queries instead of JOINs. Fetch the parent records first, then batch-fetch related records using `WHERE id = ANY(:ids)`. This is actually how PostgREST works internally.
**Warning signs:** Single SQL queries with 3+ JOINs, N+1 query patterns in loops.

### Pitfall 2: Auth Object Shape Mismatch
**What goes wrong:** Code throughout the backend accesses `user.id`, `user.app_metadata`, `user.user_metadata` as attributes (Supabase User object). The replacement AuthUser dataclass must have the exact same attribute access pattern.
**Why it happens:** The Supabase User object uses attribute access, not dict access.
**How to avoid:** The AuthUser dataclass must use `@dataclass` with the same field names. Grep for all `user.id`, `user.email`, `user.app_metadata`, `user.user_metadata` access patterns and verify they work with the replacement.
**Warning signs:** `AttributeError: 'dict' object has no attribute 'id'` errors.

### Pitfall 3: UUID Generation Without auth.users
**What goes wrong:** In Supabase, `auth.users` generates UUIDs and the `athletes.user_id` FK references them. Without Supabase, there's no auth.users table.
**Why it happens:** The schema has FK constraints to `auth.users(id)`.
**How to avoid:** Remove FK constraints to auth.users in the local schema. Use `uuid_generate_v4()` for all PKs. Create a lightweight `public.users` table for seed data that the dev auth provider references.
**Warning signs:** FK violation errors on INSERT, missing uuid-ossp extension.

### Pitfall 4: Wake Lock Release on Tab Switch
**What goes wrong:** The browser automatically releases the wake lock when the user switches tabs. If the app doesn't re-acquire it, the screen will dim during a rest period when the athlete checks their phone.
**Why it happens:** Spec requires wake lock release when document becomes hidden.
**How to avoid:** Listen for `visibilitychange` event and re-request the wake lock when the document becomes visible again. The useWakeLock hook above handles this.
**Warning signs:** Screen dims during workouts after the athlete checks a text message.

### Pitfall 5: Offline Sync Conflicts
**What goes wrong:** If the athlete logs a workout offline and the coach generates a plan for the same day, syncing creates duplicate or conflicting data.
**Why it happens:** No conflict resolution strategy.
**How to avoid:** Queue offline workouts with timestamps. On sync, use upsert semantics. Display a "synced N workouts" notification after sync completes so the athlete knows what happened.
**Warning signs:** Duplicate workouts, missing training load calculations.

### Pitfall 6: Docker Init Scripts Run Every Start
**What goes wrong:** Files in `/docker-entrypoint-initdb.d/` only run on first database initialization (empty data directory). If the developer deletes the volume and recreates, they run again. But if the database already has data, they're skipped entirely.
**Why it happens:** PostgreSQL Docker image behavior by design.
**How to avoid:** Make init scripts idempotent with `CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`. Alternatively, use a separate migration/seed script that runs after the database is healthy.
**Warning signs:** "relation already exists" errors, or seed data not appearing after volume cleanup.

### Pitfall 7: SSR Hydration Mismatch with useMediaQuery
**What goes wrong:** `useMediaQuery` returns `false` during SSR and the correct value on the client. This causes a flash or hydration error.
**Why it happens:** `window.matchMedia` is not available during SSR.
**How to avoid:** For layout-critical responsive decisions, use Mantine's CSS-based responsive props (`w={{ base: 200, md: 400 }}`) instead of JS-based `useMediaQuery`. Reserve `useMediaQuery` for truly client-only components wrapped in `ClientOnly` or using `suppressHydrationWarning`.
**Warning signs:** React hydration mismatch warnings in console, layout flash on page load.

### Pitfall 8: Storybook Build Fails with Next.js App Router
**What goes wrong:** Storybook tries to resolve Next.js-specific imports (navigation, image) and fails.
**Why it happens:** Storybook needs mocks for Next.js internals.
**How to avoid:** Use `@storybook/nextjs` framework (not `@storybook/react`) which automatically mocks Next.js features.
**Warning signs:** "Module not found: next/navigation" errors in Storybook.

## Code Examples

### Supabase-to-Repository Migration (Single Endpoint)

**Before (current code):**
```python
# backend/app/api/endpoints/athletes.py
@router.get("/")
async def get_athletes(user=Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("athletes")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", True)
        .execute()
    )
    return result.data
```

**After (with repository):**
```python
# backend/app/api/endpoints/athletes.py
from app.db.repositories.athlete_repo import AthleteRepository

athlete_repo = AthleteRepository()

@router.get("/")
async def get_athletes(user=Depends(get_current_user)):
    athletes = athlete_repo.get_active_by_user_id(user.id)
    return athletes
```

### Mantine Mobile Responsive Layout

```tsx
// Source: Mantine v7 responsive docs
import { Box, Stack, Group, Title, Button, Text } from '@mantine/core';

function AthleteGymDashboard() {
  return (
    <Stack gap={{ base: 'sm', md: 'lg' }} p={{ base: 'sm', md: 'xl' }}>
      <Title order={2} fz={{ base: 'lg', md: 'xl' }}>
        Today's Training
      </Title>

      {/* Large touch target for gym use */}
      <Button
        size="xl"
        fullWidth
        h={{ base: 64, md: 48 }}
        fz={{ base: 'lg', md: 'md' }}
      >
        Start Workout
      </Button>

      {/* Hide detailed stats on mobile, show on desktop */}
      <Box visibleFrom="md">
        <DetailedPMCChart />
      </Box>
      <Box hiddenFrom="md">
        <CompactReadinessScore />
      </Box>
    </Stack>
  );
}
```

### Docker Init Script (Idempotent)

```sql
-- backend/sql/init/02-seed-users.sql
-- Create dev users for local development

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'athlete',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dev coach user
INSERT INTO public.users (id, email, role) VALUES
    ('00000000-0000-0000-0000-000000000001', 'coach@dev.local', 'coach')
ON CONFLICT (id) DO NOTHING;

-- Dev athlete user (Joshua Hudson)
INSERT INTO public.users (id, email, role) VALUES
    ('00000000-0000-0000-0000-000000000002', 'josh@dev.local', 'athlete')
ON CONFLICT (id) DO NOTHING;

-- Coaches table entry
INSERT INTO public.coaches (id, user_id, first_name, last_name, email) VALUES
    ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001',
     'Dev', 'Coach', 'coach@dev.local')
ON CONFLICT (id) DO NOTHING;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-pwa | Serwist (@serwist/next) | 2024 | next-pwa unmaintained, Serwist is active successor |
| Supabase client for backend DB | SQLAlchemy Core/ORM | N/A (project-specific) | Enables database-agnostic architecture |
| Manual JWT decode (python-jose) | Auth provider abstraction | N/A (project-specific) | Enables dev bypass and future provider swap |
| Storybook 7 | Storybook 10+ | 2025 | Mantine v7 guide only covers Storybook 10+ |
| Custom media queries | Mantine responsive style props | Mantine v7 (2023) | Object syntax `w={{ base: 200, md: 400 }}` replaces manual breakpoints |
| localStorage for offline | IndexedDB via Dexie.js | Established pattern | Structured data, no 5MB limit, queryable |

**Deprecated/outdated:**
- `next-pwa` (shadowwalker/next-pwa): Unmaintained since 2023. Use Serwist.
- `storybook-addon-mantine` may need v10 compatibility check (was built for Storybook 7/8).
- Supabase PostgREST query builder in backend: Being replaced entirely in this phase.
- Manual JWT decode via python-jose: Already replaced by Supabase auth.get_user(); now being replaced by auth provider abstraction.

## Open Questions

Things that could not be fully resolved:

1. **Supabase dependency removal from requirements.txt**
   - What we know: The `supabase==2.3.0` package is the only thing providing PostgREST queries. Once repositories replace all queries, it can be removed.
   - What's unclear: Whether any edge case (like the `.is_("ended_at", "null")` pattern) requires special SQL handling. Need to verify each query pattern during migration.
   - Recommendation: Build a migration checklist of every `get_supabase()` call and verify the SQL equivalent works. Keep supabase in requirements.txt until all endpoints are verified.

2. **Google Cloud Run deployment specifics**
   - What we know: Cloud Run supports Docker containers, the Dockerfiles already exist and work.
   - What's unclear: Whether to deploy frontend and backend as separate Cloud Run services or a single service. Database hosting (local Postgres won't work on Cloud Run; Neon is deferred).
   - Recommendation: Per CONTEXT.md, Neon deployment is deferred. Focus on `docker-compose up` working locally. Cloud Run deployment can be a follow-up when Neon is ready.

3. **Cyrus Gray knowledge graph integration depth**
   - What we know: graphify-out/ contains 1468 nodes and 1867 edges from the codebase knowledge graph.
   - What's unclear: How deeply to integrate training methodology into the exercise library seed data vs keeping it as reference material.
   - Recommendation: Extract key exercise progressions and training protocols from the knowledge graph and encode them in the seed data SQL. The graph itself is reference material, not runtime data.

4. **Coach notification for un-reviewed plans by Monday morning**
   - What we know: CONTEXT.md mentions coach notification if plans not reviewed. Push notifications are deferred.
   - What's unclear: What notification channel to use if push is deferred (email? in-app banner?).
   - Recommendation: Implement as an in-app banner/alert on the coach dashboard (computed on read, same pattern as existing alerts). Email/push deferred.

5. **Frontend Supabase direct database calls**
   - What we know: `frontend/src/lib/supabase.ts` has direct Supabase client calls (getAthleteProfile, createWorkout, etc.) that bypass the API.
   - What's unclear: Whether these are still used by any component, or if they've been fully replaced by the API layer (`lib/api.ts`).
   - Recommendation: Grep for imports of these functions. If unused, remove them. If used, route them through the API instead.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All backend endpoint files (athletes.py, training.py, plans.py, coach.py, exercises.py, wellbeing.py, performance.py, auth.py), all service files, session.py, security.py, config.py
- Codebase analysis: Frontend providers (SupabaseProvider.tsx), hooks (useAuth.ts, useAthlete.ts), lib (api.ts, supabase.ts), layout.tsx, theme.ts
- Codebase analysis: Docker files (docker-compose.yml, backend/Dockerfile, frontend/Dockerfile)
- Codebase analysis: SQL schemas (production_schema.sql, fresh_clean_schema.sql, weekly_plans_migration.sql, auth_roles_migration.sql)
- [MDN Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) - API usage, browser compatibility, security requirements
- [Mantine Responsive Styles](https://mantine.dev/styles/responsive/) - Responsive style props, breakpoints, hiddenFrom/visibleFrom
- [Mantine Color Schemes](https://mantine.dev/theming/color-schemes/) - Dark mode setup, useComputedColorScheme, ColorSchemeScript
- [Mantine Storybook Guide](https://mantine.dev/guides/storybook/) - Storybook 10+ integration with Mantine

### Secondary (MEDIUM confidence)
- [Sentry: Schedule tasks with FastAPI](https://sentry.io/answers/schedule-tasks-with-fastapi/) - APScheduler + FastAPI lifespan pattern, verified with official APScheduler docs
- [Serwist Getting Started](https://serwist.pages.dev/docs/next/getting-started) - Next.js PWA setup (successor to next-pwa)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock) - 88% browser support, Baseline 2025
- [Can I Use: Vibration API](https://caniuse.com/mdn-api_navigator_vibrate) - 77% support, no Safari/Firefox
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper, React hooks, offline patterns
- [Google Design.md spec](https://github.com/google-labs-code/design.md) - Open-source format specification

### Tertiary (LOW confidence)
- [Offline PWA with Dexie + Workbox](https://www.wellally.tech/blog/build-offline-pwa-react-dexie-workbox) - Community implementation pattern
- Background Sync API browser support claims (Chromium-only, Safari/Firefox absent) - based on WebSearch, not verified against official spec

## Metadata

**Confidence breakdown:**
- Database abstraction pattern: HIGH - based on direct codebase analysis of every Supabase call, SQLAlchemy already installed
- Auth bypass pattern: HIGH - based on direct analysis of security.py and auth flow
- Docker environment: HIGH - docker-compose.yml already exists, just needs adaptation
- Mobile UX (Wake Lock): HIGH - MDN official docs, Baseline 2025 designation
- Mobile UX (Vibration): MEDIUM - limited browser support (no Safari/Firefox), use as enhancement only
- Offline sync: MEDIUM - Dexie is well-established but Background Sync is Chromium-only
- Storybook + Mantine: MEDIUM - official guides exist but only for Storybook 10+, need to verify addon compatibility
- Design system (DESIGN.md): MEDIUM - spec is well-documented, but project-specific implementation depends on design decisions
- APScheduler: HIGH - well-documented FastAPI integration, simple cron job requirement
- Cloud Run deployment: LOW - deferred per CONTEXT.md, Neon not yet available

**Supabase coupling analysis:**
- Backend endpoint files with `get_supabase()` calls: 8 files (athletes, training, plans, coach, exercises, wellbeing, performance, auth)
- Backend service files with `get_supabase()` calls: 8 files (all services)
- Frontend files with Supabase imports: 4 files (SupabaseProvider, useAuth, api.ts, supabase.ts)
- Estimated total Supabase PostgREST query patterns to replace: ~90+

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable domain, libraries well-established)
