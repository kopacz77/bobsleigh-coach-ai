"""Data loader for Joshua Hudson's training data from Supabase.

This module connects to the Supabase database and loads Joshua's real training data
for ML model training and analysis.
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, date
from typing import Dict, List, Tuple, Optional
from supabase import create_client, Client
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class JoshuaDataLoader:
    """Load and preprocess Joshua Hudson's training data for ML training."""
    
    def __init__(self):
        """Initialize Supabase client."""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
        
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        self.joshua_id = None
        
    def _get_joshua_id(self) -> str:
        """Get Joshua Hudson's athlete ID from database."""
        if self.joshua_id:
            return self.joshua_id
            
        response = self.client.from_('athletes').select('id').eq('email', 'joshua.hudson@bobsleigh.com').execute()
        
        if not response.data:
            raise ValueError("Joshua Hudson not found in database")
        
        self.joshua_id = response.data[0]['id']
        logger.info(f"Found Joshua Hudson with ID: {self.joshua_id}")
        return self.joshua_id
    
    def load_training_loads(self) -> pd.DataFrame:
        """Load Joshua's training load data for PMC model training.
        
        Returns:
            DataFrame with columns: date, training_load, ctl, atl, tsb, rpe, 
                                   fatigue_level, sleep_hours, readiness_score
        """
        joshua_id = self._get_joshua_id()
        
        response = self.client.from_('training_loads').select('*').eq('athlete_id', joshua_id).order('date').execute()
        
        if not response.data:
            raise ValueError("No training load data found for Joshua")
        
        df = pd.DataFrame(response.data)
        df['date'] = pd.to_datetime(df['date'])
        
        logger.info(f"Loaded {len(df)} days of training load data")
        return df
    
    def load_performance_metrics(self) -> pd.DataFrame:
        """Load Joshua's performance metrics and personal bests.
        
        Returns:
            DataFrame with performance test results and benchmarks
        """
        joshua_id = self._get_joshua_id()
        
        response = self.client.from_('performance_metrics').select('''
            *,
            exercises(name, category)
        ''').eq('athlete_id', joshua_id).order('test_date').execute()
        
        if not response.data:
            raise ValueError("No performance metrics found for Joshua")
        
        df = pd.DataFrame(response.data)
        df['test_date'] = pd.to_datetime(df['test_date'])
        
        # Flatten exercise data
        df['exercise_name'] = df['exercises'].apply(lambda x: x['name'] if x else None)
        df['exercise_category'] = df['exercises'].apply(lambda x: x['category'] if x else None)
        df.drop('exercises', axis=1, inplace=True)
        
        logger.info(f"Loaded {len(df)} performance metrics")
        return df
    
    def load_wellbeing_data(self) -> pd.DataFrame:
        """Load Joshua's wellbeing assessments.
        
        Returns:
            DataFrame with daily wellness metrics
        """
        joshua_id = self._get_joshua_id()
        
        response = self.client.from_('wellbeing_assessments').select('*').eq('athlete_id', joshua_id).order('assessment_date').execute()
        
        if not response.data:
            raise ValueError("No wellbeing data found for Joshua")
        
        df = pd.DataFrame(response.data)
        df['assessment_date'] = pd.to_datetime(df['assessment_date'])
        
        logger.info(f"Loaded {len(df)} days of wellbeing data")
        return df
    
    def load_workouts(self) -> pd.DataFrame:
        """Load Joshua's workout data with exercises.
        
        Returns:
            DataFrame with workout sessions and associated exercises
        """
        joshua_id = self._get_joshua_id()
        
        # Load workouts
        workouts_response = self.client.from_('workouts').select('*').eq('athlete_id', joshua_id).order('date').execute()
        
        if not workouts_response.data:
            raise ValueError("No workout data found for Joshua")
        
        workouts_df = pd.DataFrame(workouts_response.data)
        workouts_df['date'] = pd.to_datetime(workouts_df['date'])
        
        # Load workout exercises
        workout_ids = [w['id'] for w in workouts_response.data]
        exercises_response = self.client.from_('workout_exercises').select('''
            *,
            exercises(name, category)
        ''').in_('workout_id', workout_ids).execute()
        
        exercises_df = pd.DataFrame(exercises_response.data) if exercises_response.data else pd.DataFrame()
        
        if not exercises_df.empty:
            exercises_df['exercise_name'] = exercises_df['exercises'].apply(lambda x: x['name'] if x else None)
            exercises_df['exercise_category'] = exercises_df['exercises'].apply(lambda x: x['category'] if x else None)
            exercises_df.drop('exercises', axis=1, inplace=True)
        
        logger.info(f"Loaded {len(workouts_df)} workouts with {len(exercises_df)} exercise records")
        return workouts_df, exercises_df
    
    def create_pmc_dataset(self) -> pd.DataFrame:
        """Create a comprehensive dataset for PMC model training.
        
        Combines training loads, wellbeing, and performance data into a single
        time-series dataset suitable for machine learning.
        
        Returns:
            DataFrame ready for PMC model training
        """
        # Load all data
        training_loads = self.load_training_loads()
        wellbeing = self.load_wellbeing_data()
        
        # Merge on date
        pmc_data = training_loads.merge(
            wellbeing, 
            left_on='date', 
            right_on='assessment_date',
            how='left',
            suffixes=('_load', '_wellbeing')
        )
        
        # Create lag features for better prediction
        pmc_data = pmc_data.sort_values('date')
        
        # Previous day features
        pmc_data['prev_training_load'] = pmc_data['training_load'].shift(1)
        pmc_data['prev_rpe'] = pmc_data['rpe'].shift(1)
        pmc_data['prev_readiness_score'] = pmc_data['readiness_score'].shift(1)
        
        # Rolling averages (3-day window)
        pmc_data['rolling_3d_load'] = pmc_data['training_load'].rolling(3, min_periods=1).mean()
        pmc_data['rolling_3d_rpe'] = pmc_data['rpe'].rolling(3, min_periods=1).mean()
        pmc_data['rolling_3d_sleep'] = pmc_data['sleep_hours'].rolling(3, min_periods=1).mean()
        
        # Weekly features
        pmc_data['rolling_7d_load'] = pmc_data['training_load'].rolling(7, min_periods=1).mean()
        pmc_data['weekly_load_std'] = pmc_data['training_load'].rolling(7, min_periods=1).std()
        
        # Training impulse calculation (simple version)
        pmc_data['training_impulse'] = pmc_data['training_load'] * pmc_data['rpe'] / 10
        
        # Calculate load ramp rate (week over week change)
        pmc_data['load_ramp_rate'] = pmc_data['rolling_7d_load'].pct_change()
        
        # Recovery ratio (readiness / fatigue)
        pmc_data['recovery_ratio'] = pmc_data['readiness_score'] / (pmc_data['fatigue_level'] + 1)
        
        # Days since rest (0 load)
        rest_days = pmc_data['training_load'] == 0
        pmc_data['days_since_rest'] = 0
        for i in range(1, len(pmc_data)):
            if rest_days.iloc[i]:
                pmc_data.iloc[i, pmc_data.columns.get_loc('days_since_rest')] = 0
            else:
                pmc_data.iloc[i, pmc_data.columns.get_loc('days_since_rest')] = pmc_data.iloc[i-1]['days_since_rest'] + 1
        
        # Clean up columns
        feature_columns = [
            'date', 'training_load', 'ctl', 'atl', 'tsb',
            'rpe', 'fatigue_level', 'soreness_level', 'motivation_level',
            'sleep_hours', 'sleep_quality', 'stress_level', 'readiness_score',
            'energy_level', 'muscle_soreness', 'mood_rating',
            'prev_training_load', 'prev_rpe', 'prev_readiness_score',
            'rolling_3d_load', 'rolling_3d_rpe', 'rolling_3d_sleep',
            'rolling_7d_load', 'weekly_load_std', 'training_impulse',
            'load_ramp_rate', 'recovery_ratio', 'days_since_rest'
        ]
        
        pmc_data = pmc_data[feature_columns].copy()
        pmc_data = pmc_data.fillna(method='bfill').fillna(method='ffill')
        
        logger.info(f"Created PMC dataset with {len(pmc_data)} days and {len(feature_columns)} features")
        return pmc_data
    
    def get_joshua_summary(self) -> Dict:
        """Get a summary of Joshua's training data for model context.
        
        Returns:
            Dictionary with key statistics about Joshua's training
        """
        training_loads = self.load_training_loads()
        performance = self.load_performance_metrics()
        wellbeing = self.load_wellbeing_data()
        
        summary = {
            'athlete_name': 'Joshua Hudson',
            'sport': 'Bobsleigh',
            'data_period': {
                'start_date': training_loads['date'].min().strftime('%Y-%m-%d'),
                'end_date': training_loads['date'].max().strftime('%Y-%m-%d'),
                'total_days': len(training_loads)
            },
            'training_load_stats': {
                'mean_load': training_loads['training_load'].mean(),
                'max_load': training_loads['training_load'].max(),
                'rest_days': (training_loads['training_load'] == 0).sum(),
                'avg_ctl': training_loads['ctl'].mean(),
                'avg_atl': training_loads['atl'].mean(),
                'avg_tsb': training_loads['tsb'].mean()
            },
            'performance_benchmarks': {
                row['metric_name']: {'value': row['value'], 'unit': row['unit']} 
                for _, row in performance[performance['is_personal_best']].iterrows()
            },
            'wellbeing_stats': {
                'avg_sleep_hours': wellbeing['sleep_hours'].mean(),
                'avg_readiness_score': wellbeing['readiness_score'].mean(),
                'avg_stress_level': wellbeing['stress_level'].mean()
            }
        }
        
        return summary


def main():
    """Example usage of the data loader."""
    # Make sure environment variables are set
    if not os.getenv('SUPABASE_URL'):
        print("❌ SUPABASE_URL environment variable not set")
        return
    
    if not os.getenv('SUPABASE_ANON_KEY'):
        print("❌ SUPABASE_ANON_KEY environment variable not set")
        return
    
    try:
        # Initialize data loader
        loader = JoshuaDataLoader()
        
        # Get summary
        summary = loader.get_joshua_summary()
        print("📊 Joshua Hudson Training Data Summary:")
        print(f"   Training Period: {summary['data_period']['start_date']} to {summary['data_period']['end_date']}")
        print(f"   Total Days: {summary['data_period']['total_days']}")
        print(f"   Average Training Load: {summary['training_load_stats']['mean_load']:.1f}")
        print(f"   Average CTL (Fitness): {summary['training_load_stats']['avg_ctl']:.1f}")
        print(f"   Average Readiness: {summary['wellbeing_stats']['avg_readiness_score']:.1f}")
        
        # Load PMC dataset
        pmc_data = loader.create_pmc_dataset()
        print(f"\n🎯 PMC Dataset Created: {len(pmc_data)} days, {len(pmc_data.columns)} features")
        print("✅ Ready for ML model training!")
        
        return pmc_data
        
    except Exception as e:
        print(f"❌ Error loading Joshua's data: {e}")
        return None


if __name__ == "__main__":
    main()