# Bobsleigh Coach AI - Complete Setup Guide

## 🎯 Overview

This guide will set up the complete Bobsleigh Coach AI system with Joshua Hudson's real training data for ML model development.

## 📋 Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+** and pip
- **Supabase Account** (free tier works)
- **Git** for cloning the repository

## 🚀 Step-by-Step Setup

### 1. Clone Repository

```bash
git clone https://github.com/kopacz77/bobsleigh-coach-ai.git
cd bobsleigh-coach-ai
```

### 2. Database Setup (Supabase)

#### 2.1 Create Supabase Project
1. Go to https://supabase.com and sign up/login
2. Create new project: `bobsleigh-coach-ai`
3. Choose a secure database password
4. Select region closest to you
5. Wait for project initialization (~2 minutes)

#### 2.2 Get API Credentials
1. Go to **Project Settings** → **API**
2. Copy the **Project URL** and **anon public key**
3. Save these for step 3

#### 2.3 Set Up Database Schema

**IMPORTANT: Run these SQL scripts in exact order in Supabase SQL Editor**

1. **Reset Database** (if you have existing data):
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

2. **Create Fresh Schema**:
   - Copy contents of `backend/sql/fresh_clean_schema.sql`
   - Paste in Supabase SQL Editor and run
   - ✅ Should see: "Fresh clean schema created successfully!"

3. **Fix Numeric Field Precision**:
   - Copy contents of `backend/sql/fix_numeric_fields.sql`  
   - Paste in Supabase SQL Editor and run
   - ✅ Should see: "Numeric field precision fixed!"

4. **Insert Joshua's Training Data**:
   - Copy contents of `backend/sql/insert_joshua_data.sql`
   - Paste in Supabase SQL Editor and run
   - ✅ Should see verification summary with record counts

#### 2.4 Verify Database Setup

In Supabase **Table Editor**, you should see:
- ✅ 9 tables created (athletes, sports, exercises, etc.)
- ✅ 1 athlete: Joshua Hudson
- ✅ 10 exercises (Power Clean, Front Squat, 30m Sprint, etc.)
- ✅ 8 performance metrics
- ✅ 21 days of training load data
- ✅ 21 days of wellbeing assessments

### 3. Environment Configuration

Create `.env` file in project root:

```env
# Supabase Configuration
SUPABASE_URL=your_project_url_from_step_2.2
SUPABASE_ANON_KEY=your_anon_key_from_step_2.2

# Optional: Additional configuration
NODE_ENV=development
```

### 4. Install Dependencies

#### 4.1 Frontend (Next.js)
```bash
cd frontend
npm install
cd ..
```

#### 4.2 Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
cd ..
```

#### 4.3 Machine Learning
```bash
cd ml
pip install -r requirements.txt
cd ..
```

### 5. Start Development Servers

#### 5.1 Frontend (Terminal 1)
```bash
cd frontend
npm run dev
```
- ✅ Frontend running at: http://localhost:3000

#### 5.2 Backend (Terminal 2)
```bash
cd backend
uvicorn app.main:app --reload
```
- ✅ API running at: http://localhost:8000
- ✅ API docs at: http://localhost:8000/docs

### 6. Verify Installation

#### 6.1 Database Connection
```bash
# Test Supabase connection
cd backend
python -c "from app.database import get_supabase_client; print('✅ Database connected')"
```

#### 6.2 Frontend Access
- Visit http://localhost:3000
- Should see Bobsleigh Coach AI interface
- Check browser console for any errors

#### 6.3 API Access
- Visit http://localhost:8000/docs
- Should see FastAPI interactive documentation
- Test an endpoint (e.g., `/health`)

## 🧠 ML Model Training

With Joshua's data loaded, you can now train the PMC model:

```bash
cd ml
python -m ml.training.train_pmc_model
```

This will:
- Load Joshua's 21 days of training data
- Train the Performance Management Chart model
- Generate CTL, ATL, TSB predictions
- Save model for inference

## 📊 What You Now Have

### Real Athlete Data
- **Joshua Hudson**: European Championship bobsleigh athlete
- **Performance benchmarks**: 30m sprint (3.95s), Power Clean (140kg), etc.
- **Training history**: 21 days of detailed PMC data
- **Wellbeing tracking**: Sleep, stress, readiness scores

### Technical Stack
- **Database**: Production-ready schema with real data
- **Frontend**: Next.js app with Mantine UI
- **Backend**: FastAPI with Supabase integration
- **ML Pipeline**: Ready for model training and inference

### Ready for Development
- ✅ **ML Training**: Real data for model development
- ✅ **API Development**: Rich dataset for endpoint creation
- ✅ **Frontend Development**: Connect UI to actual athlete data
- ✅ **Feature Development**: Build on proven data foundation

## 🔧 Common Issues

### Database Connection Issues
- Verify Supabase URL and key in `.env`
- Check Row Level Security policies are applied
- Ensure all SQL scripts ran successfully

### Frontend Issues
- Check Node.js version (18+)
- Clear `node_modules` and reinstall if needed
- Verify environment variables are loaded

### Backend Issues
- Check Python version (3.11+)
- Install dependencies with `pip install -r requirements.txt`
- Verify Supabase client can connect

## 🎯 Next Steps

1. **Train ML Models** - Use Joshua's data for PMC model
2. **Update Frontend** - Connect React components to new schema  
3. **Build API Endpoints** - Create routes for training data
4. **Add Authentication** - Integrate Supabase auth
5. **Deploy to Production** - Google Cloud Run deployment

## 📚 Documentation

- **API Docs**: http://localhost:8000/docs (when backend running)
- **Database Schema**: See `backend/sql/production_schema.sql` for reference
- **Joshua's Data**: Real performance metrics and training loads included

## 🆘 Support

If you encounter issues:
1. Check the verification steps above
2. Review logs in terminal/browser console
3. Verify all prerequisites are installed
4. Ensure Supabase project is properly configured

You now have a complete development environment with real athlete data ready for ML training and feature development!