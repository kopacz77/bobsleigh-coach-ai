"""Data preprocessing module.

This module contains functions for loading and preprocessing raw bobsleigh training data.
"""

import os
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from pathlib import Path


def load_raw_data(data_path: str) -> pd.DataFrame:
    """Load raw training data from CSV files.

    Args:
        data_path: Path to the directory containing raw data files

    Returns:
        DataFrame with combined raw data
    """
    data_dir = Path(data_path)
    all_data = []

    for file in data_dir.glob("*.csv"):
        try:
            df = pd.read_csv(file)
            all_data.append(df)
        except Exception as e:
            print(f"Error loading {file}: {e}")

    if not all_data:
        raise ValueError(f"No valid CSV files found in {data_path}")

    return pd.concat(all_data, ignore_index=True)


def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean the raw data.

    Args:
        df: Raw data DataFrame

    Returns:
        Cleaned DataFrame
    """
    # Make a copy to avoid modifying the original
    cleaned = df.copy()

    # Drop completely empty rows and columns
    cleaned = cleaned.dropna(how='all')
    cleaned = cleaned.dropna(axis=1, how='all')

    # Remove duplicates
    cleaned = cleaned.drop_duplicates()

    # Convert date columns to datetime
    date_columns = [col for col in cleaned.columns if 'date' in col.lower()]
    for col in date_columns:
        try:
            cleaned[col] = pd.to_datetime(cleaned[col])
        except Exception as e:
            print(f"Error converting {col} to datetime: {e}")

    # Handle missing values (simple imputation for numeric columns)
    numeric_cols = cleaned.select_dtypes(include=['float64', 'int64']).columns
    for col in numeric_cols:
        # Fill missing with median for numeric columns
        if cleaned[col].isna().any():
            cleaned[col] = cleaned[col].fillna(cleaned[col].median())

    return cleaned


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create features from the cleaned data.

    Args:
        df: Cleaned DataFrame

    Returns:
        DataFrame with engineered features
    """
    # Make a copy to avoid modifying the original
    features = df.copy()

    # Example: Calculate derived metrics relevant to bobsleigh
    # Note: These are placeholders - real feature engineering would depend on available data

    # Example: Calculate power-to-weight ratio if weight and power metrics exist
    if 'weight_kg' in features.columns and 'power_watts' in features.columns:
        features['power_to_weight'] = features['power_watts'] / features['weight_kg']

    # Example: Calculate days since last training session if date is available
    if 'session_date' in features.columns:
        features['days_since_last_session'] = features.groupby('athlete_id')['session_date'].diff().dt.days

    # Example: Calculate rolling averages for key metrics to track fatigue/fitness
    # Assuming 'training_load' is a column representing the load of each session
    if 'training_load' in features.columns and 'athlete_id' in features.columns:
        # Calculate 7-day and 28-day rolling averages (key PMC metrics)
        features['acute_load'] = features.groupby('athlete_id')['training_load'].transform(
            lambda x: x.rolling(7, min_periods=1).mean()
        )
        features['chronic_load'] = features.groupby('athlete_id')['training_load'].transform(
            lambda x: x.rolling(28, min_periods=1).mean()
        )
        
        # Calculate training stress balance (form)
        features['tsb'] = features['chronic_load'] - features['acute_load']

    return features


def process_data(raw_data_path: str, output_path: str) -> None:
    """Process raw data and save the result.

    Args:
        raw_data_path: Path to raw data directory
        output_path: Path to save processed data
    """
    # Load raw data
    df = load_raw_data(raw_data_path)
    
    # Clean data
    cleaned = clean_data(df)
    
    # Engineer features
    processed = engineer_features(cleaned)
    
    # Save processed data
    processed.to_csv(output_path, index=False)
    print(f"Processed data saved to {output_path}")


if __name__ == "__main__":
    # Example usage
    # process_data("ml/data/raw", "ml/data/processed/processed_data.csv")
    print("Run this script with appropriate paths to process data.")
