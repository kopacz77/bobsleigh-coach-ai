# Training Scripts

This directory contains scripts for training machine learning models for athlete performance prediction and optimization.

## Scripts

- `train_pmc_model.py`: Script to train and tune the Performance Management Chart model
- `train_load_predictor.py`: Train a model to predict optimal training loads
- `train_injury_risk_model.py`: Train a model to predict injury risk
- `train_performance_predictor.py`: Train a model to predict competition performance

## Usage

```bash
python -m ml.training.train_pmc_model --data_path data/processed/athlete_data.csv --output_path models/checkpoints/pmc_model.pkl
```