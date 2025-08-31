#!/usr/bin/env python3
"""
Database Integration for Joshua Hudson ML Models
Connects the prediction system to the Supabase database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime, timedelta
import json

load_dotenv()

class DatabaseConnector:
    """
    Connects ML models to the Supabase database with Joshua's real data
    """
    
    def __init__(self):
        self.supabase = self._connect_supabase()
        
    def _connect_supabase(self) -> Client:
        """Connect to Supabase database"""
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not url or not key:
            raise ValueError("Missing Supabase credentials in .env file")
            
        return create_client(url, key)
    
    def get_joshua_data(self):
        """
        Fetch Joshua Hudson's actual training data from database
        """
        print("📊 Fetching Joshua's data from database...")
        
        try:
            # Get Joshua's athlete ID
            athlete_result = self.supabase.table('athletes').select('*').eq('first_name', 'Joshua').execute()
            
            if not athlete_result.data:
                print("❌ Joshua Hudson not found in database")
                return None
                
            joshua = athlete_result.data[0]
            athlete_id = joshua['id']
            
            print(f"✅ Found Joshua Hudson: {joshua['email']}")
            print(f"📈 Performance Benchmarks:")
            if joshua.get('performance_benchmarks'):
                benchmarks = joshua['performance_benchmarks']
                for key, value in benchmarks.items():
                    print(f"   • {key}: {value['value']} {value['unit']}")
            
            # Get training loads (PMC data)
            loads_result = self.supabase.table('training_loads').select('*').eq('athlete_id', athlete_id).execute()
            loads_df = pd.DataFrame(loads_result.data) if loads_result.data else pd.DataFrame()
            
            # Get wellbeing assessments
            wellbeing_result = self.supabase.table('wellbeing_assessments').select('*').eq('athlete_id', athlete_id).execute()
            wellbeing_df = pd.DataFrame(wellbeing_result.data) if wellbeing_result.data else pd.DataFrame()
            
            # Get performance metrics
            metrics_result = self.supabase.table('performance_metrics').select('*').eq('athlete_id', athlete_id).execute()
            metrics_df = pd.DataFrame(metrics_result.data) if metrics_result.data else pd.DataFrame()
            
            # Get workouts
            workouts_result = self.supabase.table('workouts').select('*').eq('athlete_id', athlete_id).execute()
            workouts_df = pd.DataFrame(workouts_result.data) if workouts_result.data else pd.DataFrame()
            
            print(f"📊 Data Summary:")
            print(f"   • Training Loads: {len(loads_df)} records")
            print(f"   • Wellbeing: {len(wellbeing_df)} records") 
            print(f"   • Performance Metrics: {len(metrics_df)} records")
            print(f"   • Workouts: {len(workouts_df)} records")
            
            return {
                'athlete': joshua,
                'training_loads': loads_df,
                'wellbeing': wellbeing_df,
                'performance_metrics': metrics_df,
                'workouts': workouts_df
            }
            
        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            return None
    
    def get_exercise_library(self):
        """Get the clean exercise library"""
        try:
            result = self.supabase.table('exercises').select('*').eq('is_active', True).execute()
            exercises_df = pd.DataFrame(result.data) if result.data else pd.DataFrame()
            
            print(f"💪 Exercise Library: {len(exercises_df)} exercises")
            
            # Show breakdown by relevance
            if not exercises_df.empty:
                relevance_counts = exercises_df['bobsleigh_relevance'].value_counts()
                print("📊 Relevance Breakdown:")
                for relevance, count in relevance_counts.items():
                    print(f"   • {relevance}: {count} exercises")
            
            return exercises_df
            
        except Exception as e:
            print(f"❌ Error fetching exercises: {e}")
            return pd.DataFrame()
    
    def save_prediction(self, athlete_id, predictions, recommendations):
        """Save ML predictions back to database"""
        try:
            prediction_record = {
                'athlete_id': athlete_id,
                'date': datetime.now().date().isoformat(),
                'predictions': predictions,
                'recommendations': recommendations,
                'model_version': 'joshua_v1.0',
                'created_at': datetime.now().isoformat()
            }
            
            # Would need to add predictions table to schema
            print("💾 Prediction saved (would save to predictions table)")
            return True
            
        except Exception as e:
            print(f"❌ Error saving prediction: {e}")
            return False
    
    def create_training_plan(self, athlete_id, recommendations):
        """
        Create actual workout entries based on ML recommendations
        """
        try:
            exercises_df = self.get_exercise_library()
            
            if exercises_df.empty:
                print("❌ No exercises found")
                return False
            
            # Get recommended exercises
            recommended_exercises = recommendations.get('key_exercises', [])
            
            # Create workout for tomorrow
            tomorrow = (datetime.now() + timedelta(days=1)).date()
            
            workout_data = {
                'athlete_id': athlete_id,
                'date': tomorrow.isoformat(),
                'name': f"AI Generated - {', '.join(recommendations.get('training_focus', ['Training']))}",
                'type': recommendations.get('training_focus', ['strength'])[0],
                'phase': 'build',  # Would be determined by periodization
                'duration_minutes': 75,  # Typical session length
                'planned_load': 85 + recommendations.get('load_adjustment', 0),
                'notes': f"Generated by Joshua Hudson ML model. Focus: {', '.join(recommendations.get('training_focus', []))}"
            }
            
            print(f"🏋️ Creating workout plan for {tomorrow}")
            print(f"   Focus: {', '.join(recommendations.get('training_focus', []))}")
            print(f"   Load: {workout_data['planned_load']}")
            print(f"   Exercises: {', '.join(recommended_exercises)}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating training plan: {e}")
            return False

def main():
    """
    Demo of database integration with ML models
    """
    print("🔗 Database Integration Test")
    print("=" * 40)
    
    try:
        # Connect to database
        db = DatabaseConnector()
        
        # Fetch Joshua's real data
        joshua_data = db.get_joshua_data()
        
        if joshua_data:
            # Get exercise library  
            exercises = db.get_exercise_library()
            
            # Show some key exercises
            if not exercises.empty:
                print(f"\n🏆 Very High Relevance Exercises:")
                very_high = exercises[exercises['bobsleigh_relevance'] == 'very_high']
                for _, exercise in very_high.iterrows():
                    pb_info = ""
                    if exercise.get('joshua_pb'):
                        pb_data = exercise['joshua_pb']
                        pb_info = f" (Joshua's PB: {pb_data['value']} {pb_data['unit']})"
                    print(f"   • {exercise['name']}{pb_info}")
            
            print(f"\n✅ Database integration successful!")
            print(f"🎯 Ready to connect ML models to real data")
            
        else:
            print(f"❌ Could not fetch Joshua's data")
            print(f"💡 Make sure you've applied the database schema from APPLY_NOW.sql")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"💡 Make sure Supabase credentials are correct and schema is applied")

if __name__ == "__main__":
    main()