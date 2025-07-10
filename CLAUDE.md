# Bobsleigh Coach AI - Project Guide for Claude

## Project Overview
This is an AI-powered training application for bobsleigh athletes (with plans to expand to other sports) that provides personalized training recommendations, performance tracking, and coaching insights using machine learning.

## Core Features
- **Performance Management Charts (PMC)** - Track fitness, fatigue, and form
- **AI-Generated Training Recommendations** - Personalized workout plans
- **Workout Logging & Tracking** - Detailed exercise data
- **Performance Analysis** - Monitor progress and trends
- **Wellbeing Tracking** - Holistic health monitoring including mood, sleep, stress
- **Recovery Management** - Optimize training adaptation
- **Injury Risk Prediction** - ML-based injury prevention

## Architecture

### Frontend (`/frontend`)
- **Framework**: Next.js 14 with React 19 and TypeScript
- **UI Library**: Mantine UI v7
- **State Management**: React Query for server state, React hooks for client state
- **Authentication**: Supabase Auth with Google OAuth
- **Development**: `npm run dev` (port 3000)
- **Build**: `npm run build`
- **Lint**: `npm run lint`

### Backend (`/backend`)
- **Framework**: FastAPI with Python 3.11
- **Database**: PostgreSQL via Supabase
- **ORM**: SQLAlchemy
- **Authentication**: JWT tokens via Supabase
- **Development**: `uvicorn app.main:app --reload` (port 8000)
- **API Docs**: http://localhost:8000/docs

### Machine Learning (`/ml`)
- **Framework**: PyTorch for custom models
- **Libraries**: scikit-learn, pandas, numpy
- **Models**: 
  - PMC Model (Performance Management Chart)
  - Injury Risk Prediction Model
  - Training Recommendation Engine
- **Training**: `python -m ml.training.train_pmc_model`

## Key Development Commands

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Linting
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # Development server
pytest                         # Run tests
```

### Machine Learning
```bash
cd ml
pip install -r requirements.txt
python -m ml.training.train_pmc_model
jupyter lab          # For notebooks
```

### Full Stack
```bash
docker-compose up    # Start all services
```

## Project Structure

```
bobsleigh-coach-ai/
├── frontend/           # Next.js React app
│   ├── src/
│   │   ├── app/       # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utilities and API clients
│   │   └── providers/ # React context providers
│   └── package.json
├── backend/            # FastAPI Python app
│   ├── app/
│   │   ├── api/       # API endpoints
│   │   ├── core/      # Configuration and security
│   │   ├── db/        # Database models and session
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
│   └── requirements.txt
├── ml/                 # Machine learning components
│   ├── data/          # Data processing
│   ├── models/        # ML model definitions
│   ├── notebooks/     # Jupyter notebooks
│   └── training/      # Model training scripts
├── docs/              # Documentation
└── docker-compose.yml
```

## Key Components

### Authentication
- Uses Supabase Auth with Google OAuth
- JWT tokens for API authentication
- Row-Level Security in database

### Database Schema
- **Athletes**: User profiles and characteristics
- **Workouts**: Training session data
- **Performance**: Test results and metrics
- **Wellbeing**: Daily wellness assessments
- **Users**: Authentication and user management

### ML Models
- **PMC Model**: Calculates Chronic Training Load (CTL), Acute Training Load (ATL), and Training Stress Balance (TSB)
- **Injury Risk Model**: Gradient boosting classifier for injury prediction
- **Recommendation Engine**: Generates personalized training plans

## Development Workflow
1. **Local Development**: Use Docker Compose for full-stack environment
2. **Testing**: Unit tests with pytest (backend), Jest (frontend)
3. **Code Quality**: ESLint, TypeScript, Prettier
4. **Database**: Supabase with local development setup

## Environment Setup
Create `.env` file in root:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## Common Tasks
- **Add new API endpoint**: Create in `backend/app/api/endpoints/`
- **Add new React component**: Create in `frontend/src/components/`
- **Update database schema**: Modify SQL in `backend/sql/supabase_schema.sql`
- **Train ML models**: Use scripts in `ml/training/`

## Testing
- **Backend**: `pytest` from backend directory
- **Frontend**: `npm test` from frontend directory
- **API**: Use `/docs` endpoint for interactive testing

## Deployment
- **Platform**: Google Cloud Run with Docker containers
- **CI/CD**: GitHub Actions (configured in `.github/workflows/`)
- **Database**: Supabase (PostgreSQL)

## Notes for Claude
- This is a defensive security-focused sports training application
- The ML models are for performance optimization and injury prevention
- Always run linting and type checking before completing tasks
- Follow existing code patterns and conventions
- The project uses TypeScript extensively - maintain type safety