#!/usr/bin/env python3
# File: backend/scripts/test_weekly_plan.py

import os
import sys
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from supabase import create_client, Client
import pandas as pd
import numpy as np

# Add parent directory to path so we can import from ml module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# Import the weekly plan generator
from ml.models.weekly_plan_generator import WeeklyPlanGenerator
from ml.models.pmc_model import PMCModel

# --- Configuration ---
SUPABASE_URL = "https://kydfqxbjklckpivmqncm.supabase.co"
# SUPABASE_KEY needs to be provided as an environment variable or command-line argument

def get_supabase_client() -> Client:
    """Get a Supabase client instance.
    
    Returns:
        Supabase client
    """
    key = os.environ.get("SUPABASE_KEY")
    
    if not key:
        print("Error: SUPABASE_KEY environment variable must be set")
        sys.exit(1)
        
    return create_client(SUPABASE_URL, key)

def get_athlete_data(supabase: Client, email: str) -> Dict[str, Any]:
    """Get athlete data from Supabase.
    
    Args:
        supabase: Supabase client
        email: Athlete email
        
    Returns:
        Athlete data
    """
    print(f"Getting athlete data for {email}...")
    
    # Query the athlete
    result = supabase.table("athletes").select("*").eq("email", email).execute()
    
    if not result.data:
        print(f"Athlete with email {email} not found")
        sys.exit(1)
    
    athlete = result.data[0]
    print(f"Found athlete: {athlete['first_name']} {athlete['last_name']}")
    
    return athlete

def get_workouts_and_training_loads(supabase: Client, athlete_id: str) -> Dict[str, List[Dict[str, Any]]]:
    """Get workouts and training loads for an athlete.
    
    Args:
        supabase: Supabase client
        athlete_id: Athlete ID
        
    Returns:
        Dictionary with workouts and training_loads
    """
    # Get workouts
    workouts_result = supabase.table("workouts").select("*").eq("athlete_id", athlete_id).order("date").execute()
    workouts = workouts_result.data
    
    # Get training loads
    loads_result = supabase.table("training_loads").select("*").eq("athlete_id", athlete_id).order("date").execute()
    training_loads = loads_result.data
    
    # Get workout exercises
    workout_exercises = []
    if workouts:
        workout_ids = [w["id"] for w in workouts]
        exercises_result = supabase.table("workout_exercises").select("*").in_("workout_id", workout_ids).execute()
        workout_exercises = exercises_result.data
    
    print(f"Found {len(workouts)} workouts and {len(training_loads)} training loads")
    
    return {
        "workouts": workouts,
        "training_loads": training_loads,
        "workout_exercises": workout_exercises
    }

def get_exercise_library(supabase: Client) -> Dict[str, List[Dict[str, Any]]]:
    """Get exercise library from database.
    
    Args:
        supabase: Supabase client
        
    Returns:
        Dictionary of exercises by category
    """
    # Get all exercises
    result = supabase.table("exercises").select("*").execute()
    exercises = result.data
    
    # Group by category
    exercise_library = {}
    for exercise in exercises:
        category = exercise.get("category", "Other")
        if category not in exercise_library:
            exercise_library[category] = []
        
        # Format exercise for the plan generator
        formatted_exercise = {
            "id": exercise["id"],
            "name": exercise["name"],
            "category": category,
            "sets": 3,  # Default values
            "reps": 8 if category in ["Strength", "Power"] else None,
            "weight": 70 if category in ["Strength", "Power"] else None,
            "distance": 30 if category == "Speed" else None,
            "duration": 60 if category in ["Mobility", "Technique"] else None
        }
        
        exercise_library[category].append(formatted_exercise)
    
    print(f"Loaded exercise library with {len(exercises)} exercises in {len(exercise_library)} categories")
    
    return exercise_library

def get_competitions(supabase: Client, athlete_id: str) -> List[Dict[str, Any]]:
    """Get competitions for an athlete.
    
    Args:
        supabase: Supabase client
        athlete_id: Athlete ID
        
    Returns:
        List of competitions
    """
    # Get competitions
    result = supabase.table("competitions").select("*").eq("athlete_id", athlete_id).order("competition_date").execute()
    competitions = result.data
    
    print(f"Found {len(competitions)} competitions")
    
    return competitions

def get_phase_templates() -> Dict[str, Dict[str, Any]]:
    """Get training phase templates.
    
    Returns:
        Dictionary of phase templates
    """
    # Define templates for different training phases
    templates = {
        "general_preparation": {
            "days": [
                # Day 1 - Lower body strength
                {
                    "title": "Lower Body Strength",
                    "intensity": "Medium",
                    "notes": "Focus on technique and building base strength",
                    "exercise_groups": [
                        {
                            "name": "Lower Body Strength",
                            "category": "Strength",
                            "exercise_count": 3,
                            "target_mhg": 0  # Will be calculated from athlete data
                        },
                        {
                            "name": "Core Stability",
                            "category": "Strength",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 2 - Speed/technique
                {
                    "title": "Speed & Technique",
                    "intensity": "Medium",
                    "notes": "Focus on movement quality",
                    "exercise_groups": [
                        {
                            "name": "Sprint Technique",
                            "category": "Speed",
                            "exercise_count": 2
                        },
                        {
                            "name": "Acceleration",
                            "category": "Speed",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 3 - Upper body strength
                {
                    "title": "Upper Body Strength",
                    "intensity": "Medium",
                    "notes": "Focus on pushing strength",
                    "exercise_groups": [
                        {
                            "name": "Upper Body Push",
                            "category": "Strength",
                            "exercise_count": 3,
                            "target_mhg": 0  # Will be calculated from athlete data
                        },
                        {
                            "name": "Upper Body Pull",
                            "category": "Strength",
                            "exercise_count": 2,
                            "target_mhg": 0  # Will be calculated from athlete data
                        }
                    ]
                },
                # Day 4 - Recovery
                {
                    "title": "Active Recovery",
                    "intensity": "Low",
                    "notes": "Light activity to promote recovery",
                    "exercise_groups": [
                        {
                            "name": "Mobility",
                            "category": "Mobility",
                            "exercise_count": 3
                        },
                        {
                            "name": "Light Cardio",
                            "category": "Other",
                            "exercise_count": 1
                        }
                    ]
                },
                # Day 5 - Power development
                {
                    "title": "Power Development",
                    "intensity": "High",
                    "notes": "Focus on explosive movements",
                    "exercise_groups": [
                        {
                            "name": "Olympic Lifts",
                            "category": "Power",
                            "exercise_count": 2,
                            "target_mhg": 0  # Will be calculated from athlete data
                        },
                        {
                            "name": "Plyometrics",
                            "category": "Power",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 6 - Speed/conditioning
                {
                    "title": "Speed & Conditioning",
                    "intensity": "Medium-High",
                    "notes": "Focus on speed and work capacity",
                    "exercise_groups": [
                        {
                            "name": "Sprint Work",
                            "category": "Speed",
                            "exercise_count": 2
                        },
                        {
                            "name": "Conditioning",
                            "category": "Other",
                            "exercise_count": 1
                        }
                    ]
                }
            ]
        },
        "specific_preparation": {
            "days": [
                # Similar structure but with more specific exercises
                # and higher intensities
                # Day 1 - Lower body strength & power
                {
                    "title": "Lower Body Strength & Power",
                    "intensity": "High",
                    "notes": "Focus on explosive strength",
                    "exercise_groups": [
                        {
                            "name": "Lower Body Strength",
                            "category": "Strength",
                            "exercise_count": 2,
                            "target_mhg": 0
                        },
                        {
                            "name": "Lower Body Power",
                            "category": "Power",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 2 - Sprint technique & acceleration
                {
                    "title": "Sprint & Acceleration",
                    "intensity": "High",
                    "notes": "Focus on start technique",
                    "exercise_groups": [
                        {
                            "name": "Start Technique",
                            "category": "Technique",
                            "exercise_count": 1
                        },
                        {
                            "name": "Acceleration",
                            "category": "Speed",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 3 - Upper body strength & power
                {
                    "title": "Upper Body Strength & Power",
                    "intensity": "High",
                    "notes": "Focus on push strength for bobsleigh start",
                    "exercise_groups": [
                        {
                            "name": "Push Strength",
                            "category": "Strength",
                            "exercise_count": 2,
                            "target_mhg": 0
                        },
                        {
                            "name": "Push Power",
                            "category": "Power",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 4 - Recovery & mobility
                {
                    "title": "Recovery & Mobility",
                    "intensity": "Low",
                    "notes": "Focus on recovery and maintenance",
                    "exercise_groups": [
                        {
                            "name": "Mobility",
                            "category": "Mobility",
                            "exercise_count": 3
                        },
                        {
                            "name": "Light Cardio",
                            "category": "Other",
                            "exercise_count": 1
                        }
                    ]
                },
                # Day 5 - Push technique & power
                {
                    "title": "Push Technique & Power",
                    "intensity": "High",
                    "notes": "Focus on sport-specific technique",
                    "exercise_groups": [
                        {
                            "name": "Push Technique",
                            "category": "Technique",
                            "exercise_count": 2
                        },
                        {
                            "name": "Explosive Power",
                            "category": "Power",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 6 - Speed endurance
                {
                    "title": "Speed Endurance",
                    "intensity": "Medium-High",
                    "notes": "Focus on maintaining speed",
                    "exercise_groups": [
                        {
                            "name": "Speed Endurance",
                            "category": "Speed",
                            "exercise_count": 2
                        },
                        {
                            "name": "Core Stability",
                            "category": "Strength",
                            "exercise_count": 2
                        }
                    ]
                }
            ]
        },
        "competition": {
            "days": [
                # More focused on maintenance and technique
                # with reduced volume
                # Day 1 - Lower body maintenance
                {
                    "title": "Lower Body Maintenance",
                    "intensity": "Medium",
                    "notes": "Maintain strength with reduced volume",
                    "exercise_groups": [
                        {
                            "name": "Lower Body Strength",
                            "category": "Strength",
                            "exercise_count": 2,
                            "target_mhg": 0
                        }
                    ]
                },
                # Day 2 - Technical practice
                {
                    "title": "Technical Practice",
                    "intensity": "Medium",
                    "notes": "Focus on execution quality",
                    "exercise_groups": [
                        {
                            "name": "Start Technique",
                            "category": "Technique",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 3 - Upper body maintenance
                {
                    "title": "Upper Body Maintenance",
                    "intensity": "Medium",
                    "notes": "Maintain strength with reduced volume",
                    "exercise_groups": [
                        {
                            "name": "Push Strength",
                            "category": "Strength",
                            "exercise_count": 2,
                            "target_mhg": 0
                        }
                    ]
                },
                # Day 4 - Recovery & mobility
                {
                    "title": "Recovery Day",
                    "intensity": "Low",
                    "notes": "Active recovery",
                    "exercise_groups": [
                        {
                            "name": "Mobility",
                            "category": "Mobility",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 5 - Power maintenance
                {
                    "title": "Power Maintenance",
                    "intensity": "Medium-High",
                    "notes": "Maintain power with reduced volume",
                    "exercise_groups": [
                        {
                            "name": "Explosive Power",
                            "category": "Power",
                            "exercise_count": 2
                        }
                    ]
                },
                # Day 6 - Pre-competition
                {
                    "title": "Final Preparation",
                    "intensity": "Low-Medium",
                    "notes": "Light technical work and mental preparation",
                    "exercise_groups": [
                        {
                            "name": "Technical Rehearsal",
                            "category": "Technique",
                            "exercise_count": 1
                        },
                        {
                            "name": "Activation",
                            "category": "Other",
                            "exercise_count": 1
                        }
                    ]
                }
            ]
        }
    }
    
    return templates

def prepare_athlete_feedback(workouts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Prepare athlete feedback data from workouts.
    
    Args:
        workouts: List of workouts
        
    Returns:
        List of feedback entries
    """
    # In a real system, this would come from actual feedback
    # For now, generate some reasonable values
    feedback = []
    
    for workout in workouts:
        # Generate feedback for some workouts (about 1 in 3)
        if np.random.random() < 0.3:
            # Determine if positive or negative feedback
            is_positive = np.random.random() < 0.7  # Mostly positive
            
            feedback_entry = {
                "workout_id": workout["id"],
                "date": workout["date"],
                "rating": "positive" if is_positive else "negative",
                "rpe": round(np.random.uniform(6, 9), 1),  # Random RPE between 6-9
                "comments": "Felt good overall" if is_positive else "Struggled with some exercises",
                "limiting_factors": []
            }
            
            # Add limiting factors for negative feedback
            if not is_positive:
                possible_factors = ["fatigue", "technique", "motivation", "soreness", "weight", "recovery"]
                factor_count = np.random.randint(1, 3)  # 1-2 factors
                feedback_entry["limiting_factors"] = np.random.choice(possible_factors, factor_count, replace=False).tolist()
            
            feedback.append(feedback_entry)
    
    return feedback

def prepare_wellbeing_data(days: int = 30) -> List[Dict[str, Any]]:
    """Prepare wellbeing assessment data.
    
    Args:
        days: Number of days of data to generate
        
    Returns:
        List of wellbeing entries
    """
    # In a real system, this would come from athlete input
    # For now, generate some reasonable values
    wellbeing = []
    
    # Start from today and go backwards
    today = datetime.now().date()
    
    for i in range(days):
        assessment_date = today - timedelta(days=i)
        
        # Only create entries for some days (about 1 in 2)
        if np.random.random() < 0.5:
            # Generate random values between 1-10
            sleep_quality = np.random.randint(5, 10)  # Biased toward better sleep
            stress_level = np.random.randint(3, 8)    # Moderate stress
            physical_readiness = np.random.randint(5, 10)  # Moderate to good
            
            wellbeing_entry = {
                "date": assessment_date.strftime("%Y-%m-%d"),
                "sleep_quality": sleep_quality,
                "stress_level": stress_level,
                "physical_readiness": physical_readiness,
                "notes": "Regular day" if physical_readiness > 7 else "Feeling a bit tired"
            }
            
            # Occasionally add injury concerns
            if np.random.random() < 0.1:  # 10% chance
                possible_concerns = ["Slight knee soreness", "Minor hamstring tightness", "Some lower back stiffness"]
                wellbeing_entry["injury_concerns"] = np.random.choice(possible_concerns)
                wellbeing_entry["notes"] = wellbeing_entry["injury_concerns"] + ". " + wellbeing_entry["notes"]
            
            wellbeing.append(wellbeing_entry)
    
    return wellbeing

def calculate_target_mhg_values(
    exercise_groups: List[Dict[str, Any]],
    workouts: List[Dict[str, Any]],
    phase_templates: Dict[str, Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """Calculate target MHG values based on historical data.
    
    Args:
        exercise_groups: List of exercise groups
        workouts: List of workouts
        phase_templates: Training phase templates
        
    Returns:
        Updated phase templates with MHG targets
    """
    print("\nCalculating target MHG values...")
    
    # Group exercise groups by name and calculate average MHG
    group_mhg_values = {}
    
    for group in exercise_groups:
        name = group.get("name", "")
        mhg = group.get("mhg")
        
        if name and mhg is not None and isinstance(mhg, (int, float)) and not pd.isna(mhg):
            if name not in group_mhg_values:
                group_mhg_values[name] = []
            
            group_mhg_values[name].append(mhg)
    
    # Calculate average MHG for each group
    avg_mhg_values = {}
    for name, values in group_mhg_values.items():
        if values:
            avg = sum(values) / len(values)
            avg_mhg_values[name] = avg
            print(f"  {name}: Average MHG = {avg:.2f} (from {len(values)} values)")
    
    # Update phase templates with MHG targets
    updated_templates = {}
    
    for phase_name, phase_template in phase_templates.items():
        updated_phase = phase_template.copy()
        updated_days = []
        
        for day in phase_template["days"]:
            updated_day = day.copy()
            updated_groups = []
            
            for group in day["exercise_groups"]:
                updated_group = group.copy()
                
                # Look for matching group name or similar names
                target_mhg = updated_group.get("target_mhg", 0)
                
                if "target_mhg" in updated_group and target_mhg == 0:
                    group_name = updated_group["name"]
                    
                    # Look for exact match first
                    if group_name in avg_mhg_values:
                        target_mhg = avg_mhg_values[group_name]
                    else:
                        # Look for partial matches
                        for name, value in avg_mhg_values.items():
                            if (group_name.lower() in name.lower() or 
                                name.lower() in group_name.lower() or
                                any(term in name.lower() for term in group_name.lower().split())):
                                target_mhg = value
                                break
                    
                    # Apply phase-specific adjustments
                    if phase_name == "specific_preparation":
                        # Increase MHG for specific preparation phase
                        target_mhg *= 1.05
                    elif phase_name == "competition":
                        # Slight decrease for competition phase to ensure quality
                        target_mhg *= 0.95
                    
                    updated_group["target_mhg"] = target_mhg
                
                updated_groups.append(updated_group)
            
            updated_day["exercise_groups"] = updated_groups
            updated_days.append(updated_day)
        
        updated_phase["days"] = updated_days
        updated_templates[phase_name] = updated_phase
    
    return updated_templates

def generate_and_save_weekly_plan(
    athlete_id: str,
    athlete_name: str,
    supabase: Client,
    exercise_library: Dict[str, List[Dict[str, Any]]],
    phase_templates: Dict[str, Dict[str, Any]],
    competition_dates: List[datetime],
    previous_workouts: List[Dict[str, Any]],
    athlete_feedback: List[Dict[str, Any]],
    wellbeing_data: List[Dict[str, Any]],
    performance_metrics: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Generate a weekly plan and save to database.
    
    Args:
        athlete_id: Athlete ID
        athlete_name: Athlete name for display
        supabase: Supabase client
        exercise_library: Exercise library
        phase_templates: Training phase templates
        competition_dates: List of competition dates
        previous_workouts: Previous workouts data
        athlete_feedback: Athlete feedback data
        wellbeing_data: Wellbeing assessment data
        performance_metrics: Performance metrics (optional)
        
    Returns:
        Generated weekly plan
    """
    # Initialize weekly plan generator
    plan_generator = WeeklyPlanGenerator(
        athlete_id=athlete_id,
        exercise_library=exercise_library,
        phase_templates=phase_templates,
        competition_dates=competition_dates
    )
    
    # Current date to generate plan for
    current_date = datetime.now().date()
    
    # Generate weekly plan
    weekly_plan = plan_generator.generate_weekly_plan(
        current_date=current_date,
        previous_workouts=previous_workouts,
        athlete_feedback=athlete_feedback,
        performance_metrics=performance_metrics or {},
        wellbeing_data=wellbeing_data
    )
    
    # Add athlete name to plan metadata
    weekly_plan["metadata"]["athleteName"] = athlete_name
    
    # Save to database
    print("\nSaving weekly plan to database...")
    
    try:
        # Add a recommendations ID
        recommendation_id = str(uuid.uuid4())
        
        # Save as a training recommendation
        recommendation_data = {
            "id": recommendation_id,
            "athlete_id": athlete_id,
            "date": datetime.now().date().isoformat(),
            "recommendation_date": current_date.isoformat(),
            "workout_type": "Weekly Plan",
            "focus": f"{weekly_plan['metadata']['trainingPhase']} Phase Training",
            "content": json.dumps(weekly_plan),
            "basis": ["PMC Metrics", "Previous Workouts", "Athlete Feedback"],
            "recommendation_type": "AI Generated",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        supabase.table("training_recommendations").insert(recommendation_data).execute()
        print(f"Weekly plan saved with ID: {recommendation_id}")
        
        # Return the generated plan
        return weekly_plan
    
    except Exception as e:
        print(f"Error saving weekly plan: {e}")
        return weekly_plan

def format_weekly_plan_for_display(weekly_plan: Dict[str, Any]) -> str:
    """Format weekly plan for display in terminal.
    
    Args:
        weekly_plan: Weekly plan data
        
    Returns:
        Formatted string representation
    """
    output = []
    
    # Add header
    metadata = weekly_plan.get("metadata", {})
    output.append("=" * 80)
    output.append(f"WEEKLY TRAINING PLAN FOR {metadata.get('athleteName', 'Athlete')}")
    output.append(f"Week {weekly_plan.get('week_number', '')} - {metadata.get('trainingPhase', 'Training Phase')}")
    output.append(f"Generated on: {metadata.get('generatedOn', datetime.now().isoformat())}")
    output.append("=" * 80)
    
    # Add PMC metrics
    pmc = metadata.get("pmcMetrics", {})
    output.append(f"CTL (Fitness): {pmc.get('ctl', 0):.1f}   ATL (Fatigue): {pmc.get('atl', 0):.1f}   TSB (Form): {pmc.get('tsb', 0):.1f}")
    output.append("-" * 80)
    
    # Add days
    for day in weekly_plan.get("days", []):
        if day.get("is_rest_day", False):
            output.append(f"\n{day.get('day_name', '')} - REST DAY")
            if day.get("notes"):
                output.append(f"Notes: {day.get('notes', '')}")
            continue
        
        output.append(f"\n{day.get('day_name', '')} - {day.get('title', '')} ({day.get('intensity', 'Medium')} Intensity)")
        if day.get("notes"):
            output.append(f"Notes: {day.get('notes', '')}")
        
        # Add exercise groups
        for group in day.get("exercise_groups", []):
            output.append(f"\n  {group.get('name', '')} " + (f"(Target MHG: {group.get('mhg', 0):.1f}kg)" if group.get('mhg') else ""))
            
            # Add exercises
            for ex in group.get("exercises", []):
                exercise_str = f"    - {ex.get('name', '')}: {ex.get('sets', 1)} sets"
                if ex.get("reps"):
                    exercise_str += f" × {ex.get('reps')} reps"
                if ex.get("weight"):
                    exercise_str += f" @ {ex.get('weight')}kg"
                if ex.get("distance"):
                    exercise_str += f" × {ex.get('distance')}m"
                if ex.get("duration"):
                    exercise_str += f" × {ex.get('duration')}s"
                if ex.get("rest"):
                    exercise_str += f" (Rest: {ex.get('rest')}s)"
                
                output.append(exercise_str)
    
    # Add special notes
    if metadata.get("injuryAccommodation"):
        output.append("\n" + "!" * 80)
        output.append(f"INJURY ACCOMMODATION: {metadata.get('injuryAccommodation')}")
        output.append("!" * 80)
    
    if metadata.get("recoveryFocus"):
        output.append("\n" + "!" * 80)
        output.append("RECOVERY FOCUS: This plan emphasizes recovery due to high fatigue levels.")
        output.append("!" * 80)
    
    return "\n".join(output)

def main():
    """Main function to run the script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test the weekly plan generator with Josh Hudson's data")
    parser.add_argument("--email", default="josh.hudson@example.com", help="Athlete email")
    parser.add_argument("--week", type=int, default=9, help="Week number to generate (default: 9)")
    parser.add_argument("--output", help="Path to save generated plan as JSON (optional)")
    args = parser.parse_args()
    
    # Initialize Supabase client
    supabase = get_supabase_client()
    
    # Get athlete data
    athlete = get_athlete_data(supabase, args.email)
    athlete_id = athlete["id"]
    athlete_name = f"{athlete['first_name']} {athlete['last_name']}"
    
    # Get workouts and training loads
    training_data = get_workouts_and_training_loads(supabase, athlete_id)
    workouts = training_data["workouts"]
    training_loads = training_data["training_loads"]
    workout_exercises = training_data["workout_exercises"]
    
    # Get competitions
    competitions = get_competitions(supabase, athlete_id)
    competition_dates = [datetime.fromisoformat(comp["competition_date"]) for comp in competitions]
    
    # Get exercise library
    exercise_library = get_exercise_library(supabase)
    
    # Get phase templates
    phase_templates = get_phase_templates()
    
    # Format workouts for weekly plan generator
    formatted_workouts = []
    for workout in workouts:
        # Get exercise groups for this workout
        workout_exercise_groups = []
        
        # Group exercises by exercise group (using notes field to identify groups)
        group_exercises = {}
        for ex in workout_exercises:
            if ex["workout_id"] == workout["id"]:
                if ex["notes"] and "Group" in ex["notes"]:
                    # This is a group header
                    group_name = ex["notes"].split(":", 1)[1].split(",")[0].strip()
                    if group_name not in group_exercises:
                        group_exercises[group_name] = []
                else:
                    # This is a regular exercise, add to "Other" group
                    if "Other" not in group_exercises:
                        group_exercises["Other"] = []
                    
                    # Format the exercise
                    formatted_exercise = {
                        "id": ex["id"],
                        "name": "Unknown Exercise",  # Will be updated if we find it
                        "sets": ex["sets"] or 1,
                        "reps": ex["reps"],
                        "weight": ex["weight"],
                        "distance": ex["distance"],
                        "duration": ex["time"],
                        "notes": ex["notes"]
                    }
                    
                    # Look up exercise name if available
                    if ex["exercise_id"]:
                        for category, exercises in exercise_library.items():
                            for library_ex in exercises:
                                if library_ex["id"] == ex["exercise_id"]:
                                    formatted_exercise["name"] = library_ex["name"]
                                    break
                    
                    group_exercises["Other"].append(formatted_exercise)
        
        # Create exercise groups
        for group_name, exercises in group_exercises.items():
            if exercises:  # Only add groups with exercises
                workout_exercise_groups.append({
                    "name": group_name,
                    "exercises": exercises
                })
        
        # Format the workout
        formatted_workout = {
            "id": workout["id"],
            "date": workout["date"],
            "name": workout["name"],
            "type": workout["type"],
            "phase": workout["phase"],
            "notes": workout["notes"],
            "exercise_groups": workout_exercise_groups
        }
        
        # Add training load if available
        for load in training_loads:
            if load["date"] == workout["date"]:
                formatted_workout["training_load"] = load["training_load"]
                break
        
        formatted_workouts.append(formatted_workout)
    
    # Generate sample athlete feedback
    athlete_feedback = prepare_athlete_feedback(workouts)
    
    # Generate sample wellbeing data
    wellbeing_data = prepare_wellbeing_data()
    
    # Calculate target MHG values for exercise groups
    updated_phase_templates = calculate_target_mhg_values(
        training_data["workout_exercises"],
        workouts,
        phase_templates
    )
    
    # Generate weekly plan
    weekly_plan = generate_and_save_weekly_plan(
        athlete_id=athlete_id,
        athlete_name=athlete_name,
        supabase=supabase,
        exercise_library=exercise_library,
        phase_templates=updated_phase_templates,
        competition_dates=competition_dates,
        previous_workouts=formatted_workouts,
        athlete_feedback=athlete_feedback,
        wellbeing_data=wellbeing_data
    )
    
    # Save to JSON if requested
    if args.output:
        with open(args.output, "w") as f:
            json.dump(weekly_plan, f, indent=2)
        print(f"\nWeekly plan saved to {args.output}")
    
    # Display the plan
    print("\n" + format_weekly_plan_for_display(weekly_plan))
    print("\nWeekly plan generation complete!")

if __name__ == "__main__":
    main()