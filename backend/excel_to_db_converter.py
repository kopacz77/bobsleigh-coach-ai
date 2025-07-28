#!/usr/bin/env python3
"""
Database Conversion Script for Joshua Hudson Training Data

This script converts the Excel training data into the database schema format
used by the Bobsleigh Coach AI application.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import sys
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional

def create_athlete_record() -> Dict[str, Any]:
    """Create athlete record for Joshua Hudson."""
    
    return {
        "id": str(uuid.uuid4()),
        "name": "Joshua Hudson",
        "email": "josh.hudson@example.com",  # Placeholder
        "sport": "bobsleigh",
        "position": "pilot",
        "date_of_birth": "1995-01-01",  # Placeholder
        "height_cm": 180,  # Placeholder
        "weight_kg": 101,  # From spreadsheet
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

def convert_performance_tests(parsed_data: Dict[str, Any], athlete_id: str) -> List[Dict[str, Any]]:
    """Convert performance test data to database format."""
    
    db_tests = []
    
    for test in parsed_data.get('performance_tests', []):
        db_test = {
            "id": str(uuid.uuid4()),
            "athlete_id": athlete_id,
            "test_name": test['test_name'],
            "result_value": test['result'],
            "unit": test['unit'],
            "test_date": test['date'],
            "notes": "",
            "created_at": datetime.now().isoformat()
        }
        db_tests.append(db_test)
    
    return db_tests

def convert_training_sessions(parsed_data: Dict[str, Any], athlete_id: str) -> List[Dict[str, Any]]:
    """Convert training sessions to database format."""
    
    db_sessions = []
    db_exercises = []
    
    session_map = {}  # Group exercises by date
    
    # Group sessions by date
    for session in parsed_data.get('training_sessions', []):
        date = session.get('date', '2023-01-01')
        if date not in session_map:
            session_map[date] = []
        session_map[date].append(session)
    
    # Create workout sessions
    for date, sessions in session_map.items():
        workout_id = str(uuid.uuid4())
        
        # Determine workout type based on exercises
        workout_types = [s.get('exercise_type', 'other') for s in sessions]
        primary_type = max(set(workout_types), key=workout_types.count) if workout_types else 'other'
        
        # Calculate total volume (rough estimate)
        total_volume = 0
        for session in sessions:
            sets = session.get('sets', 1) or 1
            reps = session.get('reps', 1) or 1
            weight = session.get('weight_kg', 0) or 0
            total_volume += sets * reps * weight
        
        db_session = {
            "id": workout_id,
            "athlete_id": athlete_id,
            "workout_date": date,
            "workout_type": primary_type,
            "duration_minutes": 90,  # Estimated default
            "total_volume": total_volume,
            "rpe": None,  # Not available in data
            "notes": f"Imported from Excel - {len(sessions)} exercises",
            "created_at": datetime.now().isoformat()
        }
        db_sessions.append(db_session)
        
        # Create exercises for this session
        for session in sessions:
            exercise_id = str(uuid.uuid4())
            
            db_exercise = {
                "id": exercise_id,
                "workout_id": workout_id,
                "exercise_name": session.get('exercise', 'Unknown'),
                "sets": session.get('sets'),
                "reps": session.get('reps'),
                "weight_kg": session.get('weight_kg'),
                "distance_m": None,
                "time_seconds": None,
                "rpe": None,
                "notes": session.get('notes', ''),
                "exercise_order": 1,
                "created_at": datetime.now().isoformat()
            }
            
            # Handle special fartlek data
            if 'special_data' in session and session['special_data'].get('type') == 'fartlek':
                intervals = session['special_data'].get('intervals', [])
                total_time = sum(int(i.get('run_seconds', 0)) + int(i.get('walk_seconds', 0)) for i in intervals)
                db_exercise['time_seconds'] = total_time
                db_exercise['notes'] = f"Fartlek: {len(intervals)} intervals"
            
            db_exercises.append(db_exercise)
    
    return db_sessions, db_exercises

def convert_injuries(parsed_data: Dict[str, Any], athlete_id: str) -> List[Dict[str, Any]]:
    """Convert injury data to database format."""
    
    db_injuries = []
    
    for injury in parsed_data.get('injuries', []):
        db_injury = {
            "id": str(uuid.uuid4()),
            "athlete_id": athlete_id,
            "injury_date": injury['date'],
            "body_part": injury['body_part'],
            "description": injury['description'],
            "severity": injury['severity'],
            "recovery_date": None,
            "treatment": "",
            "created_at": datetime.now().isoformat()
        }
        db_injuries.append(db_injury)
    
    return db_injuries

def create_wellbeing_entries(athlete_id: str, start_date: str = "2023-01-01", num_days: int = 365) -> List[Dict[str, Any]]:
    """Create sample wellbeing entries (since not in original data)."""
    
    db_wellbeing = []
    
    start = datetime.fromisoformat(start_date)
    
    for i in range(num_days):
        date = start + timedelta(days=i)
        
        # Generate realistic wellbeing data
        entry = {
            "id": str(uuid.uuid4()),
            "athlete_id": athlete_id,
            "date": date.date().isoformat(),
            "sleep_hours": np.random.normal(8, 1),
            "sleep_quality": np.random.randint(1, 11),
            "energy_level": np.random.randint(1, 11),
            "mood": np.random.randint(1, 11),
            "stress_level": np.random.randint(1, 11),
            "soreness": np.random.randint(1, 11),
            "motivation": np.random.randint(1, 11),
            "notes": "",
            "created_at": datetime.now().isoformat()
        }
        
        # Some days have missing data
        if np.random.random() < 0.1:  # 10% missing data
            continue
            
        db_wellbeing.append(entry)
    
    return db_wellbeing

def convert_excel_to_db_format(parsed_data_file: str) -> Dict[str, List[Dict[str, Any]]]:
    """Convert parsed Excel data to database format."""
    
    print("Loading parsed data...")
    with open(parsed_data_file, 'r') as f:
        parsed_data = json.load(f)
    
    print("Converting to database format...")
    
    # Create athlete record
    athlete = create_athlete_record()
    athlete_id = athlete['id']
    
    # Convert all data types
    athletes = [athlete]
    performance_tests = convert_performance_tests(parsed_data, athlete_id)
    workouts, exercises = convert_training_sessions(parsed_data, athlete_id)
    injuries = convert_injuries(parsed_data, athlete_id)
    wellbeing = create_wellbeing_entries(athlete_id)
    
    converted_data = {
        'athletes': athletes,
        'workouts': workouts,
        'exercises': exercises,
        'performance_tests': performance_tests,
        'injuries': injuries,
        'wellbeing_entries': wellbeing
    }
    
    # Print summary
    print(f"\nConversion Summary:")
    print(f"Athletes: {len(athletes)}")
    print(f"Workouts: {len(workouts)}")
    print(f"Exercises: {len(exercises)}")
    print(f"Performance Tests: {len(performance_tests)}")
    print(f"Injuries: {len(injuries)}")
    print(f"Wellbeing Entries: {len(wellbeing)}")
    
    return converted_data

def save_converted_data(converted_data: Dict[str, List[Dict[str, Any]]], output_dir: str) -> None:
    """Save converted data as JSON files for database import."""
    
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    for table_name, data in converted_data.items():
        file_path = output_path / f"{table_name}.json"
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print(f"Saved {len(data)} records to {file_path}")

def generate_sql_import_script(converted_data: Dict[str, List[Dict[str, Any]]], output_dir: str) -> None:
    """Generate SQL script to import the data."""
    
    sql_script = """-- Joshua Hudson Training Data Import Script
-- Generated automatically from Excel data

-- Insert athlete
INSERT INTO athletes (id, name, email, sport, position, date_of_birth, height_cm, weight_kg, created_at, updated_at)
VALUES """
    
    # Add athlete data
    athlete = converted_data['athletes'][0]
    sql_script += f"('{athlete['id']}', '{athlete['name']}', '{athlete['email']}', '{athlete['sport']}', '{athlete['position']}', '{athlete['date_of_birth']}', {athlete['height_cm']}, {athlete['weight_kg']}, '{athlete['created_at']}', '{athlete['updated_at']}');\n\n"
    
    # Add performance tests
    if converted_data['performance_tests']:
        sql_script += "-- Insert performance tests\n"
        sql_script += "INSERT INTO performance_tests (id, athlete_id, test_name, result_value, unit, test_date, notes, created_at) VALUES\n"
        
        test_values = []
        for test in converted_data['performance_tests']:
            test_values.append(f"('{test['id']}', '{test['athlete_id']}', '{test['test_name']}', {test['result_value']}, '{test['unit']}', '{test['test_date']}', '{test['notes']}', '{test['created_at']}')")
        
        sql_script += ",\n".join(test_values) + ";\n\n"
    
    # Add sample of workouts (first 5)
    if converted_data['workouts']:
        sql_script += "-- Insert sample workouts (first 5)\n"
        sql_script += "INSERT INTO workouts (id, athlete_id, workout_date, workout_type, duration_minutes, total_volume, rpe, notes, created_at) VALUES\n"
        
        workout_values = []
        for workout in converted_data['workouts'][:5]:
            rpe_val = workout['rpe'] if workout['rpe'] is not None else 'NULL'
            workout_values.append(f"('{workout['id']}', '{workout['athlete_id']}', '{workout['workout_date']}', '{workout['workout_type']}', {workout['duration_minutes']}, {workout['total_volume']}, {rpe_val}, '{workout['notes']}', '{workout['created_at']}')")
        
        sql_script += ",\n".join(workout_values) + ";\n\n"
    
    sql_script += "-- Note: This is a sample script. Use the JSON files for complete data import.\n"
    
    # Save SQL script
    sql_file = Path(output_dir) / "import_joshua_data.sql"
    with open(sql_file, 'w') as f:
        f.write(sql_script)
    
    print(f"SQL import script saved to: {sql_file}")

def main():
    """Main function to run the conversion."""
    
    parsed_data_file = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend/joshua_parsed_training_data.json"
    output_dir = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend/converted_data"
    
    if not Path(parsed_data_file).exists():
        print(f"Error: Parsed data file not found at {parsed_data_file}")
        print("Please run the joshua_data_parser.py script first.")
        return
    
    try:
        # Convert data
        converted_data = convert_excel_to_db_format(parsed_data_file)
        
        # Save as JSON files
        save_converted_data(converted_data, output_dir)
        
        # Generate SQL import script
        generate_sql_import_script(converted_data, output_dir)
        
        print(f"\n✓ Conversion complete!")
        print(f"Output directory: {output_dir}")
        print(f"Files created:")
        print(f"  - athletes.json")
        print(f"  - workouts.json") 
        print(f"  - exercises.json")
        print(f"  - performance_tests.json")
        print(f"  - injuries.json")
        print(f"  - wellbeing_entries.json")
        print(f"  - import_joshua_data.sql")
        
    except Exception as e:
        print(f"Error during conversion: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()