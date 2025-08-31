#!/usr/bin/env python3
# File: backend/scripts/parse_josh_training_data.py

import os
import sys
import json
import uuid
import pandas as pd
import numpy as np
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

def parse_excel_date(excel_date) -> Optional[str]:
    """Convert Excel date number to ISO date string.
    
    Args:
        excel_date: Excel date (number of days since 1899-12-30)
        
    Returns:
        ISO date string (YYYY-MM-DD) or None if invalid
    """
    if not isinstance(excel_date, (int, float)) or pd.isna(excel_date):
        return None
    
    try:
        # Excel date is days since 1899-12-30, but Python epoch is 1970-01-01
        # Add number of days from 1899-12-30 to 1970-01-01
        unix_timestamp = (excel_date - 25569) * 86400
        date = datetime.utcfromtimestamp(unix_timestamp)
        return date.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"Error parsing Excel date {excel_date}: {e}")
        return None

def extract_value(df, row, col):
    """Safely extract a value from DataFrame, handling out of bounds and NaN."""
    if row < 0 or row >= len(df) or col < 0 or col >= len(df.iloc[row]):
        return None
    val = df.iloc[row, col]
    if pd.isna(val):
        return None
    return val

def parse_date_from_string(date_str):
    """Attempt to parse a date from various string formats."""
    if not date_str or not isinstance(date_str, str):
        return None
        
    # Common date formats to try
    date_formats = [
        "%d %b %Y",      # "4 Mar 2024"
        "%d-%b-%Y",      # "4-Mar-2024"
        "%B %d, %Y",     # "March 4, 2024"
        "%b %d, %Y",     # "Mar 4, 2024"
        "%m/%d/%Y",      # "03/04/2024"
        "%d/%m/%Y",      # "04/03/2024"
        "%Y-%m-%d"       # "2024-03-04"
    ]
    
    # Try to extract a date that might be part of a longer string
    date_pattern = r'\b\d{1,2}[\s-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s-]\d{4}\b'
    date_match = re.search(date_pattern, date_str, re.IGNORECASE)
    if date_match:
        date_str = date_match.group(0)
    
    # Try each format
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    
    return None

def extract_date_from_header(df, day_col, header_row):
    """Extract the date from the day header.
    
    Based on the spreadsheet format where dates appear directly in the column headers
    like "4 Mar 2024"
    """
    # Look directly at the day column for the date
    date_value = extract_value(df, header_row, day_col)
    
    if isinstance(date_value, str):
        parsed_date = parse_date_from_string(date_value)
        if parsed_date:
            return parsed_date
    
    # If not found, try looking in the next few rows
    for row_offset in range(1, 3):
        date_value = extract_value(df, header_row + row_offset, day_col)
        if isinstance(date_value, str):
            parsed_date = parse_date_from_string(date_value)
            if parsed_date:
                return parsed_date
    
    return None

def is_mhg_row(df, row, col_range=None):
    """Check if this row contains an MHG indicator."""
    if col_range is None:
        # Default to checking all columns
        col_range = range(df.shape[1])
        
    for col in col_range:
        value = extract_value(df, row, col)
        if isinstance(value, str) and value.strip().upper() == "MHG":
            return True
    return False

def find_mhg_rows(df, start_row, end_row, day_col):
    """Find all rows containing 'MHG' for a specific day column."""
    mhg_rows = []
    # Check only the specific day column and next few columns
    col_range = range(day_col, min(day_col + 3, df.shape[1]))
    
    for row in range(start_row, min(end_row, len(df))):
        if is_mhg_row(df, row, [day_col]):  # Focus on just the main day column
            mhg_rows.append(row)
    
    # Filter out MHG rows that are too close together (within 3 rows)
    # as they might be part of the same exercise group
    if len(mhg_rows) > 1:
        filtered_mhg_rows = [mhg_rows[0]]
        for i in range(1, len(mhg_rows)):
            if mhg_rows[i] - filtered_mhg_rows[-1] > 3:
                filtered_mhg_rows.append(mhg_rows[i])
        return filtered_mhg_rows
    
    return mhg_rows

def safe_convert_to_float(value):
    """Safely convert a value to float, handling error strings and invalid values."""
    if value is None or pd.isna(value):
        return None
        
    if isinstance(value, (int, float)):
        return float(value)
        
    if isinstance(value, str):
        # Handle Excel error values
        if any(err in value for err in ["#REF!", "#DIV", "#VALUE", "#N/A", "#NULL", "#NAME", "#NUM"]):
            return None
            
        # Try to extract numeric part from string
        numeric_part = re.findall(r"[-+]?\d*\.\d+|\d+", value)
        if numeric_part:
            try:
                return float(numeric_part[0])
            except ValueError:
                pass
    
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def calculate_mhg(df, start_row, end_row, weight_col, reps_col):
    """Calculate MHG (Mean Heavy-weight per Group) value.
    
    MHG = sum(weight * reps) / sum(reps)
    """
    total_weight_reps = 0
    total_reps = 0
    
    for row in range(start_row, end_row):
        weight = safe_convert_to_float(extract_value(df, row, weight_col))
        reps = safe_convert_to_float(extract_value(df, row, reps_col))
        
        if weight is not None and reps is not None:
            total_weight_reps += weight * reps
            total_reps += reps
    
    if total_reps > 0:
        return round(total_weight_reps / total_reps, 2)
    return None

def calculate_total_weight(df, start_row, end_row, weight_col, reps_col):
    """Calculate total weight (sum of weight * reps)."""
    total = 0
    
    for row in range(start_row, end_row):
        weight = safe_convert_to_float(extract_value(df, row, weight_col))
        reps = safe_convert_to_float(extract_value(df, row, reps_col))
        
        if weight is not None and reps is not None:
            total += weight * reps
    
    return round(total, 2) if total > 0 else None

def identify_exercise_name(df, start_row, day_col):
    """Identify the exercise name for a group of sets."""
    # Exercise name is typically above the sets, in the same column as the weights
    for row in range(start_row, max(0, start_row - 5), -1):
        val = extract_value(df, row, day_col)
        if isinstance(val, str) and val != "MHG" and val.strip().upper() not in ["TOTAL KG", "TYPE/WEIGHT KG", "TOTAL"]:
            return val.strip()
    return "Unknown Exercise"

def find_exercise_section(df, start_row, end_row, day_col):
    """Find the start and end rows of the exercise section in a group."""
    exercise_start = None
    exercise_end = None
    
    # Look for "Type/weight kg" row which indicates start of exercises
    for row in range(start_row, end_row):
        cell = extract_value(df, row, day_col)
        if isinstance(cell, str) and "type" in cell.lower() and "weight" in cell.lower():
            exercise_start = row + 1  # Start after the header
            break
    
    # If not found, look backwards from end for "Total kg" row
    if exercise_start is None:
        for row in range(end_row - 1, start_row - 1, -1):
            cell = extract_value(df, row, day_col)
            if isinstance(cell, str) and cell.strip().upper() in ["TOTAL KG", "TOTAL"]:
                exercise_end = row
                # Start would be the first non-empty row above Total kg
                for r in range(row - 1, start_row - 1, -1):
                    cell = extract_value(df, r, day_col)
                    if cell and not pd.isna(cell):
                        exercise_start = r
                        break
                break
    
    # If we found the start but not the end, look for the end
    if exercise_start is not None and exercise_end is None:
        for row in range(exercise_start, end_row):
            cell = extract_value(df, row, day_col)
            if isinstance(cell, str) and cell.strip().upper() in ["TOTAL KG", "TOTAL"]:
                exercise_end = row
                break
    
    # Fallback if section boundaries still not found
    if exercise_start is None:
        exercise_start = start_row
    if exercise_end is None:
        exercise_end = end_row
    
    return exercise_start, exercise_end

def find_group_name(df, mhg_row, day_col, start_row):
    """Find the name of an exercise group by looking before the MHG row."""
    # Start from a few rows above the MHG row
    for row in range(mhg_row - 1, max(start_row, mhg_row - 10), -1):
        # Skip rows with known headers or empty cells
        cell = extract_value(df, row, day_col)
        if not cell or not isinstance(cell, str):
            continue
            
        # Skip specific headers
        if cell.strip().upper() in ["TOTAL KG", "TYPE/WEIGHT KG", "MHG"]:
            continue
            
        # If we find a row with content, it's likely the group name
        return cell.strip()
        
    # Default group name if none found
    return "Exercise Group"

def is_weight_row(df, row, day_col):
    """Check if a row likely contains weight data."""
    # Weight rows typically have numbers in the weight column and reps column
    weight = safe_convert_to_float(extract_value(df, row, day_col))
    reps = safe_convert_to_float(extract_value(df, row, day_col + 1))
    
    return weight is not None and reps is not None

def is_exercise_header(value):
    """Check if a value is likely an exercise header."""
    if not value or not isinstance(value, str):
        return False
        
    # Exercise headers are usually not numeric and not standard headers
    return not value.strip().upper() in ["TOTAL KG", "TYPE/WEIGHT KG", "MHG", "REPS"]

def parse_exercise_text(text):
    """Parse exercise text to extract sets, reps, and other information."""
    result = {
        "sets": 1,
        "reps": None,
        "distance": None,
        "duration": None
    }
    
    if not text or not isinstance(text, str):
        return result
    
    # Look for patterns like "3 x 15" (sets x reps)
    sets_reps_match = re.search(r'(\d+)\s*x\s*(\d+)\s*', text)
    if sets_reps_match:
        result["sets"] = int(sets_reps_match.group(1))
        result["reps"] = int(sets_reps_match.group(2))
    
    # Look for distance markers like "60m"
    distance_match = re.search(r'(\d+)\s*m', text)
    if distance_match:
        result["distance"] = int(distance_match.group(1))
    
    # Look for time indicators
    time_match = re.search(r'(\d+)\s*(min|sec)', text, re.IGNORECASE)
    if time_match:
        value = int(time_match.group(1))
        unit = time_match.group(2).lower()
        if unit.startswith('min'):
            result["duration"] = value * 60  # Convert to seconds
        else:
            result["duration"] = value
    
    return result

def parse_josh_hudson_data(
    excel_file: str,
    athlete_id: str = "12345",
    sheet_name: str = "Training Plan 2",
    start_week: int = 1,
    weeks_to_import: int = 8
) -> Dict[str, List[Dict[str, Any]]]:
    """Parse Josh Hudson's training data from Excel with specialized handling.
    
    Args:
        excel_file: Path to Excel file
        athlete_id: Athlete ID
        sheet_name: Name of the sheet to extract data from
        start_week: First week to extract (1-based)
        weeks_to_import: Number of weeks to extract
        
    Returns:
        Dictionary with workouts, exercise_groups, and exercises data
    """
    print(f"Parsing training data from {excel_file}, sheet '{sheet_name}'...")
    
    # Load Excel file without headers
    try:
        df = pd.read_excel(excel_file, sheet_name=sheet_name, header=None)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        sys.exit(1)
    
    # Debug: Print the first few rows
    print("First 5 rows of data:")
    for i in range(5):
        if i < len(df):
            print(f"Row {i}, Col 0: '{df.iloc[i, 0]}'")
    
    # Find all week rows
    week_rows = []
    week_numbers = []
    
    for idx, row in df.iterrows():
        # Check if the first cell contains "Week" (case insensitive)
        if row[0] is not None and isinstance(row[0], str) and "week" in row[0].lower():
            # Get the week number from the next cell or row
            week_num = None
            
            # Check if week number is in the same row
            if len(row) > 1 and isinstance(row[1], (int, float)):
                week_num = int(row[1])
            else:
                # Try to get week number from the next row
                next_row_idx = idx + 1
                if next_row_idx < len(df):
                    next_row = df.iloc[next_row_idx]
                    if len(next_row) > 0 and isinstance(next_row[0], (int, float)):
                        week_num = int(next_row[0])
            
            if week_num is not None:
                week_rows.append(idx)
                week_numbers.append(week_num)
    
    print(f"Found {len(week_rows)} weeks in the spreadsheet")
    
    if not week_rows:
        print("No weekly data found in the spreadsheet")
        sys.exit(1)
    
    # Filter to requested weeks
    selected_weeks = []
    for i, (row, num) in enumerate(zip(week_rows, week_numbers)):
        if start_week <= num <= start_week + weeks_to_import - 1:
            selected_weeks.append((row, num))
    
    if not selected_weeks:
        print(f"No data found for requested weeks {start_week} to {start_week + weeks_to_import - 1}")
        sys.exit(1)
    
    # Initialize output data structures
    workouts = []
    exercise_groups = []
    exercises = []
    
    # Process each week
    for week_idx, (week_row, week_number) in enumerate(selected_weeks):
        print(f"Processing Week {week_number} (starting at row {week_row})")
        
        # Determine the end of this week
        week_end_row = len(df)
        if week_idx < len(selected_weeks) - 1:
            week_end_row = selected_weeks[week_idx + 1][0]
        
        # Find day headers in this week
        day_headers_row = None
        for r in range(week_row, min(week_row + 5, week_end_row)):
            day_count = 0
            for c in range(1, min(15, df.shape[1])):
                cell = extract_value(df, r, c)
                if isinstance(cell, str) and "day" in cell.lower():
                    day_count += 1
            
            if day_count >= 3:  # Found at least 3 days, likely the header row
                day_headers_row = r
                break
        
        if day_headers_row is None:
            print(f"  Warning: Could not find day headers for Week {week_number}")
            day_headers_row = week_row + 1  # Guess based on typical format
        
        # Find the day columns in this week (columns with "Day N" headers)
        day_columns = []
        
        for col in range(1, min(20, df.shape[1]), 2):  # Check columns, typically odd-numbered
            day_header = extract_value(df, day_headers_row, col)
            
            if day_header and isinstance(day_header, str) and "day" in day_header.lower():
                # Get the date from this column
                date_value = extract_date_from_header(df, col, day_headers_row)
                
                day_columns.append({
                    "day_col": col,
                    "day_name": day_header.strip(),
                    "date": date_value
                })
        
        print(f"  Found {len(day_columns)} training days in Week {week_number}")
        
        # Find the notes row (typically 2 rows after the week header)
        notes_row = None
        for r in range(week_row, min(week_row + 5, week_end_row)):
            cell = extract_value(df, r, 0)
            if isinstance(cell, str) and "notes" in cell.lower():
                notes_row = r
                break
        
        # Process each day in this week
        for day_idx, day_info in enumerate(day_columns):
            day_col = day_info["day_col"]
            day_name = day_info["day_name"]
            day_date = day_info["date"]
            
            # If date wasn't found, generate one
            if not day_date:
                # Use the week number to at least get the month/year approximately right
                # Assuming the first week is in March 2024 (based on spreadsheet screenshot)
                base_date = datetime(2024, 3, 1)
                days_offset = (week_number - 1) * 7 + day_idx
                day_date = (base_date + timedelta(days=days_offset)).strftime("%Y-%m-%d")
                print(f"    Warning: Using generated date {day_date} for {day_name} of Week {week_number}")
            
            # Get the notes for this day
            day_notes = None
            if notes_row:
                day_notes = extract_value(df, notes_row, day_col)
            
            # Check if this is a rest day by looking for "rest" in the notes
            is_rest_day = False
            if day_notes and isinstance(day_notes, str) and "rest" in day_notes.lower():
                is_rest_day = True
                print(f"    Day {day_idx + 1} is a rest day, skipping")
                continue
            
            # Create workout record
            workout_id = f"workout_w{week_number}d{day_idx + 1}"
            workout_name = f"Week {week_number} - {day_name}"
            
            # Determine workout phase
            if week_number <= 4:
                workout_phase = "General Preparation"
            elif week_number <= 8:
                workout_phase = "Specific Preparation"
            else:
                workout_phase = "Competition"
            
            workout = {
                "id": workout_id,
                "athlete_id": athlete_id,
                "name": workout_name,
                "date": day_date,
                "duration": 60,  # Default duration
                "type": "Strength & Conditioning",
                "notes": str(day_notes) if day_notes is not None else None,
                "phase": workout_phase,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            workouts.append(workout)
            
            # Find MHG rows for this day - these mark the exercise groups
            mhg_rows = find_mhg_rows(df, day_headers_row, week_end_row, day_col)
            
            if not mhg_rows:
                print(f"    No exercise groups found for {day_name}")
                continue
            
            print(f"    Found {len(mhg_rows)} exercise groups")
            
            # Process each exercise group
            for group_idx, mhg_row in enumerate(mhg_rows):
                # Determine the boundaries of this group
                group_start_row = day_headers_row
                if group_idx > 0:
                    group_start_row = mhg_rows[group_idx - 1] + 1
                
                group_end_row = week_end_row
                if group_idx < len(mhg_rows) - 1:
                    group_end_row = mhg_rows[group_idx + 1]
                
                # Find the group name
                group_name = find_group_name(df, mhg_row, day_col, group_start_row)
                if not group_name:
                    group_name = f"Exercise Group {group_idx + 1}"
                
                # Get MHG value
                mhg_value = None
                # Check the cell to the right of "MHG"
                mhg_value_cell = extract_value(df, mhg_row, day_col + 1)
                if isinstance(mhg_value_cell, (int, float)):
                    mhg_value = float(mhg_value_cell)
                elif isinstance(mhg_value_cell, str):
                    # If it's "#VALUE!" or "#DIV/0!", keep as None
                    if not any(err in mhg_value_cell for err in ["#REF!", "#DIV", "#VALUE", "#N/A", "#NULL", "#NAME", "#NUM"]):
                        mhg_value = safe_convert_to_float(mhg_value_cell)
                
                # Create exercise group
                group_id = f"{workout_id}_group{group_idx + 1}"
                group = {
                    "id": group_id,
                    "workout_id": workout_id,
                    "name": group_name,
                    "mhg": mhg_value,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                exercise_groups.append(group)
                
                # Find "Type/weight kg" row and "Total kg" row to locate exercise data
                type_weight_row = None
                total_kg_row = None
                
                for row in range(group_start_row, mhg_row):
                    cell = extract_value(df, row, day_col)
                    if cell and isinstance(cell, str):
                        if "type" in cell.lower() and "weight" in cell.lower():
                            type_weight_row = row
                        elif "total" in cell.lower() and "kg" in cell.lower():
                            total_kg_row = row
                
                # If we found type_weight_row, exercise data follows it
                if type_weight_row is not None:
                    exercise_start = type_weight_row + 1
                    exercise_end = mhg_row
                    if total_kg_row is not None:
                        exercise_end = total_kg_row
                    
                    # Check if there's a main exercise header for all the weight rows
                    main_exercise = None
                    for row in range(type_weight_row - 3, type_weight_row):
                        cell = extract_value(df, row, day_col)
                        if cell and isinstance(cell, str) and is_exercise_header(cell):
                            main_exercise = cell.strip()
                            break
                    
                    # Process weight/reps rows
                    exercise_sets = []
                    for row in range(exercise_start, exercise_end):
                        weight = safe_convert_to_float(extract_value(df, row, day_col))
                        reps = safe_convert_to_float(extract_value(df, row, day_col + 1))
                        
                        if weight is not None and reps is not None:
                            exercise_sets.append({
                                "row": row,
                                "weight": weight,
                                "reps": reps
                            })
                    
                    if exercise_sets and main_exercise:
                        # Create one exercise with multiple sets
                        exercise_id = f"{group_id}_ex1"
                        
                        exercise = {
                            "id": exercise_id,
                            "group_id": group_id,
                            "name": main_exercise,
                            "sets": len(exercise_sets),
                            "reps": int(exercise_sets[0]["reps"]) if exercise_sets[0]["reps"] is not None else None,
                            "weight": None,  # No single weight for multiple sets
                            "distance": None,
                            "duration": None,
                            "notes": f"Multiple sets: {', '.join([f'{row['weight']}kg x {int(row['reps'])}' for row in exercise_sets if row['reps'] is not None])}",
                            "created_at": datetime.now().isoformat(),
                            "updated_at": datetime.now().isoformat()
                        }
                        
                        exercises.append(exercise)
                        
                        # Also create individual set entries if needed
                        for i, row in enumerate(exercise_sets):
                            set_id = f"{exercise_id}_set{i + 1}"
                            
                            set_exercise = {
                                "id": set_id,
                                "group_id": group_id,
                                "parent_exercise_id": exercise_id,
                                "name": f"{main_exercise} (Set {i + 1})",
                                "sets": 1,
                                "reps": int(row["reps"]) if row["reps"] is not None else None,
                                "weight": row["weight"],
                                "distance": None,
                                "duration": None,
                                "notes": None,
                                "created_at": datetime.now().isoformat(),
                                "updated_at": datetime.now().isoformat()
                            }
                            
                            exercises.append(set_exercise)
                    else:
                        # No valid sets or main exercise found
                        pass
                
                # Check for text-based exercises (like "8 x 60m strides")
                # These typically appear after the MHG row
                text_exercise_start = mhg_row + 1
                text_exercise_end = group_end_row
                
                # Collect text exercises
                text_exercises = []
                for row in range(text_exercise_start, text_exercise_end):
                    cell = extract_value(df, row, day_col)
                    if cell and isinstance(cell, str) and len(cell.strip()) > 3:
                        # Skip known headers
                        if cell.strip().upper() in ["MHG", "TOTAL KG", "TYPE/WEIGHT KG"]:
                            continue
                            
                        # This is likely a text-based exercise
                        reps_or_note = extract_value(df, row, day_col + 1)
                        
                        text_exercises.append({
                            "row": row,
                            "name": cell.strip(),
                            "reps_or_note": reps_or_note
                        })
                
                # Create exercises for text items
                for i, ex in enumerate(text_exercises):
                    exercise_id = f"{group_id}_text_ex{i + 1}"
                    
                    # Parse the exercise text for sets, reps, etc.
                    parsed = parse_exercise_text(ex["name"])
                    
                    # If we have reps or notes from the next column, use those
                    notes = None
                    if ex["reps_or_note"] is not None:
                        if isinstance(ex["reps_or_note"], (int, float)):
                            parsed["reps"] = int(ex["reps_or_note"])
                        elif isinstance(ex["reps_or_note"], str):
                            notes = ex["reps_or_note"]
                    
                    exercise = {
                        "id": exercise_id,
                        "group_id": group_id,
                        "name": ex["name"],
                        "sets": parsed["sets"],
                        "reps": parsed["reps"],
                        "weight": None,
                        "distance": parsed["distance"],
                        "duration": parsed["duration"],
                        "notes": notes,
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                    
                    exercises.append(exercise)
    
    # Prepare result dictionary
    result = {
        "workouts": workouts,
        "exercise_groups": exercise_groups,
        "exercises": exercises
    }
    
    return result

def main():
    """Main function to run the script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Parse Josh Hudson's training data from Excel with specialized handling")
    parser.add_argument("--excel", required=True, help="Path to Excel file")
    parser.add_argument("--start-week", type=int, default=1, help="First week to import (default: 1)")
    parser.add_argument("--weeks", type=int, default=8, help="Number of weeks to import (default: 8)")
    parser.add_argument("--sheet", default="Training Plan 2", help="Sheet name (default: Training Plan 2)")
    parser.add_argument("--output", required=True, help="Path to save parsed data as JSON")
    parser.add_argument("--athlete-id", default="22e457e7-b89b-12d3-a456-426614174000", 
                      help="Athlete ID (default: 22e457e7-b89b-12d3-a456-426614174000)")
    args = parser.parse_args()
    
    # Parse training data
    data = parse_josh_hudson_data(
        args.excel,
        args.athlete_id,
        args.sheet,
        args.start_week,
        args.weeks
    )
    
    # Output stats
    print("\nParsed Data Summary:")
    print(f"- Total Workouts: {len(data['workouts'])}")
    print(f"- Total Exercise Groups: {len(data['exercise_groups'])}")
    print(f"- Total Exercises: {len(data['exercises'])}")
    
    # Save to JSON
    with open(args.output, "w") as f:
        json.dump(data, f, indent=2)
    print(f"\nData saved to {args.output}")

if __name__ == "__main__":
    main()