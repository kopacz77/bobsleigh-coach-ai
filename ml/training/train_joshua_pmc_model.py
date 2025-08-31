"""Train PMC model using Joshua Hudson's real training data.

This script loads Joshua's 21 days of training data from Supabase and trains
a Performance Management Chart (PMC) model for fitness/fatigue prediction.
"""

import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import pickle
import json
from sklearn.model_selection import train_test_split, TimeSeriesSplit, cross_val_score
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, ElasticNet
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import logging

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.pmc_model import PMCModel
from data.joshua_data_loader import JoshuaDataLoader

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set style for plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")


class JoshuaPMCTrainer:
    """Train and evaluate PMC models using Joshua Hudson's data."""
    
    def __init__(self, data_loader: JoshuaDataLoader):
        """Initialize trainer with data loader."""
        self.data_loader = data_loader
        self.pmc_data = None
        self.models = {}
        self.results = {}
        self.scaler = StandardScaler()
        
    def load_and_prepare_data(self) -> pd.DataFrame:
        """Load Joshua's data and prepare for training."""
        logger.info("Loading Joshua Hudson's training data...")
        
        # Load comprehensive PMC dataset
        self.pmc_data = self.data_loader.create_pmc_dataset()
        
        # Display data summary
        self._display_data_summary()
        
        return self.pmc_data
    
    def _display_data_summary(self):
        """Display summary statistics of the loaded data."""
        if self.pmc_data is None:
            return
            
        print("\n" + "="*60)
        print("📊 JOSHUA HUDSON TRAINING DATA SUMMARY")
        print("="*60)
        
        print(f"📅 Training Period: {self.pmc_data['date'].min().strftime('%Y-%m-%d')} to {self.pmc_data['date'].max().strftime('%Y-%m-%d')}")
        print(f"📈 Total Days: {len(self.pmc_data)}")
        print(f"🏋️  Average Training Load: {self.pmc_data['training_load'].mean():.1f}")
        print(f"💪 CTL Range: {self.pmc_data['ctl'].min():.1f} - {self.pmc_data['ctl'].max():.1f}")
        print(f"😴 ATL Range: {self.pmc_data['atl'].min():.1f} - {self.pmc_data['atl'].max():.1f}")
        print(f"⚖️  TSB Range: {self.pmc_data['tsb'].min():.1f} - {self.pmc_data['tsb'].max():.1f}")
        print(f"🛌 Average Sleep: {self.pmc_data['sleep_hours'].mean():.1f} hours")
        print(f"📊 Average Readiness: {self.pmc_data['readiness_score'].mean():.1f}/100")
        print(f"🔥 Rest Days: {(self.pmc_data['training_load'] == 0).sum()}")
        
    def create_features_and_targets(self) -> Tuple[pd.DataFrame, Dict[str, pd.Series]]:
        """Create feature matrix and target variables for different prediction tasks.
        
        Returns:
            Tuple of (features_df, targets_dict)
        """
        if self.pmc_data is None:
            raise ValueError("Data not loaded. Call load_and_prepare_data() first.")
        
        # Feature columns (excluding targets and date)
        feature_cols = [
            'training_load', 'prev_training_load', 'prev_rpe', 'prev_readiness_score',
            'rolling_3d_load', 'rolling_3d_rpe', 'rolling_3d_sleep',
            'rolling_7d_load', 'weekly_load_std', 'training_impulse',
            'load_ramp_rate', 'recovery_ratio', 'days_since_rest',
            'rpe', 'sleep_hours', 'sleep_quality', 'stress_level'
        ]
        
        # Create features
        X = self.pmc_data[feature_cols].copy()
        
        # Handle missing values
        X = X.fillna(method='bfill').fillna(method='ffill').fillna(0)
        
        # Target variables for different prediction tasks
        targets = {
            'ctl_next_day': self.pmc_data['ctl'].shift(-1),  # Predict next day's CTL
            'atl_next_day': self.pmc_data['atl'].shift(-1),  # Predict next day's ATL
            'tsb_next_day': self.pmc_data['tsb'].shift(-1),  # Predict next day's TSB
            'readiness_next_day': self.pmc_data['readiness_score'].shift(-1),  # Predict readiness
            'fatigue_level': self.pmc_data['fatigue_level'],  # Current fatigue
            'soreness_level': self.pmc_data['soreness_level']  # Current soreness
        }
        
        # Remove last row (no next day target)
        X = X.iloc[:-1]
        for key in targets:
            targets[key] = targets[key].iloc[:-1]
        
        logger.info(f"Created feature matrix: {X.shape[0]} samples, {X.shape[1]} features")
        return X, targets
    
    def train_models(self, X: pd.DataFrame, targets: Dict[str, pd.Series]) -> Dict:
        """Train multiple ML models for different prediction tasks.
        
        Args:
            X: Feature matrix
            targets: Dictionary of target variables
            
        Returns:
            Dictionary with trained models and evaluation results
        """
        results = {}
        
        # Define models to train
        model_configs = {
            'linear_regression': LinearRegression(),
            'ridge_regression': Ridge(alpha=1.0),
            'elastic_net': ElasticNet(alpha=0.1, l1_ratio=0.5),
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'svr': SVR(kernel='rbf', C=1.0)
        }
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        X_scaled_df = pd.DataFrame(X_scaled, columns=X.columns, index=X.index)
        
        print("\n" + "="*60)
        print("🤖 TRAINING ML MODELS")
        print("="*60)
        
        for target_name, y in targets.items():
            if y.isna().all():
                continue
                
            print(f"\n🎯 Training models for: {target_name}")
            results[target_name] = {}
            
            # Remove NaN values
            mask = ~(y.isna() | X_scaled_df.isna().any(axis=1))
            X_clean = X_scaled_df[mask]
            y_clean = y[mask]
            
            if len(X_clean) < 10:  # Need minimum samples
                logger.warning(f"Not enough samples for {target_name}: {len(X_clean)}")
                continue
            
            # Time series split for validation
            tscv = TimeSeriesSplit(n_splits=3)
            
            for model_name, model in model_configs.items():
                try:
                    # Cross-validation scores
                    cv_scores = cross_val_score(model, X_clean, y_clean, cv=tscv, scoring='neg_mean_squared_error')
                    cv_rmse = np.sqrt(-cv_scores.mean())
                    
                    # Train on full dataset
                    model.fit(X_clean, y_clean)
                    
                    # Predictions
                    y_pred = model.predict(X_clean)
                    
                    # Metrics
                    rmse = np.sqrt(mean_squared_error(y_clean, y_pred))
                    mae = mean_absolute_error(y_clean, y_pred)
                    r2 = r2_score(y_clean, y_pred)
                    
                    results[target_name][model_name] = {
                        'model': model,
                        'cv_rmse': cv_rmse,
                        'rmse': rmse,
                        'mae': mae,
                        'r2': r2,
                        'predictions': y_pred,
                        'actual': y_clean.values
                    }
                    
                    print(f"   {model_name:20s} | RMSE: {rmse:.3f} | MAE: {mae:.3f} | R²: {r2:.3f}")
                    
                except Exception as e:
                    logger.warning(f"Failed training {model_name} for {target_name}: {e}")
        
        self.results = results
        return results
    
    def evaluate_traditional_pmc(self) -> Dict:
        """Evaluate traditional PMC model against Joshua's actual data.
        
        Returns:
            Dictionary with traditional PMC evaluation results
        """
        print("\n" + "="*60)
        print("📈 EVALUATING TRADITIONAL PMC MODEL")
        print("="*60)
        
        # Initialize traditional PMC model
        pmc_model = PMCModel(ctl_days=42, atl_days=7)
        
        # Calculate PMC using training loads
        training_loads = self.pmc_data['training_load'].tolist()
        pmc_calculated = pmc_model.calculate_pmc(training_loads)
        
        # Compare with actual recorded CTL, ATL, TSB
        actual_ctl = self.pmc_data['ctl'].values
        actual_atl = self.pmc_data['atl'].values  
        actual_tsb = self.pmc_data['tsb'].values
        
        predicted_ctl = np.array(pmc_calculated['ctl'])
        predicted_atl = np.array(pmc_calculated['atl'])
        predicted_tsb = np.array(pmc_calculated['tsb'])
        
        # Calculate metrics
        ctl_rmse = np.sqrt(mean_squared_error(actual_ctl, predicted_ctl))
        atl_rmse = np.sqrt(mean_squared_error(actual_atl, predicted_atl))
        tsb_rmse = np.sqrt(mean_squared_error(actual_tsb, predicted_tsb))
        
        ctl_r2 = r2_score(actual_ctl, predicted_ctl)
        atl_r2 = r2_score(actual_atl, predicted_atl)
        tsb_r2 = r2_score(actual_tsb, predicted_tsb)
        
        traditional_results = {
            'ctl': {'rmse': ctl_rmse, 'r2': ctl_r2, 'predicted': predicted_ctl, 'actual': actual_ctl},
            'atl': {'rmse': atl_rmse, 'r2': atl_r2, 'predicted': predicted_atl, 'actual': actual_atl},
            'tsb': {'rmse': tsb_rmse, 'r2': tsb_r2, 'predicted': predicted_tsb, 'actual': actual_tsb}
        }
        
        print(f"📊 CTL Prediction  | RMSE: {ctl_rmse:.3f} | R²: {ctl_r2:.3f}")
        print(f"📊 ATL Prediction  | RMSE: {atl_rmse:.3f} | R²: {atl_r2:.3f}")
        print(f"📊 TSB Prediction  | RMSE: {tsb_rmse:.3f} | R²: {tsb_r2:.3f}")
        
        return traditional_results
    
    def create_visualizations(self, save_dir: str = "ml/outputs"):
        """Create comprehensive visualizations of Joshua's data and model results."""
        os.makedirs(save_dir, exist_ok=True)
        
        print(f"\n📊 Creating visualizations in {save_dir}/...")
        
        # 1. Training Load Time Series
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle("Joshua Hudson - Training Load Analysis", fontsize=16)
        
        # Training load over time
        axes[0,0].plot(self.pmc_data['date'], self.pmc_data['training_load'], 'o-', linewidth=2)
        axes[0,0].set_title('Daily Training Load')
        axes[0,0].set_ylabel('Training Load')
        axes[0,0].grid(True, alpha=0.3)
        
        # PMC Chart (CTL, ATL, TSB)
        axes[0,1].plot(self.pmc_data['date'], self.pmc_data['ctl'], label='CTL (Fitness)', linewidth=2)
        axes[0,1].plot(self.pmc_data['date'], self.pmc_data['atl'], label='ATL (Fatigue)', linewidth=2)
        axes[0,1].plot(self.pmc_data['date'], self.pmc_data['tsb'], label='TSB (Form)', linewidth=2)
        axes[0,1].set_title('Performance Management Chart')
        axes[0,1].set_ylabel('PMC Values')
        axes[0,1].legend()
        axes[0,1].grid(True, alpha=0.3)
        
        # Readiness vs Training Load
        axes[1,0].scatter(self.pmc_data['training_load'], self.pmc_data['readiness_score'], alpha=0.7)
        axes[1,0].set_xlabel('Training Load')
        axes[1,0].set_ylabel('Readiness Score')
        axes[1,0].set_title('Readiness vs Training Load')
        axes[1,0].grid(True, alpha=0.3)
        
        # Sleep and Recovery
        ax2 = axes[1,1].twinx()
        axes[1,1].bar(self.pmc_data['date'], self.pmc_data['sleep_hours'], alpha=0.6, label='Sleep Hours')
        ax2.plot(self.pmc_data['date'], self.pmc_data['stress_level'], 'r-', label='Stress Level')
        axes[1,1].set_title('Sleep vs Stress')
        axes[1,1].set_ylabel('Sleep (hours)')
        ax2.set_ylabel('Stress Level')
        axes[1,1].legend(loc='upper left')
        ax2.legend(loc='upper right')
        
        plt.tight_layout()
        plt.savefig(f"{save_dir}/joshua_training_analysis.png", dpi=300, bbox_inches='tight')
        
        # 2. Model Performance Comparison
        if self.results:
            self._plot_model_performance(save_dir)
        
        # 3. Feature Importance (if Random Forest available)
        self._plot_feature_importance(save_dir)
        
        print("✅ Visualizations saved!")
    
    def _plot_model_performance(self, save_dir: str):
        """Plot model performance comparison."""
        fig, axes = plt.subplots(2, 3, figsize=(18, 10))
        fig.suptitle("ML Model Performance Comparison", fontsize=16)
        
        target_names = list(self.results.keys())[:6]  # First 6 targets
        
        for i, target_name in enumerate(target_names):
            ax = axes[i//3, i%3]
            
            if target_name not in self.results:
                continue
                
            models = self.results[target_name]
            model_names = list(models.keys())
            r2_scores = [models[name]['r2'] for name in model_names]
            
            bars = ax.bar(model_names, r2_scores)
            ax.set_title(f'{target_name.replace("_", " ").title()}')
            ax.set_ylabel('R² Score')
            ax.tick_params(axis='x', rotation=45)
            
            # Color bars based on performance
            for bar, score in zip(bars, r2_scores):
                if score > 0.8:
                    bar.set_color('green')
                elif score > 0.6:
                    bar.set_color('orange')
                else:
                    bar.set_color('red')
        
        plt.tight_layout()
        plt.savefig(f"{save_dir}/model_performance_comparison.png", dpi=300, bbox_inches='tight')
    
    def _plot_feature_importance(self, save_dir: str):
        """Plot feature importance from Random Forest models."""
        # Find a Random Forest model with good performance
        rf_model = None
        target_name = None
        
        for tname, models in self.results.items():
            if 'random_forest' in models and models['random_forest']['r2'] > 0.5:
                rf_model = models['random_forest']['model']
                target_name = tname
                break
        
        if rf_model is None:
            return
        
        # Get feature importance
        feature_names = self.pmc_data.select_dtypes(include=[np.number]).columns.tolist()
        feature_names = [col for col in feature_names if col not in ['ctl', 'atl', 'tsb']][:rf_model.n_features_in_]
        
        importances = rf_model.feature_importances_
        indices = np.argsort(importances)[::-1][:10]  # Top 10 features
        
        plt.figure(figsize=(12, 6))
        plt.title(f'Top 10 Feature Importance - {target_name.replace("_", " ").title()}')
        plt.bar(range(len(indices)), importances[indices])
        plt.xticks(range(len(indices)), [feature_names[i] for i in indices], rotation=45)
        plt.ylabel('Feature Importance')
        plt.tight_layout()
        plt.savefig(f"{save_dir}/feature_importance.png", dpi=300, bbox_inches='tight')
    
    def save_models(self, save_dir: str = "ml/models/checkpoints"):
        """Save trained models to disk."""
        os.makedirs(save_dir, exist_ok=True)
        
        # Save best performing models for each target
        for target_name, models in self.results.items():
            if not models:
                continue
                
            # Find best model based on R² score
            best_model_name = max(models.keys(), key=lambda k: models[k]['r2'])
            best_model = models[best_model_name]['model']
            
            # Save model
            model_path = f"{save_dir}/joshua_{target_name}_{best_model_name}.pkl"
            with open(model_path, 'wb') as f:
                pickle.dump(best_model, f)
                
            print(f"💾 Saved {best_model_name} for {target_name} (R²: {models[best_model_name]['r2']:.3f})")
        
        # Save scaler
        scaler_path = f"{save_dir}/joshua_feature_scaler.pkl"
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save training summary
        summary_path = f"{save_dir}/joshua_training_summary.json"
        summary = {
            'training_date': datetime.now().isoformat(),
            'data_period': {
                'start': self.pmc_data['date'].min().isoformat(),
                'end': self.pmc_data['date'].max().isoformat(),
                'total_days': len(self.pmc_data)
            },
            'model_performance': {
                target: {model: {'r2': results['r2'], 'rmse': results['rmse']} 
                        for model, results in models.items()}
                for target, models in self.results.items()
            }
        }
        
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"📊 Training summary saved to {summary_path}")


def main():
    """Main training pipeline for Joshua's PMC model."""
    print("🚀 Starting Joshua Hudson PMC Model Training")
    print("="*60)
    
    # Check environment variables
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_ANON_KEY'):
        print("❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
        return
    
    try:
        # Initialize data loader and trainer
        data_loader = JoshuaDataLoader()
        trainer = JoshuaPMCTrainer(data_loader)
        
        # Load and prepare data
        pmc_data = trainer.load_and_prepare_data()
        
        # Create features and targets
        X, targets = trainer.create_features_and_targets()
        
        # Train ML models
        results = trainer.train_models(X, targets)
        
        # Evaluate traditional PMC model
        traditional_results = trainer.evaluate_traditional_pmc()
        
        # Create visualizations
        trainer.create_visualizations()
        
        # Save models
        trainer.save_models()
        
        print("\n" + "="*60)
        print("🎉 TRAINING COMPLETE!")
        print("="*60)
        print("✅ Joshua Hudson's PMC models trained successfully")
        print("✅ Models saved to ml/models/checkpoints/")
        print("✅ Visualizations saved to ml/outputs/")
        print("🎯 Ready for performance prediction and training optimization!")
        
        return trainer, results
        
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise


if __name__ == "__main__":
    trainer, results = main()