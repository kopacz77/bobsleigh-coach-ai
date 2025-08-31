# Adaptive Training Prediction System

## Overview

Based on the Joshua Hudson Training Template analysis, this system enables **real-time training adaptation** using ML prediction models that can:

1. **Predict next week's training** based on previous week's feedback
2. **Modify daily sessions** based on same-day or previous-day feedback
3. **Automatically adjust loads** based on athlete response patterns

## Key Findings from Analysis

### 🎯 **Extracted Exercise Catalog**
- **208 unique exercises** from 1,902 entries
- **5 main categories**: Olympic lifts, Squats, Sprints, Jumps, Recovery
- **Exercise variations**: "Clean" → "Cleans from block", "Clean from hang"
- **Load patterns**: 50-200kg range with clear progression tracking

### 📊 **Discovered Adaptation Patterns**

#### **Weekly Patterns**
- **Load oscillation**: 85-130kg average weekly loads
- **Volume cycling**: 10-34 sets per week
- **Progression markers**: Clear increases followed by deload weeks

#### **Daily Patterns**
- **Significant load swings**: ±50-140kg between consecutive days
- **Exercise modifications**: ±1-7 exercise changes per day
- **Adaptive cues**: "Heavy/Light", "Easy track day", "Recovery walk"

#### **Feedback Integration**
- **Physical markers**: "Sore", "Tired", "Good spirits"
- **Performance indicators**: "Difficult", "Easy", "Struggle"
- **Modification requests**: "Light", "Heavy", "Alternate"

## Adaptive System Architecture

### **Real-Time Feedback Loop**
```
Daily Feedback → ML Features → Prediction Model → Recommendations → Training Session
       ↑                                                                    ↓
   Athlete Response ← Session Execution ← Load/Exercise Adjustments ← Adaptation Rules
```

### **Prediction Models**

#### **1. Next-Week Prediction Model**
```sql
INPUT FEATURES:
- 7-day load history (volume, intensity, frequency)
- 7-day feedback trends (RPE, soreness, energy)
- 28-day training patterns
- ACWR ratios
- Performance trends

OUTPUT:
- Weekly training volume target
- Daily session recommendations
- Exercise selection priorities
- Load progression strategy
```

#### **2. Next-Day Adaptation Model**
```sql
INPUT FEATURES:
- Previous day's session feedback
- Same-day morning wellness
- Cumulative fatigue indicators
- Sleep quality and duration
- Motivation levels

OUTPUT:
- Session intensity adjustment (-30% to +10%)
- Exercise substitution recommendations
- Volume modifications (sets/reps)
- Recovery protocols
```

### **Adaptive Functions**

#### **Load Adjustment Algorithm**
```sql
-- Real-time load calculation
SELECT calculate_adaptive_load_adjustment(athlete_id, target_date, base_load_kg);

-- Considers:
-- - Recent RPE scores (>7 = reduce load)
-- - Muscle soreness levels (>7 = reduce load)
-- - Energy levels (<4 = reduce load)
-- - ACWR ratios (>1.5 = significant reduction)
```

#### **Exercise Substitution Engine**
```sql
-- Automatic exercise replacement
SELECT recommend_exercise_substitution(exercise_id, athlete_id, reason);

-- Reasons: 'injury', 'fatigue', 'equipment', 'variety'
-- Returns: substitute exercises with load adjustments
```

## Implementation Strategy

### **Phase 1: Data Collection**
- **Daily feedback forms**: Post-session RPE, soreness, energy
- **Exercise-specific feedback**: Technique quality, difficulty
- **Morning wellness checks**: Sleep, motivation, readiness

### **Phase 2: Feature Engineering**
- **Rolling averages**: 7-day and 28-day metrics
- **Trend calculations**: Load progression slopes
- **Ratio calculations**: ACWR, monotony, strain indices

### **Phase 3: Model Training**
- **Historical data**: 3 years of Joshua Hudson patterns
- **Supervised learning**: Feedback → optimal next session
- **Reinforcement learning**: Continuous improvement from outcomes

### **Phase 4: Real-Time Adaptation**
- **Rule-based system**: Immediate adaptations for extreme values
- **ML predictions**: Nuanced adjustments based on patterns
- **Coach override**: Manual adjustments when needed

## Database Schema Extensions

### **New Tables Added**
1. **`daily_feedback`** - Real-time athlete feedback collection
2. **`exercise_feedback`** - Exercise-specific performance data
3. **`ml_prediction_features`** - Engineered features for ML models
4. **`session_recommendations`** - AI-generated session prescriptions
5. **`weekly_recommendations`** - Weekly training plan adaptations
6. **`adaptation_rules`** - Rule-based modification system

### **Adaptive Functions**
- **`calculate_adaptive_load_adjustment()`** - Real-time load modification
- **`recommend_exercise_substitution()`** - Exercise replacement suggestions
- **`update_prediction_features()`** - Automatic feature recalculation

## Predictive Capabilities

### **Weekly Prediction Example**
```
Previous Week Feedback:
- Average RPE: 8.2 (high)
- Soreness: 7.5 (high)
- Energy: 4.1 (low)
- ACWR: 1.6 (overreaching)

Next Week Recommendation:
- Reduce volume by 25%
- Focus on technique work
- Increase recovery exercises
- Deload recommendation: TRUE
```

### **Daily Adaptation Example**
```
Yesterday's Session:
- Planned: 5x3 @ 120kg Box Squat
- Actual: 3x3 @ 110kg (form breakdown)
- RPE: 9/10
- Soreness: 8/10

Today's Adaptation:
- Reduce load to 90kg (-25%)
- Change to 4x5 (volume distribution)
- Add mobility work
- Substitute: Jump Squats → Bodyweight Squats
```

## Machine Learning Models

### **Model 1: Weekly Planning**
- **Type**: Regression + Classification
- **Features**: 28-day history, seasonal patterns, performance trends
- **Output**: Weekly volume, intensity, exercise selection

### **Model 2: Daily Adaptation**
- **Type**: Reinforcement Learning
- **Features**: Previous day feedback, morning wellness, cumulative fatigue
- **Output**: Session modifications, exercise substitutions

### **Model 3: Exercise Selection**
- **Type**: Collaborative Filtering + Content-Based
- **Features**: Exercise history, athlete preferences, performance outcomes
- **Output**: Optimal exercise combinations for goals

## Benefits for Athletes

### **Immediate Benefits**
- **Reduced overtraining risk** through real-time load monitoring
- **Improved recovery** via adaptive programming
- **Enhanced performance** through optimized training stress

### **Long-term Benefits**
- **Injury prevention** through pattern recognition
- **Personalized progressions** based on individual responses
- **Optimal peaking** for competition preparation

## Integration with Existing System

### **API Endpoints**
```typescript
// Get daily recommendations
GET /api/recommendations/daily/:athleteId/:date

// Submit session feedback
POST /api/feedback/session
{
  sessionId: string,
  rpe: number,
  soreness: number,
  energy: number,
  exerciseFeedback: ExerciseFeedback[]
}

// Get weekly plan
GET /api/recommendations/weekly/:athleteId/:weekStart
```

### **Real-Time Dashboard**
- **Current adaptation status**: ACWR, fatigue levels, recommendations
- **Prediction confidence**: Model certainty in recommendations
- **Override controls**: Coach manual adjustments
- **Feedback trends**: Visual representation of athlete responses

## Files Created

1. **`backend/sql/adaptive_training_extension.sql`** - Complete adaptive system schema
2. **`docs/ADAPTIVE_TRAINING_SYSTEM.md`** - This comprehensive documentation

## Next Steps

1. **Implement data collection**: Daily feedback forms
2. **Train ML models**: Using historical Joshua Hudson data
3. **Build API endpoints**: Real-time recommendation system
4. **Create dashboard**: Visualization for coaches and athletes
5. **Validate predictions**: Compare recommendations to optimal outcomes

This system transforms the sophisticated Joshua Hudson training methodology into an **intelligent, adaptive AI coach** that can predict and optimize training in real-time based on athlete feedback and response patterns.