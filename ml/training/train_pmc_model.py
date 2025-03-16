"""Train and optimize a Performance Management Chart (PMC) model.

This script trains a PMC model on athlete data and optimizes its parameters.
"""

import argparse
import os
import pandas as pd
import numpy as np
import pickle
from typing import Dict, List, Tuple
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Import the PMC model
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from models.pmc_model import PMCModel


def load_data(data_path: str) -> pd.DataFrame:
    """Load processed training data.

    Args:
        data_path: Path to the processed data file

    Returns:
        DataFrame with training data
    """
    return pd.read_csv(data_path)


def prepare_data(df: pd.DataFrame) -> Tuple[Dict[str, pd.DataFrame], Dict[str, List]]:
    """Prepare data for PMC model training and evaluation.

    Args:
        df: DataFrame with training data

    Returns:
        Tuple of athlete dataframes and training loads lists
    """
    # Group data by athlete
    athlete_dfs = {}
    athlete_loads = {}
    
    # Ensure we have required columns
    required_cols = ['athlete_id', 'session_date', 'training_load']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Column {col} is required but not found in data")
    
    # Sort data by date for each athlete
    df['session_date'] = pd.to_datetime(df['session_date'])
    df = df.sort_values(['athlete_id', 'session_date'])
    
    # Group by athlete
    for athlete_id, athlete_df in df.groupby('athlete_id'):
        athlete_dfs[athlete_id] = athlete_df
        
        # Create a date range covering all sessions
        date_range = pd.date_range(
            start=athlete_df['session_date'].min(),
            end=athlete_df['session_date'].max()
        )
        
        # Create a DataFrame with all dates
        date_df = pd.DataFrame({'session_date': date_range})
        
        # Merge with athlete data to fill in missing dates
        merged = date_df.merge(athlete_df, on='session_date', how='left')
        merged['training_load'] = merged['training_load'].fillna(0)  # No training on missing days
        
        # Extract the training loads as a list
        athlete_loads[athlete_id] = merged['training_load'].tolist()
    
    return athlete_dfs, athlete_loads


def optimize_pmc_parameters(train_loads: List[float], test_loads: List[float], performance_metric: List[float]) -> Dict:
    """Optimize PMC model parameters to best fit performance data.

    Args:
        train_loads: Training set of daily training loads
        test_loads: Test set of daily training loads
        performance_metric: Actual performance metric to predict

    Returns:
        Dictionary with optimal parameters
    """
    # Parameter ranges to search
    ctl_days_range = range(30, 61, 5)  # From 30 to 60 by steps of 5
    atl_days_range = range(3, 15, 2)   # From 3 to 14 by steps of 2
    
    best_params = {}
    best_error = float('inf')
    
    # Grid search for optimal parameters
    for ctl_days in ctl_days_range:
        for atl_days in atl_days_range:
            # Train the model with these parameters
            pmc = PMCModel(ctl_days=ctl_days, atl_days=atl_days)
            train_pmc = pmc.calculate_pmc(train_loads)
            
            # Apply the model to test data
            test_pmc = pmc.calculate_pmc(test_loads)
            
            # Calculate the error (this is a simplified example - normally you'd
            # use a more sophisticated approach to validate the model)
            # Here we're assuming that CTL (fitness) should predict performance
            error = mean_squared_error(performance_metric, test_pmc['ctl'])
            
            if error < best_error:
                best_error = error
                best_params = {
                    'ctl_days': ctl_days,
                    'atl_days': atl_days,
                    'error': error
                }
    
    return best_params


def train_model(data_path: str, output_path: str):
    """Train and save a PMC model.

    Args:
        data_path: Path to the processed data file
        output_path: Path to save the trained model
    """
    # Load and prepare data
    df = load_data(data_path)
    athlete_dfs, athlete_loads = prepare_data(df)
    
    # For demonstration, we'll use default parameters
    # In a real implementation, you would optimize parameters for each athlete
    # based on their performance data
    
    # Create a model with default parameters
    pmc_model = PMCModel()
    
    # Calculate PMC metrics for each athlete
    athlete_pmc_data = {}
    for athlete_id, loads in athlete_loads.items():
        athlete_pmc_data[athlete_id] = pmc_model.calculate_pmc(loads)
    
    # Save the model and results
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'wb') as f:
        pickle.dump({
            'model': pmc_model,
            'athlete_pmc_data': athlete_pmc_data
        }, f)
    
    print(f"Model saved to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train a PMC model')
    parser.add_argument('--data_path', required=True, help='Path to the processed data file')
    parser.add_argument('--output_path', required=True, help='Path to save the trained model')
    args = parser.parse_args()
    
    train_model(args.data_path, args.output_path)
