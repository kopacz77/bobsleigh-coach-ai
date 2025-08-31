"""Training Recommendation Engine for Joshua Hudson.

This module uses the trained PMC models to generate personalized training
recommendations based on Joshua's current fitness/fatigue state.
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class JoshuaRecommendationEngine:
    """Generate training recommendations for Joshua Hudson based on PMC models."""
    
    def __init__(self, models_dir: str = "ml/models/checkpoints"):
        """Initialize recommendation engine with trained models.
        
        Args:
            models_dir: Directory containing saved models
        """
        self.models_dir = models_dir
        self.models = {}
        self.scaler = None
        self.load_models()
        
        # Joshua's exercise preferences and capabilities
        self.joshua_exercises = {
            'power': ['Power Clean', 'Power Snatch', 'Olympic lifts focus'],
            'strength': ['Front Squat', 'Back Squat', 'Romanian Deadlift'],
            'speed': ['30m Sprint', '100m Sprint', 'Sprint acceleration work'],
            'jumps': ['Broad Jump', 'Triple Broad Jump', 'Box Jump'],
            'recovery': ['Active recovery', 'Mobility work', 'Light movement']
        }
        
        # Joshua's performance benchmarks for load calculation
        self.joshua_benchmarks = {
            'power_clean_1rm': 140,  # kg
            'front_squat_1rm': 180,  # kg
            'back_squat_1rm': 220,   # kg
            '30m_sprint_pb': 3.95,   # seconds
            'broad_jump_pb': 3.15    # meters
        }
    
    def load_models(self):
        """Load trained models and scaler from disk."""
        if not os.path.exists(self.models_dir):
            logger.warning(f"Models directory not found: {self.models_dir}")
            return
        
        # Load scaler
        scaler_path = os.path.join(self.models_dir, "joshua_feature_scaler.pkl")
        if os.path.exists(scaler_path):
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
        
        # Load models
        for file in os.listdir(self.models_dir):
            if file.startswith("joshua_") and file.endswith(".pkl") and "scaler" not in file:
                model_path = os.path.join(self.models_dir, file)
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
                    
                # Extract target and model type from filename
                parts = file.replace("joshua_", "").replace(".pkl", "").split("_")
                if len(parts) >= 2:
                    target = "_".join(parts[:-1])
                    model_type = parts[-1]
                    
                    if target not in self.models:
                        self.models[target] = {}
                    self.models[target][model_type] = model
        
        logger.info(f"Loaded {len(self.models)} model categories")
    
    def predict_next_day_state(self, current_features: Dict) -> Dict:
        """Predict Joshua's fitness/fatigue state for next day.
        
        Args:
            current_features: Dictionary with current training/wellness features
            
        Returns:
            Dictionary with predicted CTL, ATL, TSB, readiness
        """
        if not self.models or not self.scaler:
            raise ValueError("Models not loaded. Train models first.")
        
        # Convert features to array format expected by models
        feature_array = self._features_to_array(current_features)
        
        predictions = {}
        
        # Predict key metrics
        for target in ['ctl_next_day', 'atl_next_day', 'tsb_next_day', 'readiness_next_day']:
            if target in self.models:
                # Use best performing model for each target
                model_name = list(self.models[target].keys())[0]  # First available model
                model = self.models[target][model_name]
                
                try:
                    pred = model.predict([feature_array])[0]
                    predictions[target.replace('_next_day', '')] = pred
                except Exception as e:
                    logger.warning(f"Prediction failed for {target}: {e}")
                    predictions[target.replace('_next_day', '')] = 0.0
        
        return predictions
    
    def _features_to_array(self, features: Dict) -> np.ndarray:
        """Convert feature dictionary to array format for model prediction."""
        # Expected feature order (based on training)
        feature_order = [
            'training_load', 'prev_training_load', 'prev_rpe', 'prev_readiness_score',
            'rolling_3d_load', 'rolling_3d_rpe', 'rolling_3d_sleep',
            'rolling_7d_load', 'weekly_load_std', 'training_impulse',
            'load_ramp_rate', 'recovery_ratio', 'days_since_rest',
            'rpe', 'sleep_hours', 'sleep_quality', 'stress_level'
        ]
        
        # Create array with default values
        feature_array = np.zeros(len(feature_order))
        
        for i, feature_name in enumerate(feature_order):
            if feature_name in features:
                feature_array[i] = features[feature_name]
        
        # Scale features if scaler available
        if self.scaler:
            feature_array = self.scaler.transform([feature_array])[0]
        
        return feature_array
    
    def generate_recommendation(self, current_state: Dict, target_date: str = None) -> Dict:
        """Generate training recommendation for Joshua based on current state.
        
        Args:
            current_state: Current training/wellness state
            target_date: Target date for recommendation (defaults to tomorrow)
            
        Returns:
            Dictionary with training recommendation
        """
        if target_date is None:
            target_date = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        # Predict next day state
        predicted_state = self.predict_next_day_state(current_state)
        
        # Extract key metrics
        predicted_ctl = predicted_state.get('ctl', 70)
        predicted_atl = predicted_state.get('atl', 70)
        predicted_tsb = predicted_state.get('tsb', 0)
        predicted_readiness = predicted_state.get('readiness', 75)
        
        # Calculate current load trends
        current_load = current_state.get('training_load', 0)
        rolling_7d_load = current_state.get('rolling_7d_load', current_load)
        days_since_rest = current_state.get('days_since_rest', 0)
        stress_level = current_state.get('stress_level', 5)
        sleep_quality = current_state.get('sleep_quality', 7)
        
        # Decision logic for training recommendation
        recommendation = self._create_training_recommendation(
            predicted_ctl, predicted_atl, predicted_tsb, predicted_readiness,
            current_load, rolling_7d_load, days_since_rest, stress_level, sleep_quality
        )
        
        # Add prediction context
        recommendation['predicted_state'] = predicted_state
        recommendation['current_metrics'] = {
            'current_load': current_load,
            'days_since_rest': days_since_rest,
            'stress_level': stress_level,
            'sleep_quality': sleep_quality
        }
        recommendation['target_date'] = target_date
        recommendation['confidence'] = self._calculate_confidence(current_state)
        
        return recommendation
    
    def _create_training_recommendation(self, ctl: float, atl: float, tsb: float, 
                                      readiness: float, current_load: float,
                                      rolling_7d_load: float, days_since_rest: int,
                                      stress_level: float, sleep_quality: float) -> Dict:
        """Create training recommendation based on PMC and wellness metrics."""
        
        # Base recommendation structure
        recommendation = {
            'workout_type': 'strength',
            'focus_area': 'power',
            'intensity_level': 7,
            'duration_minutes': 90,
            'recommended_load': 85,
            'exercises': [],
            'coaching_notes': '',
            'rationale': []
        }
        
        # Decision tree based on Joshua's training patterns
        
        # High fatigue (negative TSB, high ATL) -> Recovery or light work
        if tsb < -5 or atl > 80 or readiness < 70:
            recommendation.update({
                'workout_type': 'recovery',
                'focus_area': 'recovery',
                'intensity_level': 3,
                'duration_minutes': 45,
                'recommended_load': 20,
                'exercises': self.joshua_exercises['recovery'],
                'coaching_notes': 'Focus on recovery and restoration',
                'rationale': ['High fatigue detected', 'Low readiness score', 'Recovery prioritized']
            })
        
        # Fresh and ready (positive TSB, good readiness) -> High intensity
        elif tsb > 2 and readiness > 85 and days_since_rest <= 1:
            if rolling_7d_load < 70:  # Low recent load -> Power work
                recommendation.update({
                    'workout_type': 'power',
                    'focus_area': 'power',
                    'intensity_level': 9,
                    'duration_minutes': 85,
                    'recommended_load': 100,
                    'exercises': self.joshua_exercises['power'] + self.joshua_exercises['jumps'],
                    'coaching_notes': 'Peak power development - Joshua ready for high intensity',
                    'rationale': ['Positive form (TSB)', 'High readiness', 'Low recent load']
                })
            else:  # Higher recent load -> Speed work
                recommendation.update({
                    'workout_type': 'speed',
                    'focus_area': 'speed',
                    'intensity_level': 9,
                    'duration_minutes': 60,
                    'recommended_load': 95,
                    'exercises': self.joshua_exercises['speed'],
                    'coaching_notes': 'Speed development - capitalize on freshness',
                    'rationale': ['Positive form (TSB)', 'High readiness', 'Speed focus optimal']
                })
        
        # Building phase (moderate TSB, good readiness) -> Strength work
        elif -2 <= tsb <= 2 and readiness >= 75:
            recommendation.update({
                'workout_type': 'strength',
                'focus_area': 'strength',
                'intensity_level': 8,
                'duration_minutes': 90,
                'recommended_load': 85,
                'exercises': self.joshua_exercises['strength'],
                'coaching_notes': 'Strength development - building phase',
                'rationale': ['Balanced form (TSB)', 'Good readiness', 'Strength building optimal']
            })
        
        # Moderate fatigue -> Power maintenance
        elif -5 <= tsb < -2 and readiness >= 70:
            recommendation.update({
                'workout_type': 'power',
                'focus_area': 'power',
                'intensity_level': 6,
                'duration_minutes': 75,
                'recommended_load': 70,
                'exercises': self.joshua_exercises['power'][:2],  # Fewer exercises
                'coaching_notes': 'Power maintenance - reduced volume',
                'rationale': ['Moderate fatigue', 'Maintaining power qualities', 'Reduced volume']
            })
        
        # Need rest day
        elif days_since_rest > 5 or current_load == 0:
            recommendation.update({
                'workout_type': 'rest',
                'focus_area': 'recovery',
                'intensity_level': 1,
                'duration_minutes': 0,
                'recommended_load': 0,
                'exercises': ['Complete rest'],
                'coaching_notes': 'Complete rest day - adaptation and recovery',
                'rationale': ['Extended training period', 'Rest needed for adaptation']
            })
        
        # Adjust for external factors
        if stress_level > 7:
            recommendation['intensity_level'] = max(1, recommendation['intensity_level'] - 2)
            recommendation['rationale'].append('Reduced intensity due to high stress')
        
        if sleep_quality < 6:
            recommendation['intensity_level'] = max(1, recommendation['intensity_level'] - 1)
            recommendation['rationale'].append('Reduced intensity due to poor sleep')
        
        return recommendation
    
    def _calculate_confidence(self, current_state: Dict) -> float:
        """Calculate confidence in recommendation based on data quality."""
        confidence = 1.0
        
        # Reduce confidence for missing data
        required_features = ['training_load', 'readiness_score', 'sleep_hours', 'stress_level']
        missing_features = sum(1 for f in required_features if f not in current_state)
        confidence -= (missing_features * 0.1)
        
        # Reduce confidence for extreme values
        readiness = current_state.get('readiness_score', 75)
        if readiness < 50 or readiness > 95:
            confidence -= 0.1
        
        return max(0.5, confidence)  # Minimum 50% confidence
    
    def create_weekly_plan(self, current_state: Dict, days_ahead: int = 7) -> List[Dict]:
        """Create a weekly training plan for Joshua.
        
        Args:
            current_state: Current training/wellness state
            days_ahead: Number of days to plan ahead
            
        Returns:
            List of daily training recommendations
        """
        weekly_plan = []
        state = current_state.copy()
        
        for day in range(days_ahead):
            target_date = (datetime.now() + timedelta(days=day+1)).strftime('%Y-%m-%d')
            
            # Generate recommendation for this day
            recommendation = self.generate_recommendation(state, target_date)
            weekly_plan.append(recommendation)
            
            # Update state for next day prediction (simplified simulation)
            recommended_load = recommendation['recommended_load']
            state['training_load'] = recommended_load
            state['prev_training_load'] = state.get('training_load', 0)
            
            # Simulate fatigue accumulation
            if recommended_load > 0:
                state['days_since_rest'] = state.get('days_since_rest', 0) + 1
            else:
                state['days_since_rest'] = 0
        
        return weekly_plan
    
    def evaluate_recommendation_effectiveness(self, recommendations: List[Dict], 
                                           actual_outcomes: List[Dict]) -> Dict:
        """Evaluate how effective recommendations were based on actual outcomes.
        
        Args:
            recommendations: List of past recommendations
            actual_outcomes: List of actual training outcomes
            
        Returns:
            Dictionary with effectiveness metrics
        """
        if len(recommendations) != len(actual_outcomes):
            raise ValueError("Recommendations and outcomes must have same length")
        
        accuracy_metrics = {
            'load_prediction_error': [],
            'readiness_prediction_error': [],
            'recommendation_followed': [],
            'perceived_effectiveness': []
        }
        
        for rec, outcome in zip(recommendations, actual_outcomes):
            # Load prediction accuracy
            predicted_load = rec['recommended_load']
            actual_load = outcome.get('actual_load', 0)
            load_error = abs(predicted_load - actual_load) / max(predicted_load, 1)
            accuracy_metrics['load_prediction_error'].append(load_error)
            
            # Readiness prediction accuracy
            predicted_readiness = rec['predicted_state'].get('readiness', 75)
            actual_readiness = outcome.get('actual_readiness', 75)
            readiness_error = abs(predicted_readiness - actual_readiness) / 100
            accuracy_metrics['readiness_prediction_error'].append(readiness_error)
            
            # Was recommendation followed?
            rec_type = rec['workout_type']
            actual_type = outcome.get('actual_workout_type', 'unknown')
            followed = 1 if rec_type == actual_type else 0
            accuracy_metrics['recommendation_followed'].append(followed)
            
            # Perceived effectiveness
            effectiveness = outcome.get('effectiveness_rating', 5)  # 1-10 scale
            accuracy_metrics['perceived_effectiveness'].append(effectiveness)
        
        # Calculate summary statistics
        summary = {
            'avg_load_error': np.mean(accuracy_metrics['load_prediction_error']),
            'avg_readiness_error': np.mean(accuracy_metrics['readiness_prediction_error']),
            'recommendation_follow_rate': np.mean(accuracy_metrics['recommendation_followed']),
            'avg_effectiveness': np.mean(accuracy_metrics['perceived_effectiveness']),
            'total_recommendations': len(recommendations)
        }
        
        return summary


def demo_recommendation_engine():
    """Demonstrate recommendation engine with sample Joshua data."""
    print("🤖 Joshua Hudson Recommendation Engine Demo")
    print("="*50)
    
    # Initialize engine
    engine = JoshuaRecommendationEngine()
    
    if not engine.models:
        print("❌ No trained models found. Train models first with train_joshua_pmc_model.py")
        return
    
    # Sample current state for Joshua
    current_state = {
        'training_load': 85,
        'prev_training_load': 90,
        'prev_rpe': 8,
        'prev_readiness_score': 78,
        'rolling_3d_load': 87,
        'rolling_3d_rpe': 7.5,
        'rolling_3d_sleep': 7.8,
        'rolling_7d_load': 82,
        'weekly_load_std': 12,
        'training_impulse': 68,
        'load_ramp_rate': 0.05,
        'recovery_ratio': 8.5,
        'days_since_rest': 3,
        'rpe': 7,
        'sleep_hours': 7.5,
        'sleep_quality': 8,
        'stress_level': 3
    }
    
    # Generate single recommendation
    recommendation = engine.generate_recommendation(current_state)
    
    print(f"📅 Recommendation for: {recommendation['target_date']}")
    print(f"🏋️  Workout Type: {recommendation['workout_type'].title()}")
    print(f"🎯 Focus Area: {recommendation['focus_area'].title()}")
    print(f"⚡ Intensity: {recommendation['intensity_level']}/10")
    print(f"⏱️  Duration: {recommendation['duration_minutes']} minutes")
    print(f"📊 Recommended Load: {recommendation['recommended_load']}")
    print(f"💡 Coaching Notes: {recommendation['coaching_notes']}")
    print(f"🤔 Rationale: {', '.join(recommendation['rationale'])}")
    print(f"📈 Confidence: {recommendation['confidence']:.1%}")
    
    # Generate weekly plan
    print(f"\n📅 7-Day Training Plan:")
    print("-" * 50)
    weekly_plan = engine.create_weekly_plan(current_state, 7)
    
    for i, day_rec in enumerate(weekly_plan, 1):
        print(f"Day {i} ({day_rec['target_date']}): {day_rec['workout_type'].title()} - "
              f"{day_rec['focus_area'].title()} (Intensity: {day_rec['intensity_level']}/10)")
    
    print("\n✅ Recommendation engine demo complete!")


if __name__ == "__main__":
    demo_recommendation_engine()