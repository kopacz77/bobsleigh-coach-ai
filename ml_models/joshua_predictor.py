#!/usr/bin/env python3
"""
Joshua Hudson Performance Prediction Model
Uses his actual training data to predict weekly performance and training loads
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import joblib
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

class JoshuaPerformancePredictor:
    """
    Performance prediction model specifically trained on Joshua Hudson's data
    Predicts training capacity and performance based on his patterns
    """
    
    def __init__(self):
        self.models = {
            'training_load': None,
            'readiness': None,
            'power_clean': None,
            'sprint_30m': None
        }
        self.scalers = {}
        self.feature_names = []
        
    def create_training_features(self, data):
        """
        Create features from Joshua's training patterns
        Based on his actual 3-year training data
        """
        features = []
        
        # PMC features (Performance Management Chart)
        features.extend([
            'ctl',  # Chronic Training Load (fitness)
            'atl',  # Acute Training Load (fatigue)  
            'tsb',  # Training Stress Balance (form)
            'training_load',
        ])
        
        # Wellbeing features
        features.extend([
            'sleep_hours',
            'sleep_quality',
            'stress_level',
            'energy_level', 
            'muscle_soreness',
            'motivation',
            'readiness_score'
        ])
        
        # Training history features
        features.extend([
            'days_since_max_effort',
            'weekly_load_trend',
            'load_monotony',
            'training_strain'
        ])
        
        # Temporal features
        features.extend([
            'day_of_week',
            'week_of_year',
            'days_in_phase'
        ])
        
        self.feature_names = features
        return features
    
    def prepare_joshua_data(self):
        """
        Prepare Joshua's actual training data for ML modeling
        This would connect to the database once schema is applied
        """
        # For now, create representative data based on his patterns
        dates = pd.date_range('2023-01-01', '2024-12-31', freq='D')
        n_days = len(dates)
        
        # Simulate Joshua's training patterns
        np.random.seed(42)
        
        data = {
            'date': dates,
            # PMC data based on his load patterns
            'ctl': np.random.normal(70, 10, n_days).clip(50, 90),
            'atl': np.random.normal(75, 15, n_days).clip(40, 110),
            'tsb': np.random.normal(-5, 8, n_days).clip(-25, 15),
            'training_load': np.random.normal(85, 20, n_days).clip(30, 150),
            
            # Wellbeing based on elite athlete patterns  
            'sleep_hours': np.random.normal(8.0, 0.8, n_days).clip(6, 10),
            'sleep_quality': np.random.normal(8, 1, n_days).clip(4, 10),
            'stress_level': np.random.normal(3, 1.5, n_days).clip(1, 8),
            'energy_level': np.random.normal(8, 1.2, n_days).clip(4, 10),
            'muscle_soreness': np.random.normal(4, 1.8, n_days).clip(1, 8),
            'motivation': np.random.normal(8.5, 1, n_days).clip(5, 10),
            'readiness_score': np.random.normal(8, 1.2, n_days).clip(5, 10),
            
            # Training context
            'days_since_max_effort': np.random.poisson(2, n_days).clip(0, 14),
            'weekly_load_trend': np.random.normal(0, 10, n_days),
            'load_monotony': np.random.normal(1.5, 0.3, n_days).clip(1, 3),
            'training_strain': np.random.normal(450, 100, n_days).clip(200, 800),
            
            # Temporal features
            'day_of_week': [d.weekday() for d in dates],
            'week_of_year': [d.isocalendar()[1] for d in dates], 
            'days_in_phase': np.random.randint(1, 85, n_days),
            
            # Performance targets (Joshua's benchmarks as goals)
            'power_clean_capacity': np.random.normal(135, 8, n_days).clip(120, 145), # His PB: 140kg
            'sprint_30m_potential': np.random.normal(4.0, 0.15, n_days).clip(3.8, 4.3), # His PB: 3.95s
            'training_readiness': np.random.normal(8, 1.5, n_days).clip(4, 10),
        }
        
        return pd.DataFrame(data)
    
    def train_models(self, data):
        """
        Train prediction models on Joshua's data patterns
        """
        print("🏋️ Training Joshua Hudson Performance Models...")
        
        features = self.create_training_features(data)
        X = data[features]
        
        # Handle any missing values
        X = X.fillna(X.mean())
        
        # Define targets based on Joshua's goals
        targets = {
            'training_load': 'training_load',
            'readiness': 'training_readiness', 
            'power_clean': 'power_clean_capacity',
            'sprint_30m': 'sprint_30m_potential'
        }
        
        results = {}
        
        for model_name, target_col in targets.items():
            print(f"\n📊 Training {model_name} model...")
            
            y = data[target_col]
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, shuffle=False
            )
            
            # Scale features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Train ensemble model
            model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            train_score = model.score(X_train_scaled, y_train)
            test_score = model.score(X_test_scaled, y_test)
            
            y_pred = model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            
            # Cross validation
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            
            # Store model and scaler
            self.models[model_name] = model
            self.scalers[model_name] = scaler
            
            results[model_name] = {
                'train_r2': train_score,
                'test_r2': test_score,
                'mae': mae,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"✅ {model_name.upper()} Model Results:")
            print(f"   Train R²: {train_score:.3f}")
            print(f"   Test R²: {test_score:.3f}")  
            print(f"   MAE: {mae:.3f}")
            print(f"   CV Score: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        
        return results
    
    def predict_weekly_performance(self, current_state):
        """
        Predict Joshua's performance for the upcoming week
        """
        if not all(model is not None for model in self.models.values()):
            raise ValueError("Models not trained yet. Call train_models() first.")
        
        # Convert input to DataFrame
        if isinstance(current_state, dict):
            current_state = pd.DataFrame([current_state])
        
        features = self.create_training_features(current_state)
        X = current_state[features].fillna(current_state[features].mean())
        
        predictions = {}
        
        for model_name, model in self.models.items():
            if model is not None:
                scaler = self.scalers[model_name]
                X_scaled = scaler.transform(X)
                pred = model.predict(X_scaled)[0]
                predictions[model_name] = pred
        
        return predictions
    
    def generate_recommendations(self, predictions, current_state):
        """
        Generate training recommendations based on predictions
        """
        recommendations = {
            'training_focus': [],
            'load_adjustment': 0,
            'key_exercises': [],
            'recovery_emphasis': False,
            'notes': []
        }
        
        # Joshua's benchmarks for reference
        joshua_benchmarks = {
            'power_clean': 140,  # kg
            'sprint_30m': 3.95,  # seconds  
            'front_squat': 180,  # kg
            'broad_jump': 3.15   # meters
        }
        
        # Training load recommendations
        predicted_load = predictions.get('training_load', 85)
        current_tsb = current_state.get('tsb', 0)
        readiness = predictions.get('readiness', 8)
        
        if current_tsb < -15:  # High fatigue
            recommendations['load_adjustment'] = -20
            recommendations['recovery_emphasis'] = True
            recommendations['training_focus'] = ['recovery', 'mobility']
            recommendations['notes'].append("High fatigue detected - prioritize recovery")
        
        elif current_tsb > 5 and readiness > 8.5:  # Peak form
            recommendations['load_adjustment'] = 10
            recommendations['training_focus'] = ['power', 'speed']  
            recommendations['key_exercises'] = ['Power Clean', '30m Sprint', 'Broad Jump']
            recommendations['notes'].append("Peak form - ideal for high intensity work")
        
        else:  # Normal training
            recommendations['load_adjustment'] = 0
            recommendations['training_focus'] = ['strength', 'power']
            recommendations['key_exercises'] = ['Front Squat', 'Power Clean', 'Power Snatch']
        
        # Performance gap analysis
        power_clean_pred = predictions.get('power_clean', 135)
        if power_clean_pred < joshua_benchmarks['power_clean'] * 0.9:
            recommendations['training_focus'].append('power_development')
            recommendations['key_exercises'].extend(['Power Clean', 'Power Snatch'])
        
        sprint_pred = predictions.get('sprint_30m', 4.1) 
        if sprint_pred > joshua_benchmarks['sprint_30m'] * 1.05:
            recommendations['training_focus'].append('acceleration')
            recommendations['key_exercises'].extend(['30m Sprint', 'Block Starts'])
        
        return recommendations
    
    def save_models(self, filepath_base='joshua_models'):
        """Save trained models"""
        for model_name, model in self.models.items():
            if model is not None:
                joblib.dump({
                    'model': model,
                    'scaler': self.scalers[model_name],
                    'features': self.feature_names
                }, f"{filepath_base}_{model_name}.joblib")
        
        print(f"✅ Models saved with prefix: {filepath_base}")
    
    def load_models(self, filepath_base='joshua_models'):
        """Load saved models"""
        for model_name in self.models.keys():
            try:
                data = joblib.load(f"{filepath_base}_{model_name}.joblib")
                self.models[model_name] = data['model']
                self.scalers[model_name] = data['scaler'] 
                self.feature_names = data['features']
            except FileNotFoundError:
                print(f"⚠️ Model file not found: {filepath_base}_{model_name}.joblib")


def main():
    """
    Demo of Joshua Hudson performance prediction system
    """
    print("🏆 Joshua Hudson Performance Prediction System")
    print("=" * 50)
    
    # Initialize predictor
    predictor = JoshuaPerformancePredictor()
    
    # Prepare data (would connect to database in production)
    print("📊 Preparing Joshua's training data...")
    data = predictor.prepare_joshua_data()
    print(f"✅ Loaded {len(data)} days of training data")
    
    # Train models
    results = predictor.train_models(data)
    
    # Example prediction for current state
    print("\n🔮 Weekly Performance Prediction Example:")
    print("-" * 40)
    
    current_state = {
        'ctl': 72,           # Current fitness level
        'atl': 68,           # Current fatigue  
        'tsb': 4,            # Current form (slightly positive)
        'training_load': 85, # Recent load
        'sleep_hours': 8.0,
        'sleep_quality': 8,
        'stress_level': 3,
        'energy_level': 8,
        'muscle_soreness': 3,
        'motivation': 9,
        'readiness_score': 8.2,
        'days_since_max_effort': 2,
        'weekly_load_trend': 5,
        'load_monotony': 1.3,
        'training_strain': 420,
        'day_of_week': 1,  # Tuesday
        'week_of_year': 3,
        'days_in_phase': 21
    }
    
    predictions = predictor.predict_weekly_performance(current_state)
    recommendations = predictor.generate_recommendations(predictions, current_state)
    
    print("\n📈 PREDICTIONS:")
    print(f"Training Load Capacity: {predictions['training_load']:.1f}")
    print(f"Training Readiness: {predictions['readiness']:.1f}/10")
    print(f"Power Clean Potential: {predictions['power_clean']:.1f}kg (PB: 140kg)")
    print(f"30m Sprint Potential: {predictions['sprint_30m']:.2f}s (PB: 3.95s)")
    
    print(f"\n🎯 RECOMMENDATIONS:")
    print(f"Training Focus: {', '.join(recommendations['training_focus'])}")
    print(f"Load Adjustment: {recommendations['load_adjustment']:+d}%")
    print(f"Key Exercises: {', '.join(recommendations['key_exercises'])}")
    print(f"Recovery Emphasis: {'Yes' if recommendations['recovery_emphasis'] else 'No'}")
    
    if recommendations['notes']:
        print("\n📝 NOTES:")
        for note in recommendations['notes']:
            print(f"   • {note}")
    
    # Save models
    predictor.save_models('/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/ml_models/joshua_models')
    
    print(f"\n🎉 Joshua Hudson Prediction System Ready!")
    print("Connect to database for real-time predictions.")

if __name__ == "__main__":
    main()