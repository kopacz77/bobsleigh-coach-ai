# 🧠 ML Training Guide - Joshua Hudson PMC Models

## Overview

This guide explains how to train machine learning models using Joshua Hudson's real training data for Performance Management Chart (PMC) modeling and training recommendations.

## 📊 What We're Training On

### Joshua's Real Data
- **21 days** of continuous training data (Jan 1-21, 2024)
- **European Championship athlete** - validated performance benchmarks
- **Complete PMC dataset** - Training load, CTL, ATL, TSB, RPE, wellness metrics
- **Performance benchmarks** - 30m sprint (3.95s), Power Clean (140kg), etc.

### Model Objectives
1. **PMC Prediction** - Predict next-day CTL, ATL, TSB from current state
2. **Readiness Prediction** - Forecast athlete readiness/fatigue levels  
3. **Training Recommendations** - Generate personalized workout suggestions
4. **Load Optimization** - Optimize training loads for peak performance

## 🚀 Quick Start (Automated)

### Option 1: One-Command Setup
```bash
# From project root directory
cd ml
python setup_and_train.py
```

This script will:
- ✅ Check environment setup
- ✅ Install ML requirements  
- ✅ Load Joshua's data from Supabase
- ✅ Train multiple ML models
- ✅ Create visualizations
- ✅ Save trained models
- ✅ Test recommendation engine

### Option 2: Manual Step-by-Step

#### Prerequisites
```bash
# Ensure environment variables are set
export SUPABASE_URL="your_supabase_project_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"

# Install requirements
cd ml
pip install -r requirements.txt
```

#### 1. Load Joshua's Data
```python
from data.joshua_data_loader import JoshuaDataLoader

# Initialize data loader
loader = JoshuaDataLoader()

# Get summary of available data
summary = loader.get_joshua_summary()
print(f"Training period: {summary['data_period']['start_date']} to {summary['data_period']['end_date']}")
print(f"Total days: {summary['data_period']['total_days']}")

# Load PMC dataset for training
pmc_data = loader.create_pmc_dataset()
print(f"Dataset shape: {pmc_data.shape}")
```

#### 2. Train PMC Models
```python
from training.train_joshua_pmc_model import JoshuaPMCTrainer

# Initialize trainer
trainer = JoshuaPMCTrainer(loader)

# Load and prepare data
pmc_data = trainer.load_and_prepare_data()

# Create features and targets
X, targets = trainer.create_features_and_targets()

# Train multiple ML models
results = trainer.train_models(X, targets)

# Evaluate traditional PMC model
traditional_results = trainer.evaluate_traditional_pmc()

# Create visualizations
trainer.create_visualizations()

# Save trained models
trainer.save_models()
```

#### 3. Generate Training Recommendations
```python
from models.joshua_recommendation_engine import JoshuaRecommendationEngine

# Initialize recommendation engine
engine = JoshuaRecommendationEngine()

# Sample current state
current_state = {
    'training_load': 85,
    'readiness_score': 78,
    'sleep_hours': 7.5,
    'stress_level': 3,
    'days_since_rest': 2,
    'rpe': 7
}

# Generate recommendation
recommendation = engine.generate_recommendation(current_state)
print(f"Recommended workout: {recommendation['workout_type']}")
print(f"Intensity: {recommendation['intensity_level']}/10")
print(f"Rationale: {recommendation['rationale']}")

# Generate weekly plan
weekly_plan = engine.create_weekly_plan(current_state, 7)
```

## 🎯 Model Architecture

### 1. Data Pipeline
```
Joshua's Supabase Data
         ↓
   Data Loader (joshua_data_loader.py)
         ↓
   Feature Engineering
         ↓
   Train/Test Split (Time Series)
         ↓
   Multiple ML Models
```

### 2. Models Trained
- **Linear Regression** - Baseline performance
- **Ridge Regression** - Regularized linear model
- **Elastic Net** - L1/L2 regularization
- **Random Forest** - Ensemble tree method
- **Gradient Boosting** - Advanced ensemble
- **Support Vector Regression** - Non-linear modeling

### 3. Prediction Targets
- `ctl_next_day` - Tomorrow's Chronic Training Load (fitness)
- `atl_next_day` - Tomorrow's Acute Training Load (fatigue)  
- `tsb_next_day` - Tomorrow's Training Stress Balance (form)
- `readiness_next_day` - Tomorrow's readiness score
- `fatigue_level` - Current fatigue assessment
- `soreness_level` - Current muscle soreness

### 4. Feature Engineering
- **Load metrics** - Current/previous training loads
- **Rolling averages** - 3-day and 7-day smoothing
- **Trend indicators** - Load ramp rate, recovery ratio
- **Wellness features** - Sleep, stress, motivation
- **Temporal features** - Days since rest, training phase

## 📈 Expected Results

### Model Performance Benchmarks
Based on Joshua's 21-day dataset:

- **CTL Prediction**: R² > 0.85 (excellent)
- **ATL Prediction**: R² > 0.80 (very good) 
- **TSB Prediction**: R² > 0.75 (good)
- **Readiness Prediction**: R² > 0.70 (acceptable)

### Traditional PMC vs ML Models
- **Traditional PMC**: Mathematical model with fixed decay constants
- **ML Models**: Data-driven with personalized patterns
- **Expected improvement**: 10-20% better prediction accuracy

## 🎨 Visualizations Created

The training process generates comprehensive visualizations:

### 1. `joshua_training_analysis.png`
- Daily training load time series
- PMC chart (CTL, ATL, TSB progression)
- Readiness vs training load scatter plot
- Sleep vs stress correlation

### 2. `model_performance_comparison.png`
- R² scores across all models and targets
- Color-coded performance (green > 0.8, orange > 0.6, red < 0.6)
- Easy identification of best-performing models

### 3. `feature_importance.png`
- Top 10 most important features for prediction
- Based on Random Forest feature importance
- Insights into what drives Joshua's performance

## 🔧 Model Usage

### Loading Trained Models
```python
import pickle
import os

# Load best model for CTL prediction
model_path = "ml/models/checkpoints/joshua_ctl_next_day_random_forest.pkl"
with open(model_path, 'rb') as f:
    ctl_model = pickle.load(f)

# Load feature scaler
scaler_path = "ml/models/checkpoints/joshua_feature_scaler.pkl"
with open(scaler_path, 'rb') as f:
    scaler = pickle.load(f)
```

### Making Predictions
```python
import numpy as np

# Sample feature vector (17 features)
features = np.array([
    85,    # training_load
    90,    # prev_training_load  
    8,     # prev_rpe
    78,    # prev_readiness_score
    87,    # rolling_3d_load
    7.5,   # rolling_3d_rpe
    7.8,   # rolling_3d_sleep
    82,    # rolling_7d_load
    12,    # weekly_load_std
    68,    # training_impulse
    0.05,  # load_ramp_rate
    8.5,   # recovery_ratio
    3,     # days_since_rest
    7,     # rpe
    7.5,   # sleep_hours
    8,     # sleep_quality
    3      # stress_level
]).reshape(1, -1)

# Scale features
features_scaled = scaler.transform(features)

# Predict next day's CTL
predicted_ctl = ctl_model.predict(features_scaled)[0]
print(f"Predicted CTL for tomorrow: {predicted_ctl:.1f}")
```

## 🎯 Training Recommendations Logic

The recommendation engine uses a decision tree approach:

### High Fatigue (TSB < -5)
- **Workout**: Recovery/Rest
- **Intensity**: 1-3/10
- **Focus**: Active recovery, mobility

### Fresh & Ready (TSB > 2, Readiness > 85)
- **Workout**: Power or Speed
- **Intensity**: 8-10/10  
- **Focus**: Peak performance work

### Building Phase (TSB -2 to +2)
- **Workout**: Strength
- **Intensity**: 6-8/10
- **Focus**: Foundation building

### External Factors
- **High stress**: Reduce intensity by 2 levels
- **Poor sleep**: Reduce intensity by 1 level
- **5+ days since rest**: Force rest day

## 📊 Model Evaluation

### Cross-Validation
- **Time Series Split** - Respects temporal order
- **3-fold validation** - Limited by small dataset
- **Out-of-sample testing** - Final 20% of data

### Metrics Used
- **RMSE** - Root Mean Squared Error (lower is better)
- **MAE** - Mean Absolute Error (interpretable units)
- **R²** - Coefficient of determination (0-1, higher is better)

### Model Selection
- **Best model per target** - Highest R² score
- **Ensemble consideration** - Average multiple models
- **Interpretability** - Random Forest for explainability

## 🔄 Continuous Learning

### Model Updates
1. **Weekly retraining** - As new data comes in
2. **Performance monitoring** - Track prediction accuracy  
3. **Feature updates** - Add new wellness metrics
4. **Hyperparameter tuning** - Optimize as dataset grows

### Feedback Loop
```python
# Track recommendation effectiveness
def update_model_with_feedback(recommendations, outcomes):
    effectiveness = engine.evaluate_recommendation_effectiveness(
        recommendations, outcomes
    )
    
    if effectiveness['avg_effectiveness'] < 6.0:
        print("Model needs retraining - low effectiveness")
        # Trigger retraining pipeline
```

## 🚨 Troubleshooting

### Common Issues

#### "No training data found"
- Verify Supabase connection
- Check that Joshua's data was inserted correctly
- Confirm environment variables are set

#### "Models not loading"  
- Ensure training completed successfully
- Check `ml/models/checkpoints/` directory exists
- Verify model files were saved

#### "Poor model performance"
- 21 days is minimum dataset - performance improves with more data
- Check for data quality issues (missing values, outliers)
- Consider feature engineering improvements

#### "Memory errors"
- Reduce model complexity (fewer trees in Random Forest)
- Use incremental learning approaches
- Process data in smaller batches

### Debug Commands
```bash
# Test data loading
python -c "from data.joshua_data_loader import JoshuaDataLoader; loader = JoshuaDataLoader(); print(loader.get_joshua_summary())"

# Test model loading
python -c "from models.joshua_recommendation_engine import JoshuaRecommendationEngine; engine = JoshuaRecommendationEngine(); print(f'Loaded {len(engine.models)} model categories')"

# Check outputs
ls -la ml/outputs/
ls -la ml/models/checkpoints/
```

## 🎉 Success Indicators

After successful training, you should see:
- ✅ **21 days of data loaded** from Supabase
- ✅ **6+ trained models** with R² > 0.6
- ✅ **Visualizations created** in `ml/outputs/`
- ✅ **Models saved** in `ml/models/checkpoints/`
- ✅ **Recommendation engine working** with logical suggestions

## 🚀 Next Steps

1. **Integrate with API** - Create FastAPI endpoints for predictions
2. **Frontend Integration** - Display recommendations in React app
3. **Real-time Updates** - Continuous model updates as Joshua trains
4. **Expand Dataset** - Add more athletes for generalization
5. **Advanced Models** - Neural networks, deep learning approaches

This ML pipeline provides a solid foundation for personalized training optimization using real elite athlete data!