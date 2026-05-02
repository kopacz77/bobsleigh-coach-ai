# Technology Stack

**Analysis Date:** 2026-05-02

## Languages

**Primary:**
- TypeScript 5.4.5 - Frontend (`frontend/src/`), strict mode enabled via `frontend/tsconfig.json`
- Python 3.11 - Backend (`backend/`), ML pipeline (`ml/`)

**Secondary:**
- SQL - Database schema definitions (`backend/sql/*.sql`)
- Bash - Deployment and utility scripts (`scripts/deploy.sh`)

## Runtime

**Environment:**
- Node.js >= 18.0.0 (Docker uses `node:20-alpine`) - Frontend runtime
- Python 3.11 - Backend and ML runtime
- PostgreSQL 16 (Alpine) - Database via Docker

**Package Manager:**
- pnpm 9.0.0 - Frontend/monorepo (declared in `package.json` `packageManager` field)
- pip - Python dependencies (`backend/requirements.txt`, `ml/requirements.txt`)
- Lockfile: `pnpm-lock.yaml` expected for frontend

## Frameworks

**Core:**
- Next.js 15.2.0 - Frontend framework, App Router (`frontend/src/app/`), config at `frontend/next.config.js`
- React 19.0.0 - UI library
- FastAPI 0.110.0 - Backend REST API framework (`backend/app/main.py`)
- Mantine UI 7.15.0 - Component library (`@mantine/core`, `@mantine/dates`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`)

**Testing:**
- pytest 7.4.4 - Backend unit tests (`backend/tests/`)
- httpx 0.26.0 - Async HTTP test client for FastAPI
- No frontend test framework configured (Jest/Vitest absent from `frontend/package.json`)

**Build/Dev:**
- Biome 1.5.3 (frontend) / 1.8.3 (root) - Linting and formatting, config at `biome.json`
- PostCSS with `postcss-preset-mantine` - CSS processing (`frontend/postcss.config.js`)
- Docker + Docker Compose 3.8 - Full-stack containerization (`docker-compose.yml`)
- uvicorn 0.27.0 - ASGI server for FastAPI

## Key Dependencies

**Critical (Frontend):**
- `@supabase/supabase-js` 2.49.1 - Supabase client for auth and direct DB access (`frontend/src/lib/supabase.ts`)
- `@supabase/auth-helpers-react` 0.5.0 - React auth integration
- `@tanstack/react-query` 5.17.19 - Server state management (`frontend/src/providers/ReactQueryProvider.tsx`)
- `axios` 1.6.5 - HTTP client for backend API calls (`frontend/src/lib/api.ts`, `frontend/src/utils/api.ts`)
- `zod` 3.22.4 - Schema validation
- `recharts` 2.12.0 - Charting library for performance visualization
- `chart.js` 4.4.1 + `react-chartjs-2` 5.2.0 - Additional charting (two charting libraries present)
- `dayjs` 1.11.10 - Date manipulation
- `@tabler/icons-react` 2.47.0 - Icon library

**Critical (Backend):**
- `sqlalchemy` 2.0.25 - ORM for database models (`backend/app/db/`)
- `psycopg2-binary` 2.9.9 - PostgreSQL driver
- `supabase` 2.3.0 - Supabase Python client for direct DB queries
- `pydantic` 2.5.3 + `pydantic-settings` 2.1.0 - Data validation and settings (`backend/app/core/config.py`)
- `python-jose` 3.3.0 - JWT token handling (`backend/app/core/security.py`)
- `passlib` 1.7.4 + `bcrypt` 4.1.2 - Password hashing

**Critical (ML):**
- `torch` 2.1.2 + `pytorch-lightning` 2.1.3 - Deep learning framework
- `scikit-learn` 1.4.0 - Traditional ML (gradient boosting for injury risk: `ml/models/injury_risk_model.py`)
- `transformers` 4.36.2 - Hugging Face transformers (imported but usage unclear)
- `lightgbm` 4.1.0 + `xgboost` 2.0.2 - Gradient boosting implementations
- `numpy` 1.26.3 + `pandas` 2.1.4 - Data processing
- `shap` 0.43.0 - Model interpretability

**Infrastructure:**
- `matplotlib` 3.8.2 + `seaborn` 0.13.1 + `plotly` 5.18.0 - ML visualization
- `jupyterlab` 4.0.9 - Notebook environment for ML exploration (`ml/notebooks/`)
- `joblib` (via scikit-learn) - Model serialization (`ml/models/injury_risk_model.py`)

## Configuration

**Environment:**
- `.env` file at project root, loaded by `pydantic-settings` (backend) and Next.js (frontend)
- `.env.example` documents all required variables
- Key env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
- Frontend env vars prefixed with `NEXT_PUBLIC_` for client-side exposure

**Build:**
- `frontend/next.config.js` - Next.js config (reactStrictMode, env vars)
- `frontend/tsconfig.json` - TypeScript config (strict mode, `@/*` path alias to `./src/*`)
- `biome.json` - Linting/formatting (spaces, 2-width indent, LF line endings, 100-char line width, double quotes, semicolons)
- `frontend/postcss.config.js` - PostCSS with Mantine preset and breakpoint variables
- `pnpm-workspace.yaml` - Monorepo workspaces: `frontend`, `packages/*`, `tools/*`
- `.npmrc` - pnpm config (no auto-install-peers, no shamefully-hoist)

**TypeScript:**
- Target: ES5
- Module: ESNext with Node resolution
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- JSX: preserve (Next.js handles transpilation)

## Platform Requirements

**Development:**
- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Python 3.11
- Docker + Docker Compose (for full-stack local dev)
- PostgreSQL 16 (via Docker or Supabase)

**Production:**
- Target: Google Cloud Run (configured in `scripts/deploy.sh`)
- Container images: `node:20-alpine` (frontend), Python image (backend)
- Google Container Registry for image storage
- Supabase for managed PostgreSQL and authentication

---

*Stack analysis: 2026-05-02*
