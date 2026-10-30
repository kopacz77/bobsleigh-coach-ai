# Coding Conventions

**Analysis Date:** 2026-05-02

## Naming Patterns

**Files (Frontend):**
- Components: PascalCase `.tsx` files, one component per file (e.g., `TrainingRecommendations.tsx`, `ErrorBoundary.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`, `useTraining.ts`, `usePerformance.ts`)
- Lib/utils: camelCase `.ts` files (e.g., `api.ts`, `supabase.ts`)
- Providers: PascalCase with `Provider` suffix (e.g., `ReactQueryProvider.tsx`, `SupabaseProvider.tsx`)
- Barrel files: `index.tsx` or `index.ts` in component directories for re-exports
- Pages: `page.tsx` following Next.js App Router convention
- Theme/config: camelCase (e.g., `theme.ts`)

**Files (Backend):**
- All Python files use snake_case (e.g., `pmc_service.py`, `training_service.py`, `performance_service.py`)
- Test files: `test_` prefix (e.g., `test_pmc_service.py`, `test_performance_api.py`)
- Database models: singular noun in snake_case (e.g., `athlete.py`, `workout.py`, `performance.py`, `user.py`)
- Schemas: match their model counterpart name (e.g., `athlete.py`, `training.py`, `token.py`)

**Functions (Frontend):**
- React components: PascalCase named exports (e.g., `export function TrainingRecommendations()`)
- Hooks: camelCase with `use` prefix (e.g., `useWorkouts`, `usePerformanceMetrics`, `useCreateWorkout`)
- Utility functions: camelCase (e.g., `signInWithGoogle`, `getCurrentUser`, `getAthleteProfile`)
- Event handlers in components: camelCase with `handle` prefix (e.g., `handleReset`, `handleReload`)
- Helper functions inside components: camelCase (e.g., `getBadgeColor`, `formatDate`)

**Functions (Backend):**
- Endpoint handlers: snake_case async functions (e.g., `get_athletes`, `create_workout`, `get_performance_metrics`)
- Service methods: snake_case async methods (e.g., `calculate_pmc_for_athlete`, `get_training_recommendations`)
- Private helpers: underscore prefix (e.g., `_generate_exercises_for_workout`, `_has_coach_permission`, `_get_athlete_data`)
- Utility functions: snake_case (e.g., `verify_password`, `get_password_hash`, `create_access_token`)

**Variables (Frontend):**
- State variables: camelCase (e.g., `isLoading`, `chartData`, `hasMounted`)
- Constants: camelCase for module-level (e.g., `const API_URL`, `const supabaseUrl`)
- Query keys: string arrays with descriptive segments (e.g., `["workouts", athleteId, limit]`, `["performance", "metrics", athleteId]`)

**Variables (Backend):**
- Instance variables: snake_case (e.g., `self.ctl_days`, `self.atl_decay`, `self.pmc_service`)
- Constants: UPPER_SNAKE_CASE in config (e.g., `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`)
- Local variables: snake_case (e.g., `current_ctl`, `mock_loads`, `workout_schedule`)

**Types/Interfaces (Frontend):**
- PascalCase with descriptive suffix (e.g., `AuthGuardProps`, `WorkoutFormValues`, `ExerciseRecommendation`)
- Props interfaces: `{ComponentName}Props` pattern (e.g., `AppShellProps`, `PerformanceChartProps`, `SmartLoadingWrapperProps`)
- Data types: PascalCase noun (e.g., `WorkoutRecommendation`, `UserProfile`)

**Types/Classes (Backend):**
- Pydantic schemas: PascalCase with purpose suffix (e.g., `AthleteCreate`, `AthleteUpdate`, `WorkoutExerciseBase`)
- Use Base/Create/Update pattern for CRUD schemas (e.g., `AthleteBase` -> `AthleteCreate` -> `Athlete`)
- SQLAlchemy models: PascalCase singular noun (e.g., `Athlete`, `Workout`, `WorkoutExercise`, `PerformanceMetric`)
- Service classes: PascalCase with `Service` suffix (e.g., `PMCService`, `TrainingService`, `PerformanceService`)

## Code Style

**Formatting (Frontend - Biome):**
- Formatter: Biome v2.0.6 (config: `biome.json` at project root)
- Indent: 2 spaces
- Line width: 100 characters
- Line ending: LF
- Semicolons: always
- Quote style: double quotes
- JSX quote style: double quotes
- Trailing commas: ES5
- Arrow parentheses: always
- Bracket spacing: true
- Bracket same line: false

**Formatting (Backend):**
- No dedicated formatter configured (no black/ruff config found)
- CI uses flake8 with max-line-length=127 and max-complexity=10
- Indent: 4 spaces (Python standard)
- Follow PEP 8 by convention

**Linting (Frontend - Biome):**
- Linter enabled with recommended rules
- `noNonNullAssertion`: off (non-null assertions allowed)
- `noExplicitAny`: warn (avoid `any` types, but not enforced as error)
- `noParameterAssign`: error
- `useDefaultParameterLast`: error
- `useSelfClosingElements`: error
- `noInferrableTypes`: error (don't annotate types that can be inferred)
- `noExcessiveCognitiveComplexity`: warn
- `noStaticOnlyClass`: off
- Import organization: automatic via Biome `organizeImports: "on"`

**Linting (Backend):**
- CI runs flake8 with basic error detection (E9, F63, F7, F82)
- No local flake8/ruff/pylint config files

**Run lint commands:**
```bash
# Frontend (from project root or frontend/)
pnpm run lint          # biome check .
pnpm run lint:fix      # biome check . --write
pnpm run format        # biome format . --write

# Backend (manual)
flake8 . --max-complexity=10 --max-line-length=127
```

## Import Organization

**Frontend import order (enforced by Biome):**
1. CSS imports (`import "@mantine/core/styles.css"`)
2. Third-party libraries (`@mantine/core`, `@tanstack/react-query`, `react`, `next`)
3. Internal aliases using `@/` prefix (`@/components/...`, `@/lib/...`, `@/providers/...`)

**Example from `frontend/src/app/layout.tsx`:**
```typescript
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import { theme } from "@/styles/theme";
```

**Path Aliases (Frontend):**
- `@/*` maps to `./src/*` (configured in `frontend/tsconfig.json`)
- Use `@/components/...`, `@/hooks/...`, `@/lib/...`, `@/providers/...`, `@/styles/...`, `@/utils/...`

**Backend import order (by convention):**
1. Standard library (`datetime`, `typing`)
2. Third-party packages (`fastapi`, `sqlalchemy`, `pydantic`, `numpy`)
3. Internal modules (`app.core.config`, `app.services.pmc_service`, `app.schemas.athlete`)

**Example from `backend/app/api/endpoints/training.py`:**
```python
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.training import Workout, WorkoutCreate, WorkoutExercise
from app.services.training_service import TrainingService
```

## Error Handling

**Frontend patterns:**
- Use `try/catch` with `console.error` for async operations (see `frontend/src/hooks/useAuth.ts`, `frontend/src/components/auth/AuthGuard.tsx`)
- React `ErrorBoundary` class component wraps UI at the layout level (`frontend/src/components/common/ErrorBoundary.tsx`)
- `withErrorBoundary` HOC available for wrapping individual components
- Supabase operations return `{ data, error }` tuples - check `error` before proceeding (see `frontend/src/lib/supabase.ts`)
- Throw errors from hooks for the caller to handle: `if (error) throw error;` (see `useAuth` login/logout)

```typescript
// Pattern: Supabase data access
const { data, error } = await supabase.from("athletes").select("*").eq("user_id", userId).single();
return { data, error };

// Pattern: Auth error propagation
const login = async () => {
  const { error } = await signInWithGoogle();
  if (error) throw error;
};
```

**Backend patterns:**
- Raise `HTTPException` with appropriate status codes for API errors (see `backend/app/api/endpoints/athletes.py`)
- Use `status.HTTP_401_UNAUTHORIZED` constants from FastAPI (see `backend/app/api/endpoints/auth.py`)
- Catch-all `try/except Exception` blocks in complex endpoints with `print()` logging and 500 response (see `backend/app/api/endpoints/generate_weekly_plan.py`)
- No structured error response schema defined

```python
# Pattern: Not found
if athlete_id != 1:
    raise HTTPException(status_code=404, detail="Athlete not found")

# Pattern: Unauthorized
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"},
)

# Pattern: Catch-all (used in generate_weekly_plan.py)
except Exception as e:
    print(f"Error generating weekly plan: {str(e)}")
    raise HTTPException(status_code=500, detail=f"Failed to generate weekly plan: {str(e)}")
```

## Logging

**Frontend:** `console.error` for error logging. No structured logging framework.
- Pattern: `console.error("Error getting current user:", error);`
- Pattern: `console.error("Supabase credentials not found");`
- Pattern: `console.error("Auth check failed:", error);`

**Backend:** `print()` statements for error logging. No structured logging framework.
- Pattern: `print(f"Error generating weekly plan: {str(e)}")`
- No Python `logging` module usage detected

## Comments

**When to comment:**
- Module/file-level docstrings in Python files (`"""Performance Management Chart (PMC) service."""`)
- Class docstrings describing purpose (`"""Service for Performance Management Chart calculations."""`)
- Method docstrings with Args/Returns in Google style (see `backend/app/services/pmc_service.py`)
- Inline comments for domain logic (e.g., `# Sunday is always rest`, `# Calculate decay constants`)
- "In a real implementation" / "Placeholder" comments to mark mock/stub code
- Single-line JSDoc comments for TypeScript interfaces occasionally (`/** WellbeingAssessment props interface */`)

**Python docstring pattern (Google style):**
```python
async def calculate_pmc_for_athlete(
    self, athlete_id: int, days: int = 90
) -> Dict[str, List]:
    """Calculate PMC metrics for an athlete.

    Args:
        athlete_id: ID of the athlete
        days: Number of days of history to include

    Returns:
        Dictionary with dates, loads, CTL, ATL, and TSB values
    """
```

**Frontend comment pattern:**
```typescript
// Export all training-related components
// In a real app, you would fetch this data from your API
```

## Function Design

**Frontend components:**
- Prefer function declarations: `export function ComponentName()`
- Accept props via a typed interface
- Use `"use client"` directive at top of files using hooks, state, or browser APIs
- Keep data fetching in custom hooks, not in components directly
- Components use Mantine UI components exclusively for layout/styling

**Frontend hooks:**
- One concern per hook file, but multiple related hooks per file (e.g., `useWorkouts`, `useWorkout`, `useCreateWorkout` all in `frontend/src/hooks/useTraining.ts`)
- Wrap React Query `useQuery`/`useMutation` with typed wrappers
- Always specify `queryKey` as descriptive array and `staleTime`
- Return React Query result directly (no extra wrapping)

```typescript
export function useWorkouts(athleteId: number, limit = 10) {
  return useQuery({
    queryKey: ["workouts", athleteId, limit],
    queryFn: () => trainingAPI.getWorkouts(athleteId, limit).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
}
```

**Backend services:**
- Class-based with `__init__` for dependency setup
- All methods are `async`
- Return `Dict` or `List[Dict]` (no structured response models for service returns)
- Services instantiate their dependencies in `__init__` (e.g., `self.pmc_service = PMCService()`)

**Backend endpoints:**
- Async handler functions
- Instantiate services inline per-request (e.g., `performance_service = PerformanceService()`)
- Use FastAPI `Query(...)` for required query parameters, `Query(default)` for optional

## Module Design

**Exports (Frontend):**
- Named exports preferred over default exports: `export function ComponentName()`
- Some components use both: `export function AppShell()` + `export default AppShell`
- Barrel `index.tsx`/`index.ts` files re-export from subdirectories
- Mixed export styles in barrels: `export { TrainingAnalytics }` and `export { default as CoachDashboard }`

**Barrel file pattern from `frontend/src/components/training/index.tsx`:**
```typescript
export { TrainingAnalytics } from "./TrainingAnalytics";
export { default as TrainingAssessment } from "./TrainingAssessment";
export { TrainingHeader } from "./TrainingHeader";
export { TrainingRecommendations } from "./TrainingRecommendations";
```

**Exports (Backend):**
- Module-level singleton pattern for settings: `settings = Settings()` in `backend/app/core/config.py`
- Router pattern: each endpoint file exports `router = APIRouter()`
- Model `__init__.py` imports all models to register with SQLAlchemy (`backend/app/db/models/__init__.py`)
- Services are plain classes, not singletons

**Pydantic Schema pattern (Backend):**
- Base -> Create -> Full inheritance chain
- `from_attributes = True` in `Config` for ORM compatibility
- Optional fields use `Optional[T] = None`

```python
class AthleteBase(BaseModel):     # Shared fields
class AthleteCreate(AthleteBase): # For POST body
class AthleteUpdate(BaseModel):   # Partial fields, all Optional
class Athlete(AthleteBase):       # Full model with id, Config: from_attributes
```

## API Client Pattern (Frontend)

- Axios instance with base URL from env var (`frontend/src/lib/api.ts`)
- API methods organized by domain as object literals: `authAPI`, `athleteAPI`, `trainingAPI`, `performanceAPI`
- Request interceptor adds Bearer token from localStorage
- Duplicate API client exists at `frontend/src/utils/api.ts` (without token interceptor - older version)

```typescript
export const trainingAPI = {
  getWorkouts: (athleteId: number, limit = 10) =>
    api.get(`/api/training/workouts?athlete_id=${athleteId}&limit=${limit}`),
  getRecommendations: (athleteId: number) =>
    api.get(`/api/training/recommendations?athlete_id=${athleteId}`),
};
```

## Provider/Context Pattern (Frontend)

- Provider hierarchy in `frontend/src/app/layout.tsx`:
  1. `ReactQueryProvider` (outermost)
  2. `SupabaseProvider`
  3. `MantineProvider` with custom theme
  4. `Notifications`
  5. `AuthGuard`
- Providers use `"use client"` directive
- Context created with `createContext` + `useContext` hook export pattern (see `frontend/src/providers/SupabaseProvider.tsx`)

## TypeScript Configuration

- Strict mode enabled (`frontend/tsconfig.json`)
- Target: ES5
- Module: ESNext with Node resolution
- JSX: preserve (handled by Next.js)
- Path alias: `@/*` -> `./src/*`
- `skipLibCheck: true`
- `noEmit: true` (Next.js handles compilation)
- Type checking command: `pnpm run type-check` (runs `tsc --noEmit`)

---

*Convention analysis: 2026-05-02*
