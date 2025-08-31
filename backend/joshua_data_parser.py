#!/usr/bin/env python3
"""
Enhanced Joshua Hudson Training Data Parser

This script performs detailed extraction and parsing of Joshua's training data
to create a structured dataset for ML model training.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import re
from typing import Dict, List, Tuple, Any
import warnings

warnings.filterwarnings('ignore')

class JoshuaTrainingDataParser:
    """Parser for Joshua Hudson's training Excel data."""
    
    def __init__(self, excel_file_path: str):
        self.file_path = excel_file_path
        self.parsed_data = {
            'training_sessions': [],
            'performance_tests': [],
            'exercises': set(),
            'athlete_profile': {},
            'periodization': [],
            'wellbeing': [],
            'injuries': []
        }
        
    def parse_all_sheets(self) -> Dict[str, Any]:
        """Parse all relevant sheets from the Excel file."""
        
        print("Starting comprehensive data parsing...")
        
        # Parse training plans (main data source)
        for plan_num in [1, 2, 3]:
            sheet_name = f"Training Plan {plan_num}"
            print(f"\nParsing {sheet_name}...")
            self.parse_training_plan(sheet_name, plan_num)
        
        # Parse performance and results
        print("\nParsing PBs and Results...")
        self.parse_performance_data()
        
        # Parse feedback and injuries
        print("\nParsing Feedback and Injuries...")
        self.parse_feedback_injuries()
        
        # Parse fartlek training
        print("\nParsing Fartlek training...")
        self.parse_fartlek_data()
        
        # Parse projected targets
        print("\nParsing Projected targets...")
        self.parse_projected_targets()
        
        # Convert sets to lists for JSON serialization
        self.parsed_data['exercises'] = list(self.parsed_data['exercises'])
        
        return self.parsed_data
    
    def parse_training_plan(self, sheet_name: str, plan_number: int) -> None:
        """Parse a training plan sheet."""
        
        try:
            # Read the sheet starting from row 2 (0-indexed) which contains the structure
            df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=None)
            
            # Extract year from sheet data
            year = 2023 + (plan_number - 1)  # 2023, 2024, 2025
            
            # Find weekly blocks
            week_starts = []
            for idx, row in df.iterrows():
                if isinstance(row.iloc[0], (int, float)) and not pd.isna(row.iloc[0]):
                    if str(row.iloc[0]).isdigit() or (isinstance(row.iloc[0], (int, float)) and row.iloc[0] > 0):
                        week_starts.append(idx)
            
            print(f"Found {len(week_starts)} potential weeks in {sheet_name}")
            
            # Process each week
            for i, week_start_idx in enumerate(week_starts[:20]):  # Limit to first 20 weeks
                try:
                    self.parse_week_block(df, week_start_idx, i + 1, year, plan_number)
                except Exception as e:
                    print(f"Error parsing week {i+1}: {e}")
                    continue
                    
        except Exception as e:
            print(f"Error parsing {sheet_name}: {e}")
    
    def parse_week_block(self, df: pd.DataFrame, start_idx: int, week_num: int, year: int, plan_num: int) -> None:
        """Parse a single week's training block."""
        
        try:
            # Look for date pattern in the next few rows
            dates = []
            for offset in range(1, 10):
                if start_idx + offset >= len(df):
                    break
                    
                row = df.iloc[start_idx + offset]
                for col_idx, cell in enumerate(row):
                    if isinstance(cell, datetime):
                        dates.append((col_idx, cell))
                    elif isinstance(cell, str) and len(cell) > 8:
                        try:
                            parsed_date = pd.to_datetime(cell)
                            dates.append((col_idx, parsed_date))
                        except:
                            continue
            
            if not dates:
                return
            
            # Process each training day
            for col_idx, date in dates[:7]:  # Max 7 days per week
                day_sessions = self.extract_day_training(df, start_idx, col_idx, date, week_num, plan_num)
                self.parsed_data['training_sessions'].extend(day_sessions)
                
        except Exception as e:
            print(f"Error parsing week block starting at {start_idx}: {e}")
    
    def extract_day_training(self, df: pd.DataFrame, week_start: int, col_idx: int, date: datetime, week_num: int, plan_num: int) -> List[Dict]:
        """Extract training data for a specific day."""
        
        sessions = []
        
        try:
            # Look for exercise data in the column below the date
            for row_offset in range(2, 20):  # Look in next 18 rows
                if week_start + row_offset >= len(df):
                    break
                
                exercise_cell = df.iloc[week_start + row_offset, col_idx]
                
                if pd.isna(exercise_cell) or exercise_cell == '':
                    continue
                
                # Check if this looks like an exercise
                if isinstance(exercise_cell, str) and len(exercise_cell) > 2:
                    # Look for weight/reps in adjacent columns
                    weight_reps = self.extract_weight_reps(df, week_start + row_offset, col_idx)
                    
                    session = {
                        'date': date.isoformat() if isinstance(date, datetime) else str(date),
                        'week': week_num,
                        'plan': plan_num,
                        'exercise': str(exercise_cell).strip(),
                        'sets': weight_reps.get('sets', None),
                        'reps': weight_reps.get('reps', None),
                        'weight_kg': weight_reps.get('weight', None),
                        'notes': weight_reps.get('notes', ''),
                        'exercise_type': self.classify_exercise(str(exercise_cell))
                    }
                    
                    # Add to exercises set
                    self.parsed_data['exercises'].add(str(exercise_cell).strip())
                    
                    sessions.append(session)
                
                elif isinstance(exercise_cell, (int, float)) and not pd.isna(exercise_cell):
                    # This might be a weight or rep value
                    continue
                    
        except Exception as e:
            print(f"Error extracting day training: {e}")
        
        return sessions
    
    def extract_weight_reps(self, df: pd.DataFrame, row_idx: int, col_idx: int) -> Dict[str, Any]:
        """Extract weight, reps, sets information from adjacent cells."""
        
        result = {}
        
        try:
            # Check the cell to the right (typically contains reps)
            if col_idx + 1 < df.shape[1]:
                reps_cell = df.iloc[row_idx, col_idx + 1]
                if isinstance(reps_cell, (int, float)) and not pd.isna(reps_cell):
                    result['reps'] = reps_cell
            
            # Look for weight information in nearby cells
            for offset in [-1, 1, 2]:
                if 0 <= col_idx + offset < df.shape[1]:
                    cell = df.iloc[row_idx, col_idx + offset]
                    if isinstance(cell, (int, float)) and not pd.isna(cell):
                        if cell > 10:  # Likely weight if > 10
                            result['weight'] = cell
                        elif 'reps' not in result and cell <= 20:  # Likely reps if small number
                            result['reps'] = cell
            
            # Parse sets from exercise description if available
            exercise_text = str(df.iloc[row_idx, col_idx]).lower()
            sets_match = re.search(r'(\d+)\s*x\s*(\d+)', exercise_text)
            if sets_match:
                result['sets'] = int(sets_match.group(1))
                if 'reps' not in result:
                    result['reps'] = int(sets_match.group(2))
                    
        except Exception as e:
            print(f"Error extracting weight/reps: {e}")
        
        return result
    
    def classify_exercise(self, exercise_name: str) -> str:
        """Classify exercise into categories."""
        
        exercise_lower = exercise_name.lower()
        
        # Strength categories
        if any(term in exercise_lower for term in ['squat', 'deadlift', 'bench', 'press']):
            return 'strength'
        elif any(term in exercise_lower for term in ['clean', 'snatch', 'jerk']):
            return 'olympic_lift'
        elif any(term in exercise_lower for term in ['sprint', 'run', '100m', '60m', '30m']):
            return 'sprint'
        elif any(term in exercise_lower for term in ['jump', 'broad', 'triple']):
            return 'power'
        elif any(term in exercise_lower for term in ['drill', 'technique', 'form']):
            return 'technique'
        elif any(term in exercise_lower for term in ['jog', 'walk', 'cardio']):
            return 'aerobic'
        elif any(term in exercise_lower for term in ['stretch', 'mobility', 'warm']):
            return 'mobility'
        else:
            return 'other'
    
    def parse_performance_data(self) -> None:
        """Parse the PBs and Results sheet."""
        
        try:
            df = pd.read_excel(self.file_path, sheet_name="PBs and Results", header=None)
            
            # Look for performance metrics
            metrics = {
                '30m': None, '60m': None, '100m': None,
                'Flying 30': None, 'Triple Broad Jump': None, 'Broad Jump': None,
                'Clean': None, 'Snatch': None, 'Back Squat': None, 'Front Squat': None
            }
            
            for idx, row in df.iterrows():
                for col_idx, cell in enumerate(row):
                    if isinstance(cell, str) and cell in metrics:
                        # Look for the value in nearby cells
                        for offset in [1, 2]:
                            if idx + offset < len(df):
                                value_cell = df.iloc[idx + offset, col_idx]
                                if isinstance(value_cell, (int, float)) and not pd.isna(value_cell):
                                    metrics[cell] = value_cell
                                    break
                                elif isinstance(value_cell, str) and any(c.isdigit() for c in value_cell):
                                    # Extract number from string
                                    numbers = re.findall(r'\d+\.?\d*', value_cell)
                                    if numbers:
                                        metrics[cell] = float(numbers[0])
                                        break
            
            # Create performance test entries
            for metric, value in metrics.items():
                if value is not None:
                    test_entry = {
                        'test_name': metric,
                        'result': value,
                        'date': '2023-01-01',  # Default date, would need to be extracted properly
                        'unit': self.get_metric_unit(metric)
                    }
                    self.parsed_data['performance_tests'].append(test_entry)
                    
        except Exception as e:
            print(f"Error parsing performance data: {e}")
    
    def get_metric_unit(self, metric_name: str) -> str:
        """Get the unit for a performance metric."""
        
        if any(term in metric_name.lower() for term in ['30m', '60m', '100m', 'flying']):
            return 'seconds'
        elif 'jump' in metric_name.lower():
            return 'meters'
        elif any(term in metric_name.lower() for term in ['clean', 'snatch', 'squat']):
            return 'kg'
        else:
            return 'unknown'
    
    def parse_feedback_injuries(self) -> None:
        """Parse the Feedback and Injuries sheet."""
        
        try:
            df = pd.read_excel(self.file_path, sheet_name="Feedback and Injuries", header=None)
            
            for idx, row in df.iterrows():
                for cell in row:
                    if isinstance(cell, str) and len(cell) > 10:
                        # Check if this looks like injury or feedback text
                        cell_lower = cell.lower()
                        if any(term in cell_lower for term in ['injury', 'pain', 'sore', 'hurt']):
                            injury_entry = {
                                'description': cell,
                                'date': '2023-01-01',  # Would need proper date extraction
                                'severity': 'unknown',
                                'body_part': self.extract_body_part(cell)
                            }
                            self.parsed_data['injuries'].append(injury_entry)
                        elif any(term in cell_lower for term in ['feedback', 'coaching', 'training']):
                            # This is feedback, could be processed separately
                            pass
                            
        except Exception as e:
            print(f"Error parsing feedback/injuries: {e}")
    
    def extract_body_part(self, injury_text: str) -> str:
        """Extract body part from injury description."""
        
        text_lower = injury_text.lower()
        body_parts = {
            'back': ['back', 'spine'],
            'shoulder': ['shoulder'],
            'knee': ['knee'],
            'ankle': ['ankle'],
            'hamstring': ['hamstring'],
            'hip': ['hip'],
            'wrist': ['wrist'],
            'elbow': ['elbow']
        }
        
        for part, keywords in body_parts.items():
            if any(keyword in text_lower for keyword in keywords):
                return part
        
        return 'unknown'
    
    def parse_fartlek_data(self) -> None:
        """Parse the Fartlek training data."""
        
        try:
            df = pd.read_excel(self.file_path, sheet_name="Farhtenspeil", header=0)
            
            if 'RUN (s)' in df.columns and 'WALK (s)' in df.columns:
                fartlek_session = {
                    'type': 'fartlek',
                    'intervals': []
                }
                
                for _, row in df.iterrows():
                    if pd.notna(row['RUN (s)']) and pd.notna(row['WALK (s)']):
                        interval = {
                            'run_seconds': row['RUN (s)'],
                            'walk_seconds': row['WALK (s)']
                        }
                        fartlek_session['intervals'].append(interval)
                
                # Add as a special training session
                session_entry = {
                    'date': '2023-01-01',  # Default date
                    'exercise': 'Fartlek Training',
                    'exercise_type': 'aerobic',
                    'notes': f"Fartlek with {len(fartlek_session['intervals'])} intervals",
                    'special_data': fartlek_session
                }
                self.parsed_data['training_sessions'].append(session_entry)
                
        except Exception as e:
            print(f"Error parsing fartlek data: {e}")
    
    def parse_projected_targets(self) -> None:
        """Parse projected weight targets."""
        
        try:
            df = pd.read_excel(self.file_path, sheet_name="Projected", header=None)
            
            # Look for progression data
            progressions = {}
            
            for idx, row in df.iterrows():
                for col_idx, cell in enumerate(row):
                    if isinstance(cell, str) and cell in ['SQUATS', 'SNATCH', 'CLEANS']:
                        # Extract progression values
                        values = []
                        for offset in range(1, 10):
                            if col_idx + offset < df.shape[1]:
                                value_cell = df.iloc[idx, col_idx + offset]
                                if isinstance(value_cell, (int, float)) and not pd.isna(value_cell):
                                    values.append(value_cell)
                        
                        if values:
                            progressions[cell] = values
            
            # Store as periodization data
            for exercise, values in progressions.items():
                period_entry = {
                    'exercise': exercise,
                    'type': 'projected_progression',
                    'values': values,
                    'sessions': list(range(1, len(values) + 1))
                }
                self.parsed_data['periodization'].append(period_entry)
                
        except Exception as e:
            print(f"Error parsing projected targets: {e}")
    
    def generate_summary_statistics(self) -> Dict[str, Any]:
        """Generate summary statistics of the parsed data."""
        
        stats = {
            'total_training_sessions': len(self.parsed_data['training_sessions']),
            'unique_exercises': len(self.parsed_data['exercises']),
            'performance_tests': len(self.parsed_data['performance_tests']),
            'injury_records': len(self.parsed_data['injuries']),
            'exercise_type_distribution': {},
            'training_frequency_by_plan': {},
            'weight_progression_analysis': {}
        }
        
        # Exercise type distribution
        exercise_types = [session.get('exercise_type', 'unknown') for session in self.parsed_data['training_sessions']]
        for ex_type in set(exercise_types):
            stats['exercise_type_distribution'][ex_type] = exercise_types.count(ex_type)
        
        # Training frequency by plan
        plans = [session.get('plan', 0) for session in self.parsed_data['training_sessions']]
        for plan in set(plans):
            stats['training_frequency_by_plan'][f'Plan_{plan}'] = plans.count(plan)
        
        # Weight progression analysis for major lifts
        major_lifts = ['squat', 'clean', 'snatch', 'deadlift']
        for lift in major_lifts:
            lift_sessions = [s for s in self.parsed_data['training_sessions'] 
                           if lift in str(s.get('exercise', '')).lower() and s.get('weight_kg')]
            if lift_sessions:
                weights = [s['weight_kg'] for s in lift_sessions if s.get('weight_kg')]
                if weights:
                    stats['weight_progression_analysis'][lift] = {
                        'min_weight': min(weights),
                        'max_weight': max(weights),
                        'avg_weight': sum(weights) / len(weights),
                        'total_sessions': len(lift_sessions)
                    }
        
        return stats


def main():
    """Main function to run the parser."""
    
    file_path = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/Joshua Hudson Training Template.xlsx"
    
    parser = JoshuaTrainingDataParser(file_path)
    
    # Parse all data
    parsed_data = parser.parse_all_sheets()
    
    # Generate summary statistics
    stats = parser.generate_summary_statistics()
    
    # Save parsed data
    output_file = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend/joshua_parsed_training_data.json"
    with open(output_file, 'w') as f:
        json.dump(parsed_data, f, indent=2, default=str)
    
    # Save summary statistics
    stats_file = "/home/kopacz/Development/existing-projects/bobsleigh-coach-ai/backend/joshua_training_stats.json"
    with open(stats_file, 'w') as f:
        json.dump(stats, f, indent=2, default=str)
    
    # Print summary
    print("\n" + "="*60)
    print("JOSHUA HUDSON TRAINING DATA PARSING COMPLETE")
    print("="*60)
    
    print(f"\nData Summary:")
    print(f"Total Training Sessions: {stats['total_training_sessions']}")
    print(f"Unique Exercises: {stats['unique_exercises']}")
    print(f"Performance Tests: {stats['performance_tests']}")
    print(f"Injury Records: {stats['injury_records']}")
    
    print(f"\nExercise Type Distribution:")
    for ex_type, count in stats['exercise_type_distribution'].items():
        print(f"  {ex_type}: {count} sessions")
    
    print(f"\nTraining Plan Distribution:")
    for plan, count in stats['training_frequency_by_plan'].items():
        print(f"  {plan}: {count} sessions")
    
    print(f"\nWeight Progression Analysis:")
    for lift, data in stats['weight_progression_analysis'].items():
        print(f"  {lift.title()}:")
        print(f"    Range: {data['min_weight']:.1f} - {data['max_weight']:.1f} kg")
        print(f"    Average: {data['avg_weight']:.1f} kg")
        print(f"    Sessions: {data['total_sessions']}")
    
    print(f"\nOutput files:")
    print(f"  Parsed data: {output_file}")
    print(f"  Statistics: {stats_file}")
    
    print(f"\nSample exercises found:")
    for i, exercise in enumerate(list(parsed_data['exercises'])[:10]):
        print(f"  {i+1}. {exercise}")
    
    if len(parsed_data['exercises']) > 10:
        print(f"  ... and {len(parsed_data['exercises']) - 10} more exercises")


if __name__ == "__main__":
    main()