# Machine Learning Models

This directory contains machine learning model definitions for the Bobsleigh Coach AI application.

## Overview

The following models are implemented:

1. **Performance Management Chart (PMC) Model**: Tracks fitness, fatigue, and form
2. **Injury Risk Model**: Predicts probability of injury based on training patterns
3. **Performance Prediction Model**: Forecasts performance outcomes based on training history

## Model Descriptions

### PMC Model (`pmc_model.py`)

The PMC model implements Banister's fitness-fatigue model, which tracks three key metrics:

- **Chronic Training Load (CTL)**: A 42-day exponentially weighted moving average representing fitness
- **Acute Training Load (ATL)**: A 7-day exponentially weighted moving average representing fatigue
- **Training Stress Balance (TSB)**: The difference between CTL and ATL, representing form

These metrics help determine the athlete's readiness for training and guide workout recommendations. The model also includes functions for generating training load recommendations based on the current PMC metrics.

### Injury Risk Model (`injury_risk_model.py`)

This model predicts the probability of injury based on various factors:

- Training load metrics (average load, variability, acute:chronic ratio)
- Recovery indicators (sleep quality, fatigue, soreness)
- Athlete characteristics (age, training history)
- Previous injuries

The implementation uses a gradient boosting classifier with feature engineering and hyperparameter optimization for optimal performance.

## Usage

### PMC Model

```python
from models.pmc_model import PMCModel

# Create a PMC model
pmc = PMCModel()

# Calculate PMC metrics for a series of training loads
training_loads = [60, 0, 70, 80, 30, 0, 0]  # Daily training loads
pmc_data = pmc.calculate_pmc(training_loads)

# Generate training recommendations based on current metrics
recommendations = pmc.get_training_recommendations(
    current_ctl=pmc_data['ctl'][-1],
    current_atl=pmc_data['atl'][-1],
    current_tsb=pmc_data['tsb'][-1]
)
```

### Injury Risk Model

```python
from models.injury_risk_model import InjuryRiskModel

# Create and train a model
model = InjuryRiskModel()
model.train(X_train, y_train)

# Predict injury risk for an athlete
athlete_data = {
    'age': 28,
    'training_years': 5,
    'avg_weekly_load': 90,
    'acute_chronic_ratio': 1.4,
    'negative_tsb_days': 12,
    'sleep_quality': 6,
    'fatigue_score': 7.5,
}

risk_probability, risk_level, feature_importances = model.predict_risk(athlete_data)
```

## Model Checkpoints

Trained model checkpoints are stored in the `checkpoints/` directory. These can be loaded to make predictions without retraining.

```python
# Load a trained model
model = InjuryRiskModel(model_path="checkpoints/injury_risk_model.joblib")

# Use the loaded model for predictions
risk_probability, risk_level, feature_importances = model.predict_risk(athlete_data)
```

## Adding New Models

To add a new model:

1. Create a new Python file in this directory (e.g., `performance_prediction_model.py`)
2. Implement the model class with train and predict methods
3. Add training and evaluation code in the `__main__` block
4. Create a corresponding training script in the `training/` directory

## Model Evaluation

Models should be evaluated using appropriate metrics:

- Classification models (e.g., injury risk): ROC AUC, precision, recall, F1 score
- Regression models (e.g., performance prediction): RMSE, MAE, R²

Perform cross-validation to ensure robust performance and avoid overfitting.
