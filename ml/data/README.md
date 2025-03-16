# Data Processing Pipeline

This directory contains scripts for processing and preparing athlete training data for machine learning models.

## Overview

The data processing pipeline handles:

1. **Data Cleaning**: Removing errors, handling missing values, and standardizing formats
2. **Feature Engineering**: Creating derived features like training load metrics
3. **PMC Calculations**: Computing fitness (CTL), fatigue (ATL), and form (TSB) metrics
4. **Data Transformation**: Preparing data for model training

## Files

- `preprocess.py`: Functions for loading, cleaning, and processing raw data
- `pmc_calculator.py`: Implementation of the Performance Management Chart calculations
- `feature_engineering.py`: Functions for creating advanced features from processed data

## Data Requirements

For bobsleigh athletes, the following data should be collected:

### Daily Data
- **Training Load**: Calculated from workout intensity (RPE) and duration
- **Subjective Metrics**: Fatigue, soreness, sleep quality (1-10 scales)
- **Sleep Data**: Hours of sleep

### Periodic Data
- **Strength Metrics**: 1RM for key exercises (squat, bench press, etc.)
- **Speed Metrics**: Sprint times (e.g., 30m, 60m)
- **Power Metrics**: Vertical jump, broad jump, medicine ball throw
- **Body Composition**: Weight, body fat percentage

### Event Data
- **Injuries**: Occurrence, type, severity, and duration
- **Competitions**: Performance metrics and results

## Expected File Formats

The preprocessing scripts expect data in CSV format with the following structure:

### Training Data CSV
```
athlete_id,date,session_type,duration_minutes,rpe,training_load,fatigue,soreness,sleep_quality,sleep_hours,notes
1,2025-01-01,Strength,60,7,420,5,4,7,8,"Good session"
```

### Performance Metrics CSV
```
athlete_id,date,metric_type,metric_name,value,unit
1,2025-01-15,Strength,Squat 1RM,150,kg
```

## Usage

```python
# Example usage of preprocess.py
from data.preprocess import process_data

process_data(
    raw_data_path="data/raw/athlete_training.csv",
    output_path="data/processed/processed_data.csv"
)
```

```python
# Example usage of pmc_calculator.py
from data.pmc_calculator import calculate_pmc, generate_training_recommendations

# Calculate PMC metrics from training loads
training_loads = [60, 0, 70, 80, 30, 0, 0]  # Daily training loads
pmc_data = calculate_pmc(training_loads)

# Get training recommendations based on current metrics
current_ctl = pmc_data['ctl'][-1]  # Current fitness
current_atl = pmc_data['atl'][-1]  # Current fatigue
current_tsb = pmc_data['tsb'][-1]  # Current form

recommendations = generate_training_recommendations(current_ctl, current_atl, current_tsb)
```

## Extending the Pipeline

To extend the data processing pipeline for new data sources or features:

1. Add new loading functions in `preprocess.py`
2. Create new feature engineering functions in `feature_engineering.py`
3. Update the main processing function to include the new data

## Handling Missing Data

The preprocessing scripts handle missing data in several ways:

- Numerical values: Imputed with median values for each athlete
- Categorical values: Imputed with most frequent values
- Dates: Missing sessions can be interpolated or marked as rest days

For optimal model performance, it's important to have consistent daily data, especially for training load metrics.
