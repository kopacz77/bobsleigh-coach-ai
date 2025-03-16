# Data Directory

This directory contains scripts for data processing and the data itself.

## Structure

- `raw/`: Original, immutable data
- `processed/`: Cleaned and processed data ready for training
- `interim/`: Intermediate data transformation files
- `external/`: Data from external sources

## Data Processing Scripts

- `preprocess.py`: Clean and preprocess raw data
- `feature_engineering.py`: Create features from processed data
- `dataset.py`: Create PyTorch datasets from processed data