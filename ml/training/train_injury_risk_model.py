"""Train an injury risk prediction model.

This script trains a model to predict injury risk for athletes based on
training patterns and performance metrics.
"""

import argparse
import os
import sys
import logging
import pandas as pd
from sklearn.model_selection import train_test_split

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from models.injury_risk_model import InjuryRiskModel, generate_sample_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def load_data(data_path: str) -> pd.DataFrame:
    """Load training data from a CSV file or generate sample data.

    Args:
        data_path: Path to the data file, or 'sample' to generate data

    Returns:
        DataFrame with training data
    """
    if data_path.lower() == 'sample':
        logger.info("Generating sample data...")
        return generate_sample_data(1000)
    else:
        logger.info(f"Loading data from {data_path}...")
        return pd.read_csv(data_path)


def prepare_features(df: pd.DataFrame, label_column: str) -> tuple:
    """Prepare features and labels for training.

    Args:
        df: Input DataFrame
        label_column: Name of the column with injury labels

    Returns:
        Tuple of (features DataFrame, labels Series)
    """
    logger.info("Preparing features and labels...")

    # Check if label column exists
    if label_column not in df.columns:
        raise ValueError(f"Label column '{label_column}' not found in the data.")

    # Define features to use
    # These can be configured based on your data
    potential_features = [
        'age', 'training_years', 'avg_weekly_load', 'load_variability',
        'acute_chronic_ratio', 'tsb', 'negative_tsb_days', 'sleep_quality',
        'fatigue_score', 'soreness', 'recovery_score', 'strength_imbalance',
        'previous_injuries', 'weekly_mileage', 'intensity_score',
        'ctl', 'atl', 'ramp_rate'
    ]

    # Use available features from the potential list
    available_features = [f for f in potential_features if f in df.columns]
    logger.info(f"Using features: {available_features}")

    X = df[available_features]
    y = df[label_column]

    return X, y


def train_model(data_path: str, output_path: str, label_column: str = 'injury',
                optimize: bool = False, cv: int = 5):
    """Train and save an injury risk prediction model.

    Args:
        data_path: Path to the training data file, or 'sample' for generated data
        output_path: Path to save the trained model
        label_column: Name of the column with injury labels
        optimize: Whether to perform hyperparameter optimization
        cv: Number of cross-validation folds
    """
    try:
        # Load data
        df = load_data(data_path)
        logger.info(f"Loaded data with {len(df)} rows.")

        # Prepare features and labels
        X, y = prepare_features(df, label_column)

        # Create and train the model
        logger.info("Training injury risk model...")
        model = InjuryRiskModel()
        training_metrics = model.train(X, y, optimize_hyperparams=optimize, cv=cv)

        # Log training results
        logger.info(f"Training AUC: {training_metrics['train_auc']:.3f}")
        logger.info(f"Test AUC: {training_metrics['test_auc']:.3f}")

        # Save the model
        logger.info(f"Saving model to {output_path}...")
        model.save_model(output_path)
        logger.info("Model training complete.")

    except Exception as e:
        logger.error(f"Error training model: {e}")
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train an injury risk prediction model')
    parser.add_argument('--data_path', required=True, 
                        help='Path to the training data file, or "sample" to generate data')
    parser.add_argument('--output_path', required=True, 
                        help='Path to save the trained model')
    parser.add_argument('--label_column', default='injury',
                        help='Name of the column with injury labels (default: injury)')
    parser.add_argument('--optimize', action='store_true',
                        help='Perform hyperparameter optimization')
    parser.add_argument('--cv', type=int, default=5,
                        help='Number of cross-validation folds (default: 5)')

    args = parser.parse_args()

    logger.info("Starting injury risk model training...")
    train_model(
        data_path=args.data_path,
        output_path=args.output_path,
        label_column=args.label_column,
        optimize=args.optimize,
        cv=args.cv
    )
    logger.info("Training completed successfully.")
