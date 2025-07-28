# Bobsleigh Coach AI

An AI-powered training application for bobsleigh athletes with personalized recommendations and performance tracking. Currently optimized for elite bobsleigh athlete Joshua Hudson with plans to expand to other sports.

## Overview

This application uses advanced machine learning techniques to analyze athlete performance data and provide personalized training recommendations, performance tracking, and coaching insights. The system focuses on Performance Management Chart (PMC) modeling and training load optimization for peak athletic performance.

## Current Status

✅ **Production Database**: Fresh clean schema with Joshua Hudson's training data  
✅ **Training Data**: 21 days of PMC data, performance metrics, and wellbeing assessments  
✅ **Core Exercises**: 10 bobsleigh-specific exercises with proper categorization  
✅ **MVP ML Pipeline**: Basic PMC models trained on initial dataset  
🔄 **Phase 2 - Real Coaching Integration**: Awaiting training images to extract authentic methodology  
🔄 **Enhanced ML Training**: Will retrain models on months of realistic training data  
🔄 **Frontend**: Needs update to connect to new schema  
🔄 **API**: Endpoints need to be built for new data structure  

## Features

- **Performance Management Charts (PMC)** - Track Chronic Training Load (CTL), Acute Training Load (ATL), and Training Stress Balance (TSB)
- **AI-Generated Training Recommendations** - Personalized workout plans based on current training status
- **Workout Logging and Tracking** - Detailed exercise data with planned vs actual performance
- **Performance Metrics Analysis** - Monitor progress with baseline testing and PRs
- **Athlete Wellbeing Tracking** - Comprehensive health monitoring including sleep, stress, mood
- **Recovery Management** - Optimize training adaptation and prevent overtraining
- **Multi-Sport Architecture** - Built to scale beyond bobsleigh

## Tech Stack

### Frontend
- **Next.js 14** with React 19 and TypeScript
- **Mantine UI v7** for component library
- **React Query** for server state management
- **Recharts** for data visualization
- **Supabase Auth** with Google OAuth

### Backend
- **FastAPI** with Python 3.11
- **SQLAlchemy** ORM
- **PostgreSQL** via Supabase
- **JWT** authentication

### Database
- **Supabase** (PostgreSQL) with Row Level Security
- **Fresh clean schema** optimized for ML training
- **Joshua Hudson's real training data** (21 days PMC + performance metrics)

### AI/ML
- **PyTorch** for custom model development
- **scikit-learn** for traditional ML models
- **PMC Model** for training load analysis
- **Training Recommendation Engine**

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account

### Database Setup (IMPORTANT - Run This First)

1. **Create Supabase Project** at https://supabase.com

2. **Reset Database** (if you have existing data):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

3. **Apply Fresh Schema**:
   Run `backend/sql/fresh_clean_schema.sql` in Supabase SQL Editor

4. **Fix Numeric Fields**:
   Run `backend/sql/fix_numeric_fields.sql` in Supabase SQL Editor

5. **Insert Joshua's Data**:
   Run `backend/sql/insert_joshua_data.sql` in Supabase SQL Editor

### Environment Setup

1. **Clone Repository**:
   ```bash
   git clone https://github.com/kopacz77/bobsleigh-coach-ai.git
   cd bobsleigh-coach-ai
   ```

2. **Environment Variables**:
   Create `.env` in root directory:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Install Dependencies**:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd ../backend && pip install -r requirements.txt
   
   # ML
   cd ../ml && pip install -r requirements.txt
   ```

### Development

**Frontend** (Port 3000):
```bash
cd frontend
npm run dev
```

**Backend** (Port 8000):
```bash
cd backend
uvicorn app.main:app --reload
```

**API Documentation**: http://localhost:8000/docs

## Database Schema

The application uses a multi-sport schema optimized for Joshua Hudson's training data:

### Core Tables
- **`athletes`** - Athlete profiles and characteristics
- **`sports`** - Sport definitions (currently: Bobsleigh)
- **`exercises`** - Exercise library (10 core bobsleigh exercises)

### Training Data
- **`workouts`** - Training sessions with load and RPE
- **`workout_exercises`** - Detailed exercise performance within workouts
- **`performance_metrics`** - Test results and personal bests
- **`training_loads`** - Daily PMC data (CTL, ATL, TSB)
- **`wellbeing_assessments`** - Daily wellness metrics

### ML/AI Data
- **`training_recommendations`** - AI-generated workout suggestions

## Joshua Hudson's Training Data

The database contains real training data from European Championship bobsleigh athlete Joshua Hudson:

### Performance Benchmarks
- **30m Sprint**: 3.95 seconds
- **Power Clean 1RM**: 140kg
- **Front Squat 1RM**: 180kg
- **Back Squat 1RM**: 220kg
- **Broad Jump**: 3.15 meters
- **Triple Broad Jump**: 8.45 meters

### Training Load Data
- **21 days** of PMC training load data
- **CTL, ATL, TSB** calculations for Performance Management
- **RPE, sleep, stress** subjective metrics
- **Readiness scores** for training optimization

## Machine Learning

### PMC Model Training

The system is ready for PMC model training with Joshua's real data:

```bash
cd ml
python -m ml.training.train_pmc_model
```

### Model Architecture
- **Input**: Daily training load, subjective metrics, performance data
- **Output**: CTL, ATL, TSB predictions and training recommendations
- **Framework**: PyTorch with scikit-learn preprocessing

## Next Steps - Phase 2: Real Coaching Integration

### **Immediate Priority**
1. **Training Images Analysis** - Extract coaching methodology from Joshua's comprehensive training template
2. **Generative Model Development** - Build system that creates months of realistic training data based on real periodization
3. **Enhanced ML Training** - Retrain models on comprehensive dataset (100+ days vs current 21 days)
4. **Methodology Validation** - Ensure generated training reflects authentic coaching principles

### **Following Phases**
5. **Update Frontend** - Connect React components to enhanced ML system
6. **Build API Endpoints** - Create FastAPI routes for advanced training recommendations  
7. **Authentication Integration** - Connect Supabase auth to user management
8. **Scale to More Athletes** - Expand beyond Joshua using proven methodology

## Project Structure

```
bobsleigh-coach-ai/
├── frontend/           # Next.js React application
├── backend/           # FastAPI Python backend
│   └── sql/          # Database schema and data
├── ml/               # Machine learning models
├── docs/             # Documentation
└── logo/             # Brand assets
```

## Contributing

This project is currently optimized for Joshua Hudson's training data as a proof of concept. The architecture supports multi-athlete, multi-sport expansion.

## License

MIT License