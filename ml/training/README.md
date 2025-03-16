# Model Training Scripts

This directory contains scripts for training the machine learning models used in the Bobsleigh Coach AI application.

## Overview

These scripts handle:

1. Data loading and preprocessing
2. Model training and hyperparameter optimization
3. Model evaluation
4. Saving trained models

## Scripts

- `train_pmc_model.py`: Trains the Performance Management Chart model
- `train_injury_risk_model.py`: Trains the injury risk prediction model

## Usage

### PMC Model Training

```bash
python -m ml.training.train_pmc_model --data_path data/processed/athlete_data.csv --output_path models/checkpoints/pmc_model.pkl
```

The PMC model requires a CSV file with at least the following columns:
- `athlete_id`: Identifier for the athlete
- `date`: Date of the training session
- `training_load`: Daily training load value

### Injury Risk Model Training

```bash
python -m ml.training.train_injury_risk_model --data_path data/processed/athlete_data.csv --output_path models/checkpoints/injury_risk_model.joblib --optimize --cv 5
```

Arguments:
- `--data_path`: Path to the training data file, or "sample" to generate sample data
- `--output_path`: Path to save the trained model
- `--label_column`: Name of the column with injury labels (default: "injury")
- `--optimize`: Flag to perform hyperparameter optimization
- `--cv`: Number of cross-validation folds (default: 5)

The injury risk model requires features such as:
- `acute_chronic_ratio`: Ratio of acute to chronic training load
- `load_variability`: Variability in training load
- `negative_tsb_days`: Days with negative Training Stress Balance
- `fatigue_score`: Subjective fatigue rating

## Adding New Training Scripts

To add a new training script:

1. Create a new Python file (e.g., `train_performance_model.py`)
2. Follow the pattern of existing scripts:
   - Parse command-line arguments
   - Load and preprocess data
   - Create and train the model
   - Evaluate performance
   - Save the trained model

## Best Practices

### Data Splitting

Always split your data into training and testing sets to evaluate model performance on unseen data. For time series data (like athlete training data), use a time-based split rather than random sampling.

### Hyperparameter Optimization

Use cross-validation with grid search or random search to find optimal hyperparameters. This helps prevent overfitting and improves model generalization.

### Model Evaluation

Evaluate models using appropriate metrics:

- Classification models: ROC AUC, precision, recall, F1 score
- Regression models: RMSE, MAE, R²

### Model Saving

Save trained models with all necessary information to make predictions:

- The model itself
- Feature names and order
- Preprocessing steps or parameters
- Metadata about the training data

### Logging

Use Python's logging module to track the training process and record important information like:

- Data statistics
- Training parameters
- Evaluation metrics
- Warnings or errors

## Scheduled Retraining

Models should be retrained periodically as new data becomes available. Consider implementing a scheduled retraining process that:

1. Aggregates new training data
2. Retrains the models
3. Evaluates performance against the previous model
4. Deploys the new model if performance improves

This ensures that models stay up-to-date with the latest athlete data and patterns.
