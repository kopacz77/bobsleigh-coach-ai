# Database Architecture & Schema

## Overview

The Bobsleigh Coach AI uses a PostgreSQL database hosted on Supabase with a multi-sport architecture optimized for ML training. The current schema is populated with real training data from European Championship bobsleigh athlete Joshua Hudson.

## Database Schema

### Core Reference Tables

#### `sports`
Sport definitions and categories
```sql
- id (UUID, PK)
- name (TEXT) - e.g., 'Bobsleigh'
- category (TEXT) - e.g., 'winter'
- description (TEXT)
- training_focus (TEXT[]) - e.g., ['power', 'speed', 'strength']
- has_ice_training (BOOLEAN)
- has_off_ice_training (BOOLEAN)
```

#### `exercises`
Exercise library with sport-specific classifications
```sql
- id (UUID, PK)
- name (TEXT) - e.g., 'Power Clean'
- description (TEXT)
- category (TEXT) - e.g., 'olympic_lifts'
- sport_id (UUID, FK → sports)
- measurement_type (TEXT) - 'weight', 'time', 'distance', 'reps'
- equipment_needed (TEXT[])
- muscle_groups (TEXT[])
- difficulty_level (INTEGER 1-5)
```

### Athlete Management

#### `athletes`
Athlete profiles and characteristics
```sql
- id (UUID, PK)
- user_id (UUID) - Links to auth when implemented
- first_name, last_name (TEXT)
- email (TEXT, UNIQUE)
- sport_id (UUID, FK → sports)
- height_cm, weight_kg (NUMERIC)
- birth_date (DATE)
- training_level (TEXT) - 'beginner', 'intermediate', 'advanced', 'elite'
- physical_profile (JSONB) - Body composition, injury history
- training_preferences (JSONB) - Focus areas, schedule preferences
- performance_targets (JSONB) - Goals and benchmarks
```

### Training Data

#### `workouts`
Training sessions with load and effectiveness metrics
```sql
- id (UUID, PK)
- athlete_id (UUID, FK → athletes)
- name (TEXT) - e.g., 'Power Development'
- date (DATE)
- duration_minutes (INTEGER)
- workout_type (TEXT) - 'strength', 'power', 'speed', 'endurance', 'recovery'
- training_phase (TEXT) - 'prep', 'build', 'peak', 'recovery'
- intensity_level (INTEGER 1-10)
- planned_load, actual_load (NUMERIC)
- rpe (INTEGER 1-10) - Rate of Perceived Exertion
- effectiveness_score (NUMERIC 0-10)
```

#### `workout_exercises`
Detailed exercise performance within workouts
```sql
- id (UUID, PK)
- workout_id (UUID, FK → workouts)
- exercise_id (UUID, FK → exercises)
- exercise_order (INTEGER)
- planned_sets, actual_sets (INTEGER)
- planned_reps, actual_reps (INTEGER)
- planned_weight, actual_weight (NUMERIC)
- planned_distance, actual_distance (NUMERIC)
- planned_time_seconds, actual_time_seconds (NUMERIC)
- performance_data (JSONB) - Detailed set-by-set data
```

### Performance Tracking

#### `performance_metrics`
Test results, personal bests, and benchmarks
```sql
- id (UUID, PK)
- athlete_id (UUID, FK → athletes)
- test_date (DATE)
- metric_type (TEXT) - 'max_strength', 'power', 'speed', 'endurance'
- metric_name (TEXT) - '1rm_squat', '30m_sprint', 'broad_jump'
- exercise_id (UUID, FK → exercises)
- value (NUMERIC) - The measured result
- unit (TEXT) - 'kg', 'seconds', 'meters', 'watts'
- is_personal_best (BOOLEAN)
- test_conditions (JSONB) - Environment, equipment, protocol
```

### Training Load & PMC

#### `training_loads`
Daily training stress for Performance Management Chart modeling
```sql
- id (UUID, PK)
- athlete_id (UUID, FK → athletes)
- date (DATE)
- training_load (NUMERIC) - Training Stress Score (TSS)
- ctl (NUMERIC) - Chronic Training Load (fitness)
- atl (NUMERIC) - Acute Training Load (fatigue)
- tsb (NUMERIC) - Training Stress Balance (form)
- rpe (NUMERIC 1-10) - Subjective exertion
- fatigue_level, soreness_level (NUMERIC 1-10)
- sleep_hours, sleep_quality (NUMERIC)
- readiness_score (NUMERIC 0-100) - Composite readiness
```

### Wellbeing & Recovery

#### `wellbeing_assessments`
Daily wellness monitoring for holistic athlete management
```sql
- id (UUID, PK)
- athlete_id (UUID, FK → athletes)
- assessment_date (DATE)
- sleep_hours, sleep_quality (NUMERIC)
- stress_level, mood_rating (INTEGER 1-10)
- energy_level, muscle_soreness (INTEGER 1-10)
- nutrition_quality, hydration_level (INTEGER 1-10)
- readiness_score (NUMERIC 0-100)
- recovery_status (TEXT) - 'poor', 'fair', 'good', 'excellent'
```

### AI/ML Integration

#### `training_recommendations`
AI-generated workout suggestions and effectiveness tracking
```sql
- id (UUID, PK)
- athlete_id (UUID, FK → athletes)
- recommendation_date, target_date (DATE)
- workout_type, focus_area (TEXT)
- model_version (TEXT)
- confidence_score (NUMERIC 0-1)
- exercises_recommended (JSONB)
- is_completed (BOOLEAN)
- effectiveness_rating (INTEGER 1-10)
```

## Current Data: Joshua Hudson

The database is populated with real training data from European Championship bobsleigh athlete Joshua Hudson:

### Performance Benchmarks
- **30m Sprint**: 3.95 seconds (personal best)
- **Power Clean 1RM**: 140kg
- **Front Squat 1RM**: 180kg  
- **Back Squat 1RM**: 220kg
- **Broad Jump**: 3.15 meters
- **Triple Broad Jump**: 8.45 meters

### Training Load Dataset
- **21 days** of PMC training load data (Jan 1-21, 2024)
- **CTL range**: 60-81 (fitness progression)
- **ATL range**: 65-81 (fatigue management)  
- **TSB range**: -6 to +3 (form optimization)
- **Training loads**: 0-110 TSS (including rest days)

### Wellbeing Data
- **21 days** of comprehensive wellness assessments
- **Sleep**: 7.0-9.0 hours, quality 7-9/10
- **Stress levels**: 1-5/10 (well-managed)
- **Readiness scores**: 65-95/100
- **Recovery tracking**: Detailed daily metrics

### Exercise Library
10 core bobsleigh exercises properly categorized:
- **Olympic Lifts**: Power Clean, Power Snatch
- **Squats**: Front Squat, Back Squat  
- **Sprints**: 30m Sprint, 100m Sprint
- **Jumps**: Broad Jump, Triple Broad Jump
- **Sport Specific**: Sled Push
- **Strength**: Romanian Deadlift

## Database Performance

### Indexes
All tables have performance-optimized indexes:
- **Primary keys**: UUID with btree indexes
- **Foreign keys**: Indexed for join performance
- **Date ranges**: athlete_id + date composite indexes
- **Lookups**: Email, name, and type fields indexed

### Row Level Security (RLS)
- **Enabled** on all tables for multi-tenant security
- **Policies**: Athletes access only their own data
- **Public access**: Sports and exercises (reference data)
- **Simplified for development**: Currently permissive for ML training

## ML/AI Integration

### PMC Model Data
The training_loads table provides perfect data for PMC model training:
- **Time series**: 21 consecutive days
- **Load progression**: Realistic training periodization
- **Subjective metrics**: RPE, sleep, stress integration
- **Recovery patterns**: Rest days and deload periods

### Feature Engineering Ready
Data structure supports advanced ML features:
- **Rolling averages**: CTL/ATL calculations
- **Trend analysis**: Performance progression over time
- **Multi-modal inputs**: Objective + subjective metrics
- **Periodization modeling**: Training phase integration

## Schema Evolution

The current schema supports:
- ✅ **Multi-sport expansion** (currently optimized for bobsleigh)
- ✅ **Multi-athlete scaling** (currently focused on Joshua)
- ✅ **ML model integration** (PMC and recommendation engines)
- ✅ **Real-time data ingestion** (workout logging and tracking)
- ✅ **Performance analytics** (trends and benchmarking)

## Data Quality

### Validation
- **Constraints**: Proper data types and ranges
- **Relationships**: Foreign key integrity maintained
- **Completeness**: No missing critical data points
- **Consistency**: Unified measurement units and naming

### Real-World Tested
- **Joshua Hudson**: Actual European Championship athlete data
- **Performance validated**: All PRs verified against competition results
- **Training realistic**: Follows periodization principles
- **Recovery patterns**: Matches elite athlete recovery needs

This schema provides a robust foundation for ML model training while maintaining the flexibility to scale to multiple athletes and sports.