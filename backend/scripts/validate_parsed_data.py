#!/usr/bin/env python3
# File: validate_parsed_data.py
# This script validates the training data JSON file by checking for common issues

import json
import sys
import os
from datetime import datetime
import argparse
from collections import Counter

def validate_parsed_data(json_file):
    """Validate the data extracted from the Excel file."""
    print(f"Validating data from {json_file}...")
    
    # Load JSON data
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return False
    
    # Extract the main data sections
    workouts = data.get('workouts', [])
    exercise_groups = data.get('exercise_groups', [])
    exercises = data.get('exercises', [])
    
    print(f"Found {len(workouts)} workouts, {len(exercise_groups)} exercise groups, and {len(exercises)} exercises")
    
    # Basic validation
    if not workouts:
        print("ERROR: No workouts found in the data")
        return False
    
    if not exercise_groups:
        print("ERROR: No exercise groups found in the data")
        return False
    
    if not exercises:
        print("ERROR: No exercises found in the data")
        return False
    
    # Validate dates
    date_issues = 0
    for workout in workouts:
        if 'date' not in workout or not workout['date']:
            print(f"WARNING: Workout {workout.get('name', 'Unknown')} has no date")
            date_issues += 1
        elif workout['date'].startswith('2024-01-'):
            # This is a generated placeholder date (should be March 2024 or actual extracted dates)
            print(f"NOTE: Workout {workout.get('name', 'Unknown')} has a generated placeholder date: {workout['date']}")
    
    print(f"Date issues found: {date_issues}")
    
    # Check for missing MHG values
    mhg_missing = 0
    mhg_values = []
    for group in exercise_groups:
        if 'mhg' not in group or group['mhg'] is None:
            mhg_missing += 1
        else:
            mhg_values.append(group['mhg'])
    
    print(f"Exercise groups with missing MHG values: {mhg_missing} out of {len(exercise_groups)}")
    
    if mhg_values:
        print(f"MHG value statistics:")
        print(f"  Min: {min(mhg_values):.2f}")
        print(f"  Max: {max(mhg_values):.2f}")
        print(f"  Avg: {sum(mhg_values) / len(mhg_values):.2f}")
    
    # Check for orphaned exercises
    orphaned_exercises = 0
    group_ids = {group['id'] for group in exercise_groups}
    for exercise in exercises:
        if 'group_id' not in exercise or exercise['group_id'] not in group_ids:
            orphaned_exercises += 1
            print(f"WARNING: Exercise {exercise.get('name', 'Unknown')} has invalid group_id: {exercise.get('group_id', 'None')}")
    
    print(f"Orphaned exercises: {orphaned_exercises}")
    
    # Count exercise types
    exercise_types = Counter()
    for exercise in exercises:
        if 'name' in exercise and exercise['name']:
            exercise_types[exercise['name']] += 1
    
    print("\nTop exercise types:")
    for ex_type, count in exercise_types.most_common(10):
        print(f"  {ex_type}: {count}")
    
    # Week summary
    week_numbers = set()
    for workout in workouts:
        if 'name' in workout and workout['name']:
            # Extract week number from name (format: "Week X - Day Y")
            if workout['name'].startswith("Week "):
                try:
                    week_num = int(workout['name'].split('-')[0].replace("Week ", "").strip())
                    week_numbers.add(week_num)
                except ValueError:
                    pass
    
    print(f"\nWeeks found in data: {sorted(week_numbers)}")
    
    # Check for exercises with weight and reps
    weighted_exercises = sum(1 for ex in exercises if ex.get('weight') is not None)
    reps_exercises = sum(1 for ex in exercises if ex.get('reps') is not None)
    
    print(f"Exercises with weight: {weighted_exercises} ({weighted_exercises/len(exercises)*100:.1f}%)")
    print(f"Exercises with reps: {reps_exercises} ({reps_exercises/len(exercises)*100:.1f}%)")
    
    # Validate relationships
    valid_workouts = True
    workout_days_by_week = {}
    
    for workout in workouts:
        # Extract week and day from name
        week_day = workout.get('name', '').split('-')
        if len(week_day) == 2:
            week = week_day[0].strip()
            if week not in workout_days_by_week:
                workout_days_by_week[week] = 0
            workout_days_by_week[week] += 1
    
    print("\nWorkout days per week:")
    for week, count in sorted(workout_days_by_week.items()):
        print(f"  {week}: {count} days")
    
    # Overall validation result
    if date_issues > 0 or orphaned_exercises > 0:
        print("\nValidation completed with WARNINGS")
        return True  # Still consider it valid for further processing
    else:
        print("\nValidation completed SUCCESSFULLY")
        return True

def main():
    parser = argparse.ArgumentParser(description="Validate the training data JSON file")
    parser.add_argument("--input", required=True, help="Path to the JSON file to validate")
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found.")
        sys.exit(1)
    
    success = validate_parsed_data(args.input)
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()