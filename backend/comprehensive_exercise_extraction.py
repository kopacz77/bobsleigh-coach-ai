#!/usr/bin/env python3
"""
Comprehensive Exercise Library Extraction from Joshua Hudson Training Data

This script thoroughly analyzes the Joshua Hudson Excel file to extract:
1. Complete exercise library with all unique exercises
2. Training protocols (Fartlek, sprints, strength progressions)
3. Exercise categorization and bobsleigh-specific relevance
4. Progressive variations and load progressions
5. Training templates and session structures
"""

import pandas as pd
import json
import re
from typing import Dict, List, Set, Any, Tuple
from collections import defaultdict, Counter
import uuid
from datetime import datetime, timedelta

class ComprehensiveExerciseExtractor:
    def __init__(self, excel_file: str):
        self.excel_file = excel_file
        self.exercise_library = {}
        self.training_protocols = {}
        self.exercise_progressions = {}
        self.training_templates = {}
        
        # Exercise categories based on bobsleigh training
        self.exercise_categories = {
            'olympic_lifts': ['clean', 'snatch', 'jerk', 'c&j'],
            'strength': ['squat', 'deadlift', 'press', 'row', 'pull'],
            'power': ['jump', 'throw', 'bound', 'hop', 'plyometric'],
            'sprint': ['sprint', 'm', 'dash', 'fly', 'block'],
            'technique': ['drill', 'technique', 'skill', 'start'],
            'aerobic': ['jog', 'run', 'bike', 'row', 'fartlek'],
            'recovery': ['stretch', 'massage', 'foam', 'mobility', 'warm'],
            'core': ['core', 'abs', 'plank', 'bridge'],
            'bobsleigh_specific': ['push', 'sled', 'start', 'drive']
        }
        
        # Load progression patterns
        self.load_patterns = {
            'percentage': r'(\d+)%',
            'weight_kg': r'(\d+(?:\.\d+)?)\s*kg',
            'reps': r'(\d+)\s*x\s*(\d+)',
            'sets_reps': r'(\d+)\s*x\s*(\d+)',
            'time': r'(\d+):(\d+)',
            'distance': r'(\d+)\s*m'
        }

    def extract_all_data(self) -> Dict[str, Any]:
        """Main extraction method"""
        print("Loading Excel file...")
        excel_data = pd.read_excel(self.excel_file, sheet_name=None)
        
        print("Extracting training plans...")
        self._extract_training_plans(excel_data)
        
        print("Extracting protocols...")
        self._extract_protocols(excel_data)
        
        print("Extracting performance standards...")
        self._extract_performance_standards(excel_data)
        
        print("Categorizing exercises...")
        self._categorize_exercises()
        
        print("Creating progressions...")
        self._create_progressions()
        
        print("Building training templates...")
        self._build_training_templates()
        
        return {
            'exercise_library': self.exercise_library,
            'training_protocols': self.training_protocols,
            'exercise_progressions': self.exercise_progressions,
            'training_templates': self.training_templates,
            'extraction_metadata': {
                'total_exercises': len(self.exercise_library),
                'total_protocols': len(self.training_protocols),
                'extraction_date': datetime.now().isoformat(),
                'source_file': self.excel_file
            }
        }

    def _extract_training_plans(self, excel_data: Dict[str, pd.DataFrame]):
        """Extract exercises from all training plan sheets"""
        training_sheets = [sheet for sheet in excel_data.keys() if 'Training Plan' in sheet]
        
        for sheet_name in training_sheets:
            print(f"Processing {sheet_name}...")
            df = excel_data[sheet_name]
            year = self._extract_year_from_sheet(sheet_name, df)
            
            # Process each week in the training plan
            self._process_training_plan_sheet(df, year, sheet_name)

    def _process_training_plan_sheet(self, df: pd.DataFrame, year: str, sheet_name: str):
        """Process individual training plan sheet"""
        current_week = None
        current_day = None
        
        for idx, row in df.iterrows():
            row_data = row.fillna('').astype(str)
            
            # Check for week indicator
            if 'Week' in str(row_data.iloc[0]) and any(str(val).isdigit() for val in row_data):
                current_week = self._extract_week_number(row_data)
                continue
            
            # Check for day indicator
            day_match = self._extract_day_info(row_data)
            if day_match:
                current_day = day_match
                continue
            
            # Extract exercises from the row
            exercises = self._extract_exercises_from_row(row_data, current_week, current_day, year)
            for exercise in exercises:
                self._add_to_exercise_library(exercise)

    def _extract_exercises_from_row(self, row_data: pd.Series, week: str, day: str, year: str) -> List[Dict]:
        """Extract exercises from a single row"""
        exercises = []
        
        for i, cell_value in enumerate(row_data):
            cell_str = str(cell_value).strip()
            if cell_str and cell_str != 'nan' and len(cell_str) > 1:
                
                # Check if it's an exercise name
                if self._is_exercise_name(cell_str):
                    exercise = {
                        'name': self._standardize_exercise_name(cell_str),
                        'original_name': cell_str,
                        'week': week,
                        'day': day,
                        'year': year,
                        'load_data': self._extract_load_from_adjacent_cells(row_data, i),
                        'category': self._categorize_exercise(cell_str),
                        'equipment': self._extract_equipment(cell_str),
                        'bobsleigh_relevance': self._assess_bobsleigh_relevance(cell_str)
                    }
                    exercises.append(exercise)
        
        return exercises

    def _is_exercise_name(self, text: str) -> bool:
        """Determine if text represents an exercise name"""
        # Skip obvious non-exercises
        skip_terms = ['week', 'day', 'type', 'weight', 'reps', 'kg', 'notes', 'nan']
        if any(term in text.lower() for term in skip_terms):
            return False
        
        # Skip pure numbers or dates
        if text.replace('.', '').replace('-', '').replace(':', '').isdigit():
            return False
        
        # Must have alphabetic characters
        if not re.search(r'[a-zA-Z]', text):
            return False
        
        return len(text) > 2

    def _standardize_exercise_name(self, name: str) -> str:
        """Standardize exercise names"""
        name = name.strip().lower()
        
        # Common standardizations
        standardizations = {
            'front sq slow': 'front squat slow',
            'front sq': 'front squat',
            'back sq': 'back squat',
            'cleans from block': 'power clean from blocks',
            'snatch from blocks': 'power snatch from blocks',
            'running shoes': 'running',
            'focussed drill': 'technique drills',
            'hurldes': 'hurdles',
            'bounds': 'bounding',
            'stairs': 'stair running'
        }
        
        for old, new in standardizations.items():
            if old in name:
                name = name.replace(old, new)
        
        return name.title()

    def _categorize_exercise(self, exercise_name: str) -> str:
        """Categorize exercise based on name"""
        name_lower = exercise_name.lower()
        
        for category, keywords in self.exercise_categories.items():
            if any(keyword in name_lower for keyword in keywords):
                return category
        
        return 'general'

    def _extract_load_from_adjacent_cells(self, row_data: pd.Series, exercise_index: int) -> Dict:
        """Extract load information from cells adjacent to exercise name"""
        load_data = {}
        
        # Check next few cells for weight/reps data
        for i in range(exercise_index + 1, min(exercise_index + 4, len(row_data))):
            cell_value = str(row_data.iloc[i]).strip()
            
            if cell_value and cell_value != 'nan':
                # Try to parse as weight
                if self._is_weight(cell_value):
                    load_data['weight_kg'] = float(cell_value)
                
                # Try to parse as reps
                elif self._is_reps(cell_value):
                    load_data['reps'] = int(cell_value)
                
                # Try to parse as sets x reps
                elif 'x' in cell_value:
                    sets_reps = self._parse_sets_reps(cell_value)
                    if sets_reps:
                        load_data.update(sets_reps)
                
                # Try to parse as time
                elif ':' in cell_value or 'min' in cell_value:
                    time_data = self._parse_time(cell_value)
                    if time_data:
                        load_data.update(time_data)
        
        return load_data

    def _extract_protocols(self, excel_data: Dict[str, pd.DataFrame]):
        """Extract specific training protocols like Fartlek"""
        if 'Farhtenspeil' in excel_data:
            fartlek_df = excel_data['Farhtenspeil']
            self._extract_fartlek_protocol(fartlek_df)
        
        # Extract other protocols from training plans
        self._extract_sprint_protocols()
        self._extract_strength_protocols()

    def _extract_fartlek_protocol(self, df: pd.DataFrame):
        """Extract the complete Fartlek protocol"""
        intervals = []
        
        for idx, row in df.iterrows():
            if idx == 0:  # Skip header
                continue
            
            run_time = row.iloc[0] if not pd.isna(row.iloc[0]) else None
            walk_time = row.iloc[1] if not pd.isna(row.iloc[1]) else None
            
            if run_time and walk_time:
                intervals.append({
                    'run_seconds': int(run_time),
                    'walk_seconds': int(walk_time),
                    'work_rest_ratio': round(float(run_time) / float(walk_time), 2)
                })
        
        self.training_protocols['fartlek_standard'] = {
            'name': 'Standard Fartlek Protocol',
            'type': 'aerobic_interval',
            'description': 'Progressive interval training with varying work-rest periods',
            'intervals': intervals,
            'total_intervals': len(intervals),
            'total_duration_minutes': sum(i['run_seconds'] + i['walk_seconds'] for i in intervals) / 60,
            'equipment': ['running_shoes'],
            'intensity': 'moderate_to_high',
            'bobsleigh_relevance': 'high',
            'purpose': 'aerobic_capacity_and_recovery'
        }

    def _extract_performance_standards(self, excel_data: Dict[str, pd.DataFrame]):
        """Extract performance standards and benchmarks"""
        if 'PBs and Results' in excel_data:
            pb_df = excel_data['PBs and Results']
            self._process_performance_benchmarks(pb_df)

    def _process_performance_benchmarks(self, df: pd.DataFrame):
        """Process performance benchmark data"""
        benchmarks = {}
        
        # Extract key performance metrics
        performance_tests = [
            ('30m', 'sprint', 'seconds'),
            ('60m', 'sprint', 'seconds'),
            ('100m', 'sprint', 'seconds'),
            ('Flying 30', 'sprint', 'seconds'),
            ('Triple Broad Jump', 'power', 'meters'),
            ('Broad Jump', 'power', 'meters'),
            ('Clean', 'strength', 'kg'),
            ('Snatch', 'strength', 'kg'),
            ('Back Squat', 'strength', 'kg'),
            ('Front Squat', 'strength', 'kg')
        ]
        
        for test_name, category, unit in performance_tests:
            # Find the test in the dataframe
            result = self._find_performance_result(df, test_name)
            if result:
                benchmarks[test_name.lower().replace(' ', '_')] = {
                    'name': test_name,
                    'category': category,
                    'unit': unit,
                    'personal_best': result,
                    'test_protocol': self._get_test_protocol(test_name),
                    'bobsleigh_relevance': self._get_test_relevance(test_name)
                }
        
        self.training_protocols['performance_benchmarks'] = benchmarks

    def _add_to_exercise_library(self, exercise: Dict):
        """Add exercise to the comprehensive library"""
        exercise_name = exercise['name']
        
        if exercise_name not in self.exercise_library:
            self.exercise_library[exercise_name] = {
                'id': str(uuid.uuid4()),
                'name': exercise_name,
                'category': exercise['category'],
                'equipment': exercise.get('equipment', []),
                'bobsleigh_relevance': exercise['bobsleigh_relevance'],
                'variations': [],
                'load_progressions': [],
                'typical_sets_reps': [],
                'notes': [],
                'training_phases': [],
                'first_seen': exercise['year']
            }
        
        # Add variation if different
        if exercise['original_name'] not in [v['name'] for v in self.exercise_library[exercise_name]['variations']]:
            self.exercise_library[exercise_name]['variations'].append({
                'name': exercise['original_name'],
                'load_data': exercise['load_data'],
                'year': exercise['year'],
                'week': exercise['week'],
                'day': exercise['day']
            })
        
        # Add load progression data
        if exercise['load_data']:
            self.exercise_library[exercise_name]['load_progressions'].append(exercise['load_data'])

    def _categorize_exercises(self):
        """Post-process exercise categorization"""
        for exercise_name, exercise_data in self.exercise_library.items():
            # Refine category based on variations and context
            exercise_data['refined_category'] = self._refine_exercise_category(exercise_name, exercise_data)
            
            # Add training recommendations
            exercise_data['training_recommendations'] = self._get_training_recommendations(exercise_name, exercise_data)

    def _create_progressions(self):
        """Create exercise progression patterns"""
        for exercise_name, exercise_data in self.exercise_library.items():
            if exercise_data['load_progressions']:
                progression = self._analyze_load_progression(exercise_data['load_progressions'])
                self.exercise_progressions[exercise_name] = progression

    def _build_training_templates(self):
        """Build common training session templates"""
        # Analyze patterns across all exercises to create templates
        self.training_templates = {
            'strength_day': self._create_strength_template(),
            'power_day': self._create_power_template(),
            'speed_day': self._create_speed_template(),
            'recovery_day': self._create_recovery_template(),
            'competition_prep': self._create_competition_template()
        }

    # Helper methods
    def _extract_year_from_sheet(self, sheet_name: str, df: pd.DataFrame) -> str:
        """Extract year from sheet name or data"""
        if 'Training Plan 1' in sheet_name:
            return '2023'
        elif 'Training Plan 2' in sheet_name:
            return '2024'
        elif 'Training Plan 3' in sheet_name:
            return '2025'
        return 'unknown'

    def _extract_week_number(self, row_data: pd.Series) -> str:
        """Extract week number from row data"""
        for val in row_data:
            if isinstance(val, (int, float)) and 1 <= val <= 52:
                return str(int(val))
        return 'unknown'

    def _extract_day_info(self, row_data: pd.Series) -> str:
        """Extract day information from row data"""
        for val in row_data:
            val_str = str(val).lower()
            if 'day' in val_str:
                return val_str
        return None

    def _is_weight(self, value: str) -> bool:
        """Check if value represents a weight"""
        try:
            float(value)
            return True
        except:
            return False

    def _is_reps(self, value: str) -> bool:
        """Check if value represents reps"""
        try:
            num = int(value)
            return 1 <= num <= 50  # Reasonable rep range
        except:
            return False

    def _parse_sets_reps(self, value: str) -> Dict:
        """Parse sets x reps format"""
        match = re.match(r'(\d+)\s*x\s*(\d+)', value)
        if match:
            return {
                'sets': int(match.group(1)),
                'reps': int(match.group(2))
            }
        return {}

    def _parse_time(self, value: str) -> Dict:
        """Parse time duration"""
        if 'min' in value:
            match = re.search(r'(\d+)\s*min', value)
            if match:
                return {'duration_minutes': int(match.group(1))}
        elif ':' in value:
            match = re.search(r'(\d+):(\d+)', value)
            if match:
                return {'duration_seconds': int(match.group(1)) * 60 + int(match.group(2))}
        return {}

    def _extract_equipment(self, exercise_name: str) -> List[str]:
        """Extract equipment needed for exercise"""
        equipment = []
        name_lower = exercise_name.lower()
        
        equipment_map = {
            'barbell': ['squat', 'deadlift', 'clean', 'snatch', 'press', 'row'],
            'dumbbells': ['dumbbell', 'db'],
            'running_shoes': ['running', 'sprint', 'jog'],
            'hurdles': ['hurdle', 'hurldes'],
            'blocks': ['block'],
            'sled': ['sled', 'push'],
            'stairs': ['stair']
        }
        
        for equip, keywords in equipment_map.items():
            if any(keyword in name_lower for keyword in keywords):
                equipment.append(equip)
        
        return equipment if equipment else ['bodyweight']

    def _assess_bobsleigh_relevance(self, exercise_name: str) -> str:
        """Assess relevance to bobsleigh performance"""
        name_lower = exercise_name.lower()
        
        high_relevance = ['push', 'start', 'sprint', 'clean', 'squat', 'jump']
        medium_relevance = ['snatch', 'deadlift', 'bound', 'hurdle']
        
        if any(term in name_lower for term in high_relevance):
            return 'high'
        elif any(term in name_lower for term in medium_relevance):
            return 'medium'
        else:
            return 'low'

    def _find_performance_result(self, df: pd.DataFrame, test_name: str) -> float:
        """Find performance result in the PB dataframe"""
        for idx, row in df.iterrows():
            if test_name.lower() in str(row.iloc[0]).lower():
                for val in row:
                    if isinstance(val, (int, float)) and not pd.isna(val):
                        return float(val)
        return None

    def _get_test_protocol(self, test_name: str) -> str:
        """Get testing protocol for performance test"""
        protocols = {
            '30m': 'Standing start, electronic timing',
            '60m': 'Standing start, electronic timing',
            '100m': 'Standing start, electronic timing',
            'Flying 30': '30m flying start after 20m acceleration',
            'Triple Broad Jump': 'Standing triple jump for distance',
            'Broad Jump': 'Standing broad jump for distance',
            'Clean': '1RM or 3RM power clean from floor',
            'Snatch': '1RM or 2RM power snatch from floor',
            'Back Squat': '1RM back squat, full depth',
            'Front Squat': '1RM front squat, full depth'
        }
        return protocols.get(test_name, 'Standard testing protocol')

    def _get_test_relevance(self, test_name: str) -> str:
        """Get bobsleigh relevance for performance test"""
        relevance = {
            '30m': 'Very High - Direct correlation to push start',
            '60m': 'High - Extended push phase performance',
            '100m': 'Medium - General sprint capacity',
            'Flying 30': 'Medium - Top speed assessment',
            'Triple Broad Jump': 'High - Power and coordination',
            'Broad Jump': 'High - Single effort power',
            'Clean': 'Very High - Power development',
            'Snatch': 'High - Rate of force development',
            'Back Squat': 'High - Leg strength foundation',
            'Front Squat': 'High - Functional leg strength'
        }
        return relevance.get(test_name, 'Medium - General fitness')

    def _refine_exercise_category(self, exercise_name: str, exercise_data: Dict) -> str:
        """Refine exercise category based on context"""
        return exercise_data['category']  # Placeholder for more sophisticated logic

    def _get_training_recommendations(self, exercise_name: str, exercise_data: Dict) -> Dict:
        """Get training recommendations for exercise"""
        category = exercise_data['category']
        
        recommendations = {
            'olympic_lifts': {
                'frequency_per_week': '2-3',
                'intensity_range': '70-95% 1RM',
                'volume_range': '3-6 sets of 1-3 reps',
                'training_phase': 'All phases, emphasis in strength/power'
            },
            'strength': {
                'frequency_per_week': '2-3',
                'intensity_range': '70-90% 1RM',
                'volume_range': '3-5 sets of 3-8 reps',
                'training_phase': 'Base and strength phases'
            },
            'power': {
                'frequency_per_week': '2-3',
                'intensity_range': 'Maximal effort',
                'volume_range': '3-5 sets of 3-6 reps',
                'training_phase': 'Power and competition phases'
            },
            'sprint': {
                'frequency_per_week': '2-4',
                'intensity_range': '90-100% max speed',
                'volume_range': '4-8 runs with full recovery',
                'training_phase': 'Speed and competition phases'
            }
        }
        
        return recommendations.get(category, {
            'frequency_per_week': '1-2',
            'intensity_range': 'Moderate',
            'volume_range': 'As needed',
            'training_phase': 'All phases'
        })

    def _analyze_load_progression(self, load_data: List[Dict]) -> Dict:
        """Analyze load progression patterns"""
        weights = [load.get('weight_kg') for load in load_data if load.get('weight_kg')]
        
        if len(weights) > 1:
            progression_rate = (max(weights) - min(weights)) / len(weights)
            return {
                'min_weight': min(weights),
                'max_weight': max(weights),
                'average_progression_kg_per_session': round(progression_rate, 1),
                'total_progression_kg': max(weights) - min(weights),
                'progression_pattern': 'linear' if progression_rate > 0 else 'varied'
            }
        
        return {}

    def _create_strength_template(self) -> Dict:
        """Create strength training day template"""
        return {
            'name': 'Strength Training Day',
            'duration_minutes': '60-90',
            'structure': [
                {'phase': 'warm_up', 'duration': '10-15 min', 'exercises': ['general_mobility', 'dynamic_stretching']},
                {'phase': 'main_lifts', 'duration': '30-40 min', 'exercises': ['squat_variation', 'olympic_lift']},
                {'phase': 'accessory', 'duration': '15-20 min', 'exercises': ['core', 'stability']},
                {'phase': 'cool_down', 'duration': '5-10 min', 'exercises': ['static_stretching']}
            ],
            'frequency_per_week': '2-3',
            'intensity': 'High',
            'volume': 'Medium-High'
        }

    def _create_power_template(self) -> Dict:
        """Create power training day template"""
        return {
            'name': 'Power Training Day',
            'duration_minutes': '45-75',
            'structure': [
                {'phase': 'warm_up', 'duration': '15-20 min', 'exercises': ['dynamic_warm_up', 'activation']},
                {'phase': 'power_development', 'duration': '25-35 min', 'exercises': ['jumps', 'throws', 'olympic_lifts']},
                {'phase': 'speed_strength', 'duration': '10-15 min', 'exercises': ['light_resistance_sprints']},
                {'phase': 'recovery', 'duration': '5-10 min', 'exercises': ['light_mobility']}
            ],
            'frequency_per_week': '2-3',
            'intensity': 'Very High',
            'volume': 'Low-Medium'
        }

    def _create_speed_template(self) -> Dict:
        """Create speed training day template"""
        return {
            'name': 'Speed Training Day',
            'duration_minutes': '45-60',
            'structure': [
                {'phase': 'warm_up', 'duration': '20-25 min', 'exercises': ['progressive_running', 'drills']},
                {'phase': 'acceleration', 'duration': '15-20 min', 'exercises': ['short_sprints', 'starts']},
                {'phase': 'max_velocity', 'duration': '10-15 min', 'exercises': ['flying_sprints']},
                {'phase': 'cool_down', 'duration': '10 min', 'exercises': ['easy_jogging', 'stretching']}
            ],
            'frequency_per_week': '2-3',
            'intensity': 'Very High',
            'volume': 'Low'
        }

    def _create_recovery_template(self) -> Dict:
        """Create recovery training day template"""
        return {
            'name': 'Recovery Training Day',
            'duration_minutes': '30-60',
            'structure': [
                {'phase': 'active_recovery', 'duration': '20-30 min', 'exercises': ['light_jogging', 'easy_bike']},
                {'phase': 'mobility', 'duration': '15-20 min', 'exercises': ['stretching', 'foam_rolling']},
                {'phase': 'corrective', 'duration': '10-15 min', 'exercises': ['activation', 'stability']}
            ],
            'frequency_per_week': '1-2',
            'intensity': 'Very Low',
            'volume': 'Low'
        }

    def _create_competition_template(self) -> Dict:
        """Create competition preparation template"""
        return {
            'name': 'Competition Preparation',
            'duration_minutes': '45-60',
            'structure': [
                {'phase': 'specific_warm_up', 'duration': '15-20 min', 'exercises': ['push_start_practice', 'technique_drills']},
                {'phase': 'competition_simulation', 'duration': '20-25 min', 'exercises': ['race_pace_efforts', 'starts']},
                {'phase': 'fine_tuning', 'duration': '10-15 min', 'exercises': ['technique_refinement']},
                {'phase': 'preparation', 'duration': '5-10 min', 'exercises': ['mental_preparation', 'light_stretching']}
            ],
            'frequency_per_week': '2-3',
            'intensity': 'Competition Specific',
            'volume': 'Low-Medium'
        }

    def _extract_sprint_protocols(self):
        """Extract sprint training protocols from data"""
        # Extract from exercise library
        sprint_exercises = {name: data for name, data in self.exercise_library.items() 
                          if data.get('category') == 'sprint'}
        
        if sprint_exercises:
            self.training_protocols['sprint_protocols'] = {
                'short_acceleration': {
                    'distances': ['10m', '20m', '30m'],
                    'purpose': 'Start and early acceleration',
                    'rest_periods': '90-120 seconds between reps',
                    'volume': '6-10 reps',
                    'intensity': '100% effort'
                },
                'speed_development': {
                    'distances': ['40m', '50m', '60m'],
                    'purpose': 'Maximum velocity development',
                    'rest_periods': '2-3 minutes between reps',
                    'volume': '4-6 reps',
                    'intensity': '98-100% effort'
                },
                'flying_sprints': {
                    'distances': ['30m flying', '40m flying'],
                    'purpose': 'Top speed maintenance',
                    'rest_periods': '3-4 minutes between reps',
                    'volume': '3-5 reps',
                    'intensity': '100% effort'
                }
            }

    def _extract_strength_protocols(self):
        """Extract strength training protocols"""
        strength_exercises = {name: data for name, data in self.exercise_library.items() 
                            if data.get('category') in ['strength', 'olympic_lifts']}
        
        if strength_exercises:
            self.training_protocols['strength_protocols'] = {
                'max_strength': {
                    'intensity': '85-100% 1RM',
                    'sets': '3-6',
                    'reps': '1-5',
                    'rest': '3-5 minutes',
                    'exercises': ['Back Squat', 'Front Squat', 'Deadlift']
                },
                'power_development': {
                    'intensity': '70-85% 1RM',
                    'sets': '3-5',
                    'reps': '1-3',
                    'rest': '3-4 minutes',
                    'exercises': ['Power Clean', 'Power Snatch']
                },
                'strength_endurance': {
                    'intensity': '65-80% 1RM',
                    'sets': '3-4',
                    'reps': '6-12',
                    'rest': '2-3 minutes',
                    'exercises': ['Squat variations', 'Press variations']
                }
            }

def main():
    """Main execution function"""
    extractor = ComprehensiveExerciseExtractor('../Joshua Hudson Training Template.xlsx')
    
    try:
        print("Starting comprehensive exercise extraction...")
        data = extractor.extract_all_data()
        
        # Save exercise library
        with open('exercises_library.json', 'w') as f:
            json.dump(data['exercise_library'], f, indent=2, default=str)
        print(f"✓ Saved exercise library with {len(data['exercise_library'])} exercises")
        
        # Save training protocols
        with open('training_protocols.json', 'w') as f:
            json.dump(data['training_protocols'], f, indent=2, default=str)
        print(f"✓ Saved training protocols with {len(data['training_protocols'])} protocols")
        
        # Save exercise progressions
        with open('exercise_progressions.json', 'w') as f:
            json.dump(data['exercise_progressions'], f, indent=2, default=str)
        print(f"✓ Saved exercise progressions for {len(data['exercise_progressions'])} exercises")
        
        # Save training templates
        with open('training_templates.json', 'w') as f:
            json.dump(data['training_templates'], f, indent=2, default=str)
        print(f"✓ Saved {len(data['training_templates'])} training templates")
        
        # Save complete dataset
        with open('comprehensive_joshua_exercise_data.json', 'w') as f:
            json.dump(data, f, indent=2, default=str)
        print("✓ Saved comprehensive dataset")
        
        # Print summary
        print("\n" + "="*50)
        print("EXTRACTION SUMMARY")
        print("="*50)
        print(f"Total exercises extracted: {len(data['exercise_library'])}")
        print(f"Training protocols: {len(data['training_protocols'])}")
        print(f"Exercise progressions: {len(data['exercise_progressions'])}")
        print(f"Training templates: {len(data['training_templates'])}")
        
        # Show exercise categories
        categories = {}
        for exercise_data in data['exercise_library'].values():
            cat = exercise_data.get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        print("\nExercise categories:")
        for cat, count in sorted(categories.items()):
            print(f"  {cat}: {count} exercises")
        
        return data
        
    except Exception as e:
        print(f"Error during extraction: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    main()