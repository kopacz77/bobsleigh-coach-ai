"""Injury risk prediction model for athletes.

This module implements a machine learning model to predict injury risk
based on an athlete's training pattern, performance metrics, and recovery indicators.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, roc_auc_score
import joblib
from typing import Dict, List, Tuple, Optional, Union
from pathlib import Path
import os


class InjuryRiskModel:
    """Injury risk prediction model for athletes.

    This class uses a gradient boosting classifier to predict the risk of
    injury based on various athlete metrics and training patterns.

    Attributes:
        model: The trained model (Pipeline with preprocessor and classifier)
        feature_names: List of feature names used in training
    """

    def __init__(self, model_path: Optional[str] = None):
        """Initialize the injury risk model.

        Args:
            model_path: Path to a saved model file (optional)
        """
        self.model = None
        self.feature_names = None

        if model_path and os.path.exists(model_path):
            self.load_model(model_path)

    def build_model(self) -> Pipeline:
        """Build the injury risk prediction model pipeline.

        Returns:
            A scikit-learn Pipeline with preprocessing and classifier
        """
        # Create pipeline with preprocessing and classifier
        pipeline = Pipeline([
            ('scaler', StandardScaler()),
            ('classifier', GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=3,
                random_state=42
            ))
        ])

        return pipeline

    def train(self, X: pd.DataFrame, y: pd.Series, 
               cv: int = 5, optimize_hyperparams: bool = False) -> Dict:
        """Train the injury risk model.

        Args:
            X: Features DataFrame
            y: Target Series (1 for injury, 0 for no injury)
            cv: Number of cross-validation folds for hyperparameter optimization
            optimize_hyperparams: Whether to perform hyperparameter optimization

        Returns:
            Dictionary with training metrics
        """
        # Store feature names
        self.feature_names = list(X.columns)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Build the pipeline
        pipeline = self.build_model()

        # Hyperparameter optimization if requested
        if optimize_hyperparams:
            param_grid = {
                'classifier__n_estimators': [50, 100, 200],
                'classifier__learning_rate': [0.01, 0.1, 0.2],
                'classifier__max_depth': [2, 3, 4],
                'classifier__min_samples_split': [2, 5, 10],
            }
            grid = GridSearchCV(pipeline, param_grid, cv=cv, scoring='roc_auc', n_jobs=-1)
            grid.fit(X_train, y_train)
            self.model = grid.best_estimator_
            print(f"Best parameters: {grid.best_params_}")
        else:
            # Train the model
            self.model = pipeline
            self.model.fit(X_train, y_train)

        # Evaluate the model
        train_pred = self.model.predict(X_train)
        train_prob = self.model.predict_proba(X_train)[:, 1]
        train_auc = roc_auc_score(y_train, train_prob)

        test_pred = self.model.predict(X_test)
        test_prob = self.model.predict_proba(X_test)[:, 1]
        test_auc = roc_auc_score(y_test, test_prob)

        train_report = classification_report(y_train, train_pred, output_dict=True)
        test_report = classification_report(y_test, test_pred, output_dict=True)

        # Return training metrics
        return {
            'train_auc': train_auc,
            'test_auc': test_auc,
            'train_report': train_report,
            'test_report': test_report,
            'feature_names': self.feature_names,
        }

    def predict_risk(self, data: Union[pd.DataFrame, Dict]) -> Tuple[float, str, Dict]:
        """Predict injury risk for an athlete.

        Args:
            data: Athlete data (DataFrame or Dict)

        Returns:
            Tuple of (risk score, risk level, feature importances)
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded yet.")

        # Convert dict to DataFrame if needed
        if isinstance(data, dict):
            data = pd.DataFrame([data])

        # Ensure data has all the required features
        if not set(self.feature_names).issubset(set(data.columns)):
            missing = set(self.feature_names) - set(data.columns)
            raise ValueError(f"Missing features in input data: {missing}")

        # Extract relevant features in the correct order
        X = data[self.feature_names]

        # Predict probability
        risk_probability = self.model.predict_proba(X)[0, 1]  # Probability of class 1 (injury)

        # Define risk levels
        if risk_probability < 0.3:
            risk_level = "Low"
        elif risk_probability < 0.6:
            risk_level = "Medium"
        else:
            risk_level = "High"

        # Get feature importances (for explaining the prediction)
        feature_importances = {}
        if hasattr(self.model.named_steps['classifier'], 'feature_importances_'):
            importances = self.model.named_steps['classifier'].feature_importances_
            for feature, importance in zip(self.feature_names, importances):
                feature_importances[feature] = float(importance)

        return risk_probability, risk_level, feature_importances

    def analyze_risk_factors(self, data: pd.DataFrame) -> Dict:
        """Analyze risk factors for a group of athletes.

        Args:
            data: DataFrame with athlete data and injury outcomes

        Returns:
            Dictionary with risk factor analysis
        """
        if self.model is None:
            raise ValueError("Model not trained or loaded yet.")

        # Get feature importances
        importances = self.model.named_steps['classifier'].feature_importances_
        features_df = pd.DataFrame({
            'Feature': self.feature_names,
            'Importance': importances
        }).sort_values('Importance', ascending=False)

        # Analyze top risk factors
        top_factors = features_df.head(5)['Feature'].tolist()
        factor_analysis = {}

        for factor in top_factors:
            if factor in data.columns:
                # Calculate threshold values using percentiles
                threshold_high = np.percentile(data[factor], 75)
                threshold_low = np.percentile(data[factor], 25)

                # Count injuries above high threshold
                high_group = data[data[factor] >= threshold_high]
                if 'injury' in data.columns and not high_group.empty:
                    high_injury_rate = high_group['injury'].mean() * 100
                else:
                    high_injury_rate = None

                # Count injuries below low threshold
                low_group = data[data[factor] <= threshold_low]
                if 'injury' in data.columns and not low_group.empty:
                    low_injury_rate = low_group['injury'].mean() * 100
                else:
                    low_injury_rate = None

                factor_analysis[factor] = {
                    'importance': float(features_df.loc[features_df['Feature'] == factor, 'Importance'].values[0]),
                    'threshold_high': float(threshold_high),
                    'threshold_low': float(threshold_low),
                    'high_injury_rate': high_injury_rate,
                    'low_injury_rate': low_injury_rate,
                }

        return {
            'top_factors': top_factors,
            'factor_analysis': factor_analysis
        }

    def save_model(self, model_path: str) -> None:
        """Save the trained model to disk.

        Args:
            model_path: Path to save the model
        """
        if self.model is None:
            raise ValueError("No trained model to save.")

        # Ensure the directory exists
        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        # Save model with feature names
        joblib.dump({
            'model': self.model,
            'feature_names': self.feature_names
        }, model_path)

    def load_model(self, model_path: str) -> None:
        """Load a trained model from disk.

        Args:
            model_path: Path to the saved model
        """
        model_data = joblib.load(model_path)
        self.model = model_data['model']
        self.feature_names = model_data['feature_names']


def generate_sample_data(n_samples: int = 1000) -> pd.DataFrame:
    """Generate sample training data for injury prediction.

    Args:
        n_samples: Number of samples to generate

    Returns:
        DataFrame with features and injury labels
    """
    np.random.seed(42)

    # Generate features
    data = {
        'athlete_id': np.arange(1, n_samples + 1),
        'age': np.random.normal(25, 5, n_samples).clip(18, 40),
        'training_years': np.random.uniform(1, 15, n_samples),
        'avg_weekly_load': np.random.normal(70, 20, n_samples).clip(30, 150),
        'load_variability': np.random.normal(10, 5, n_samples).clip(0, 30),
        'acute_chronic_ratio': np.random.normal(1.1, 0.3, n_samples).clip(0.5, 2.0),
        'negative_tsb_days': np.random.poisson(5, n_samples).clip(0, 30),
        'sleep_quality': np.random.normal(7, 1.5, n_samples).clip(3, 10),
        'fatigue_score': np.random.normal(5, 2, n_samples).clip(0, 10),
        'strength_imbalance': np.random.normal(5, 3, n_samples).clip(0, 20),
        'previous_injuries': np.random.poisson(0.5, n_samples).clip(0, 5),
    }

    df = pd.DataFrame(data)

    # Generate injury outcome based on features
    # High ACR, high fatigue, previous injuries, and high load variability increase injury risk
    injury_prob = (
        0.05 +  # base rate
        0.1 * (df['acute_chronic_ratio'] > 1.3) +  # high ACR
        0.1 * (df['fatigue_score'] > 7) +  # high fatigue
        0.15 * (df['previous_injuries'] > 0) +  # previous injuries
        0.1 * (df['load_variability'] > 15) +  # high load variability
        0.05 * (df['negative_tsb_days'] > 10) +  # many negative TSB days
        0.05 * (df['sleep_quality'] < 5) +  # poor sleep
        0.05 * (df['strength_imbalance'] > 10)  # strength imbalance
    ).clip(0, 0.8)  # cap at 80% probability

    df['injury'] = np.random.binomial(1, injury_prob)

    return df


if __name__ == "__main__":
    # Generate sample data
    data = generate_sample_data(1000)
    print(f"Generated {len(data)} samples with {data['injury'].sum()} injuries")
    print(f"Injury rate: {data['injury'].mean() * 100:.1f}%")

    # Select features and target
    features = ['age', 'training_years', 'avg_weekly_load', 'load_variability', 
               'acute_chronic_ratio', 'negative_tsb_days', 'sleep_quality', 
               'fatigue_score', 'strength_imbalance', 'previous_injuries']
    X = data[features]
    y = data['injury']

    # Create and train model
    model = InjuryRiskModel()
    training_metrics = model.train(X, y, optimize_hyperparams=True)

    print(f"\nTraining AUC: {training_metrics['train_auc']:.3f}")
    print(f"Test AUC: {training_metrics['test_auc']:.3f}")

    # Predict for a sample athlete
    sample_athlete = {
        'age': 28,
        'training_years': 5,
        'avg_weekly_load': 90,
        'load_variability': 18,
        'acute_chronic_ratio': 1.4,
        'negative_tsb_days': 12,
        'sleep_quality': 6,
        'fatigue_score': 7.5,
        'strength_imbalance': 12,
        'previous_injuries': 1
    }

    risk_probability, risk_level, feature_importances = model.predict_risk(sample_athlete)
    print(f"\nRisk probability: {risk_probability:.2f}")
    print(f"Risk level: {risk_level}")
    print("Top contributing factors:")
    for feature, importance in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"  {feature}: {importance:.3f}")

    # Save the model
    model_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoints')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'injury_risk_model.joblib')
    model.save_model(model_path)
    print(f"\nModel saved to {model_path}")
