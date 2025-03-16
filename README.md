# Bobsleigh Coach AI

An AI-powered training application for bobsleigh athletes with personalized recommendations and performance tracking.

## Overview

This application uses advanced machine learning techniques to analyze athlete performance data and provide personalized training recommendations, performance tracking, and coaching insights specifically tailored for bobsleigh athletes with plans to expand to other sports.

## Features

- **Performance Management Charts (PMC)** for tracking fitness, fatigue, and form
- **AI-Generated Training Recommendations** based on current training status
- **Workout Logging and Tracking** with detailed exercise data
- **Performance Metrics and Analysis** to monitor progress
- **Athlete Wellbeing Tracking** for holistic health monitoring
- **Recovery Management** to optimize training adaptation
- **Mood and Mental Health Tracking** for complete athlete monitoring
- **Customizable Athlete Profiles** to personalize the experience

## Tech Stack

### Frontend
- Next.js 14 (React framework)
- TypeScript
- Mantine UI v7 (Component library)
- React Query (Data fetching and caching)
- Recharts (Data visualization)

### Backend
- Python 3.11
- FastAPI (API framework)
- PyTorch (ML framework)
- PostgreSQL via Supabase (Database)

### AI/ML
- Performance Management Charts (PMC) for training load analysis
- Fine-tuned LLM for personalized coaching recommendations
- PyTorch for custom model training and inference

### Deployment
- Google Cloud Run (Containerized deployment)
- Docker (Containerization)

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/kopacz77/bobsleigh-coach-ai.git
   cd bobsleigh-coach-ai
   ```

2. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   ```

3. Start the development environment
   ```bash
   docker-compose up
   ```

4. Access the application
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Database Setup

1. Create a Supabase project at https://supabase.com

2. Run the SQL script in `backend/sql/supabase_schema.sql` in the Supabase SQL editor to create the database schema

3. Update your `.env` file with the Supabase credentials

## Key Components

### Wellbeing Module

The wellbeing module provides comprehensive tracking of athlete wellbeing:

- **Daily Wellbeing Assessment** - Track sleep, stress, nutrition, and mental clarity
- **Mood Tracking** - Monitor emotional state with calendar visualization
- **Physical Metrics** - Record measurable health data like heart rate, weight, etc.
- **Reflections Journal** - Capture thoughts and insights about training
- **Recovery Health** - Track recovery methods and manage injuries

### Performance Module

The performance module allows for detailed tracking of athletic performance:

- **Performance Assessment** - Record and analyze performance tests
- **Training Assessment** - Evaluate training sessions effectiveness
- **Performance Trends** - Visualize progress over time

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Machine Learning

### Training Models

```bash
cd ml
pip install -r requirements.txt
python -m ml.training.train_pmc_model --data_path data/processed/athlete_data.csv --output_path models/checkpoints/pmc_model.pkl
```

### Running Jupyter Notebooks

```bash
cd ml
jupyter lab
```

## License

MIT License
