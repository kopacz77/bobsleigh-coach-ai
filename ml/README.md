# Machine Learning for Bobsleigh Coach AI

This directory contains the machine learning components of the Bobsleigh Coach AI application. The ML components provide personalized training recommendations, performance analysis, and injury risk prediction for bobsleigh athletes.

## Overview

The ML system consists of several key components:

1. **Performance Management Chart (PMC) Model**: Tracks fitness, fatigue, and form over time to provide training load recommendations.
2. **Injury Risk Prediction Model**: Assesses the probability of injury based on training patterns and athlete metrics.
3. **Training Recommendation Engine**: Generates personalized workout plans based on the athlete's current status.
4. **Data Processing Pipeline**: Cleans, processes, and transforms raw training data into usable features.

## Directory Structure

```
ml/
├── data/               # Data processing scripts
│   ├── preprocess.py   # Data cleaning and preparation
│   └── pmc_calculator.py # PMC calculations
├── models/             # ML model definitions
│   ├── pmc_model.py    # PMC model implementation
│   └── injury_risk_model.py # Injury risk model
├── notebooks/          # Jupyter notebooks for analysis
│   └── 01_pmc_analysis.ipynb # PMC analysis notebook
└── training/           # Model training scripts
    ├── train_pmc_model.py # Train PMC model
    └── train_injury_risk_model.py # Train injury risk model
```

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Training Models

```bash
# Train the PMC model
python -m ml.training.train_pmc_model --data_path data/processed/athlete_data.csv --output_path models/checkpoints/pmc_model.pkl

# Train the injury risk model
python -m ml.training.train_injury_risk_model --data_path sample --output_path models/checkpoints/injury_risk_model.joblib --optimize
```

### Using Models in the Application

The models are integrated into the FastAPI backend through service modules:

- `app/services/pmc_service.py`: Provides PMC calculations and recommendations
- `app/services/performance_service.py`: Analyzes performance data and trends

## Models

### Performance Management Chart (PMC) Model

The PMC model tracks three key metrics:

- **Chronic Training Load (CTL)**: Represents fitness (42-day exponential moving average)
- **Acute Training Load (ATL)**: Represents fatigue (7-day exponential moving average)
- **Training Stress Balance (TSB)**: Represents form (CTL - ATL)

These metrics help determine the athlete's readiness for training and guide workout recommendations.

### Injury Risk Model

The injury risk model uses a gradient boosting classifier to predict the probability of injury based on various factors such as:

- Training load metrics (average load, variability, acute:chronic ratio)
- Recovery indicators (sleep quality, fatigue)
- Athlete characteristics (age, training history)
- Previous injuries

## Data Requirements

For optimal model performance, the following data should be collected:

- **Daily Training Loads**: Calculated from workout intensity and duration
- **Subjective Ratings**: RPE (Rate of Perceived Exertion), fatigue, soreness
- **Sleep Data**: Hours and quality
- **Performance Metrics**: Strength, speed, power measurements
- **Injury History**: Previous injuries and their details

## Development

### Adding New Features

To add new features to the ML models:

1. Update the data processing scripts in `data/`
2. Modify the model definitions in `models/`
3. Retrain and evaluate the models
4. Update the service integration in the backend

### Jupyter Notebooks

The notebooks in the `notebooks/` directory provide exploratory analysis and model development examples. Use these to understand the data and test new approaches.

```bash
jupyter lab
```

## Research and References

The models are based on sports science research on training load management and injury prevention:

- Banister's Fitness-Fatigue model for PMC calculations
- Gabbett's Acute:Chronic Workload Ratio for injury risk assessment
- Sports-specific adaptation principles for bobsleigh training
