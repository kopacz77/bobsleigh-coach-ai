#!/usr/bin/env python3
"""
Final Joshua Hudson Exercise Deduplication Script
===============================================

This script uses manual inspection of Joshua's actual exercise data to create
a clean, properly deduplicated exercise library focused on his real training.

Based on analysis of 912 exercise entries with 814 unique names (mostly 2x frequency).
"""

import json
import re
from collections import defaultdict, Counter
from typing import Dict, List, Set, Optional
import uuid
from datetime import datetime

class FinalExerciseDeduplicator:
    
    def __init__(self):
        # Build comprehensive mapping based on actual Joshua Hudson data
        self.exercise_mapping = self._build_exercise_mapping()
        self.bobsleigh_priorities = self._build_bobsleigh_priorities()
        
    def _build_exercise_mapping(self) -> Dict[str, Dict]:
        """Manual mapping based on Joshua's actual exercise data."""
        return {
            # OLYMPIC LIFTS (Very High Priority for Bobsleigh)
            'Power Clean': {
                'aliases': [
                    'Power Clean', 'PC', 'P Clean', 'Power Cleans', 'Clean (Power)',
                    'Cleans (Power)', 'power clean', 'pc', 'p clean', 'power cleans'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Quadriceps', 'Traps'],
                'notes': ['Essential for bobsleigh push start power', 'Focus on explosive hip extension']
            },
            
            'Power Clean from Blocks': {
                'aliases': [
                    'Clean from Blocks', 'Cleans from Blocks', 'Power Clean from Block',
                    'Clean from Block', 'PC from Blocks', 'clean from blocks', 'cleans from block'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Barbell', 'Plates', 'Blocks'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Quadriceps', 'Traps'],
                'notes': ['Emphasizes power from mid-thigh position', 'Mimics bobsleigh push start mechanics']
            },
            
            'Full Clean': {
                'aliases': [
                    'Full Clean', 'Clean (Full)', 'Cleans Full', 'Cleans (Full)',
                    'full clean', 'clean full'
                ],
                'category': 'Olympic Lifts', 
                'bobsleigh_relevance': 'high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Quadriceps', 'Traps'],
                'notes': ['Full squat receiving position', 'Develops mobility and power']
            },
            
            'Hang Clean': {
                'aliases': [
                    'Hang Clean', 'Hang Cleans', 'Clean Hang', 'hang clean', 'hang cleans'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Quadriceps', 'Traps'],
                'notes': ['Emphasizes pull from hang position', 'Good for learning timing']
            },
            
            'Power Snatch': {
                'aliases': [
                    'Power Snatch', 'PS', 'P Snatch', 'Snatch (Power)', 'power snatch',
                    'ps', 'p snatch'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Shoulders', 'Traps'],
                'notes': ['Develops rate of force development', 'Important for explosive power']
            },
            
            'Power Snatch from Blocks': {
                'aliases': [
                    'Snatch from Blocks', 'Power Snatch from Block', 'PS from Blocks',
                    'snatch from blocks', 'snatch from block'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Barbell', 'Plates', 'Blocks'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Shoulders', 'Traps'],
                'notes': ['Mid-thigh power development', 'Excellent for bobsleigh athletes']
            },
            
            'Full Snatch': {
                'aliases': [
                    'Full Snatch', 'Snatch (Full)', 'full snatch', 'snatch full'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Shoulders', 'Traps'],
                'notes': ['Full overhead squat receiving position']
            },
            
            'Hang Snatch': {
                'aliases': [
                    'Hang Snatch', 'hang snatch'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Glutes', 'Hamstrings', 'Shoulders', 'Traps'],
                'notes': ['Hang position snatch variation']
            },
            
            'Clean & Jerk': {
                'aliases': [
                    'Clean and Jerk', 'Clean & Jerk', 'Clean+Jerk', 'clean and jerk'
                ],
                'category': 'Olympic Lifts',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Full Body'],
                'notes': ['Complete Olympic lift movement']
            },
            
            # SQUATS (Very High Priority for Bobsleigh)
            'Front Squat': {
                'aliases': [
                    'Front Squat', 'FS', 'F Squat', 'Front', 'front squat', 'fs'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Core'],
                'notes': ['Essential for bobsleigh leg strength', 'Maintains upright torso position']
            },
            
            'Front Squat (Tempo)': {
                'aliases': [
                    'Front Squat Slow', 'Front SQ SLOW', 'Front Squat (Slow)',
                    'front squat slow', 'front sq slow'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Core'],
                'notes': ['Tempo variation for control and strength endurance']
            },
            
            'Back Squat': {
                'aliases': [
                    'Back Squat', 'BS', 'B Squat', 'Squat', 'Squats!!!', 'back squat', 'squat'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'high',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Hamstrings'],
                'notes': ['Foundation strength movement', 'Higher loading potential than front squat']
            },
            
            'Overhead Squat': {
                'aliases': [
                    'Overhead Squat', 'OH Squat', 'Overhead Squat Slow', 'overhead squat'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Shoulders', 'Core'],
                'notes': ['Mobility and stability exercise']
            },
            
            'Bulgarian Split Squat': {
                'aliases': [
                    'Bulgarian Split Squat', 'Bulgarian Split', 'Bulgarian Split Sq Slow',
                    'bulgarian split squat', 'bulgarian split'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'high',
                'equipment': ['Dumbbells', 'Bench'],
                'primary_muscles': ['Quadriceps', 'Glutes'],
                'notes': ['Unilateral leg strength', 'Addresses imbalances']
            },
            
            'Jump Squats': {
                'aliases': [
                    'Jump Squats', 'jump squats'
                ],
                'category': 'Squats',
                'bobsleigh_relevance': 'high',
                'equipment': ['Bodyweight'],
                'primary_muscles': ['Quadriceps', 'Glutes'],
                'notes': ['Explosive squat variation', 'Power development']
            },
            
            # SPRINTS (Very High Priority for Bobsleigh)
            '30m Sprint': {
                'aliases': [
                    '30m Sprint', '30m', '30 m', '30 meter', '30 meters', '30metre',
                    '30m sprint', '30 m sprint'
                ],
                'category': 'Sprints',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Track', 'Spikes'],
                'primary_muscles': ['Hamstrings', 'Glutes', 'Calves'],
                'notes': ['PRIMARY bobsleigh distance', 'Focus on acceleration and drive phase']
            },
            
            '60m Sprint': {
                'aliases': [
                    '60m Sprint', '60m', '60 m', '60 meter', '60 meters',
                    '60m sprint', '60 m sprint'
                ],
                'category': 'Sprints',
                'bobsleigh_relevance': 'high',
                'equipment': ['Track', 'Spikes'],
                'primary_muscles': ['Hamstrings', 'Glutes', 'Calves'],
                'notes': ['Extended push phase training', 'Speed endurance development']
            },
            
            '100m Sprint': {
                'aliases': [
                    '100m Sprint', '100m', '100 m', '100 meter', '100 meters',
                    '100m sprint', '100 m sprint'
                ],
                'category': 'Sprints',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Track', 'Spikes'],
                'primary_muscles': ['Hamstrings', 'Glutes', 'Calves'],
                'notes': ['Speed endurance', 'Anaerobic capacity']
            },
            
            'Flying 30m Sprint': {
                'aliases': [
                    'Flying 30', 'Flying 30m', '30m Flying', 'Fly 30', 'flying 30'
                ],
                'category': 'Sprints',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Track', 'Spikes'],
                'primary_muscles': ['Hamstrings', 'Glutes', 'Calves'],
                'notes': ['Maximum velocity development', 'Top speed training']
            },
            
            'Sprints': {
                'aliases': [
                    'Sprints', 'Sprint', 'sprints', 'Fast'
                ],
                'category': 'Sprints',
                'bobsleigh_relevance': 'high',
                'equipment': ['Track'],
                'primary_muscles': ['Hamstrings', 'Glutes', 'Calves'],
                'notes': ['General sprint training']
            },
            
            # JUMPS & PLYOMETRICS (Very High Priority for Bobsleigh)
            'Broad Jump': {
                'aliases': [
                    'Broad Jump', 'Standing Broad Jump', 'Standing Broad', 'BJ', 'broad jump'
                ],
                'category': 'Jumps & Plyometrics',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Bodyweight', 'Measuring tape'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Calves'],
                'notes': ['Key performance indicator for bobsleigh', 'Horizontal power measurement']
            },
            
            'Triple Broad Jump': {
                'aliases': [
                    'Triple Broad Jump', 'Triple Broad', 'TBJ', '3 Broad Jump', 'triple broad jump'
                ],
                'category': 'Jumps & Plyometrics',
                'bobsleigh_relevance': 'very_high',
                'equipment': ['Bodyweight', 'Measuring tape'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Calves'],
                'notes': ['Repeated horizontal power', 'Elite bobsleigh performance indicator']
            },
            
            'Bounding': {
                'aliases': [
                    'Bounding', 'Bounds', 'Bound', 'bounding', 'bounds'
                ],
                'category': 'Jumps & Plyometrics',
                'bobsleigh_relevance': 'high',
                'equipment': ['Bodyweight'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Calves'],
                'notes': ['Continuous horizontal power development', 'Running-specific plyometrics']
            },
            
            'Hurdles': {
                'aliases': [
                    'Hurdles', 'Hurdle', 'hurdles', 'Hurldes'  # Fix typo from data
                ],
                'category': 'Jumps & Plyometrics',
                'bobsleigh_relevance': 'high',
                'equipment': ['Hurdles'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Hip Flexors'],
                'notes': ['Reactive power and coordination', 'Hip mobility and power']
            },
            
            'Bench Jumps': {
                'aliases': [
                    'Bench Jumps', 'bench jumps'
                ],
                'category': 'Jumps & Plyometrics',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Bench'],
                'primary_muscles': ['Quadriceps', 'Glutes', 'Calves'],
                'notes': ['Vertical jumping variation']
            },
            
            # STRENGTH ACCESSORIES
            'Bench Press': {
                'aliases': [
                    'Bench Press', 'Bench', 'bench press', 'bench'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Bench'],
                'primary_muscles': ['Chest', 'Shoulders', 'Triceps'],
                'notes': ['Upper body pressing strength']
            },
            
            'Bent Over Row': {
                'aliases': [
                    'Bent Over Row', 'Bent Row', 'Barbell Row', 'bent over row'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Lats', 'Rhomboids', 'Rear Delts'],
                'notes': ['Upper body pulling strength', 'Postural balance']
            },
            
            'Overhead Press': {
                'aliases': [
                    'Overhead Press', 'Military Press', 'Press', 'overhead press'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Barbell', 'Plates'],
                'primary_muscles': ['Shoulders', 'Triceps', 'Core'],
                'notes': ['Vertical pressing strength', 'Core stability']
            },
            
            'Walking Lunges': {
                'aliases': [
                    'Walking Lunges', 'Lunges', 'walking lunges', 'lunges'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Dumbbells'],
                'primary_muscles': ['Quadriceps', 'Glutes'],
                'notes': ['Unilateral leg strength', 'Functional movement']
            },
            
            # CONDITIONING & AEROBIC
            'Easy Jog': {
                'aliases': [
                    'Jog', 'Easy Jog', 'Light Jog', 'Jogging', 'jog', 'easy jog'
                ],
                'category': 'Conditioning',
                'bobsleigh_relevance': 'low',
                'equipment': ['Running Shoes'],
                'primary_muscles': ['Cardiovascular System'],
                'notes': ['Active recovery', 'Aerobic base building']
            },
            
            'Fartlek': {
                'aliases': [
                    'Fartlek', 'Farhtenspeil', 'fartlek'  # Original typo from data
                ],
                'category': 'Conditioning',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Running Shoes'],
                'primary_muscles': ['Cardiovascular System'],
                'notes': ['Varied pace training', 'Aerobic and anaerobic development']
            },
            
            # MOBILITY & RECOVERY
            'Adductor Stretching': {
                'aliases': [
                    'Stretch Adductors', 'Adductor Stretch', 'Adductors',
                    'stretch adductors', 'adductor stretch'
                ],
                'category': 'Mobility & Recovery',
                'bobsleigh_relevance': 'high',  # Joshua emphasized this daily
                'equipment': ['Bodyweight'],
                'primary_muscles': ['Adductors'],
                'notes': ['DAILY requirement according to Joshua', 'Critical for bobsleigh athletes']
            },
            
            'Technical Drills': {
                'aliases': [
                    'Drills', 'Technical Drills', 'Technical', 'Technique',
                    'drills', 'technical', 'technique'
                ],
                'category': 'Technique',
                'bobsleigh_relevance': 'high',
                'equipment': ['Various'],
                'primary_muscles': ['Movement Patterns'],
                'notes': ['Skill development', 'Movement quality']
            },
            
            'Warm Up': {
                'aliases': [
                    'Warm Up', 'Warmup', 'Warm-up', 'warm up'
                ],
                'category': 'Mobility & Recovery',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Bodyweight'],
                'primary_muscles': ['Full Body'],
                'notes': ['Preparation for training', 'Injury prevention']
            },
            
            # SPECIALIZED/OTHER
            'Nordic Hamstring': {
                'aliases': [
                    'Nordic', 'Nordic Hamstring', 'nordic'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'high',
                'equipment': ['Partner/Anchor'],
                'primary_muscles': ['Hamstrings'],
                'notes': ['Eccentric hamstring strength', 'Injury prevention']
            },
            
            'Neck Work': {
                'aliases': [
                    'Neck Work', 'neck work'
                ],
                'category': 'Strength Accessories',
                'bobsleigh_relevance': 'medium',
                'equipment': ['Harness/Manual'],
                'primary_muscles': ['Neck'],
                'notes': ['Bobsleigh-specific preparation', 'G-force tolerance']
            }
        }
    
    def _build_bobsleigh_priorities(self) -> Dict[str, List[str]]:
        """Organize exercises by bobsleigh relevance priority."""
        priorities = {'very_high': [], 'high': [], 'medium': [], 'low': []}
        
        for exercise, data in self.exercise_mapping.items():
            relevance = data['bobsleigh_relevance']
            priorities[relevance].append(exercise)
        
        return priorities
    
    def normalize_exercise_name(self, raw_name: str) -> Optional[str]:
        """Normalize exercise name and map to canonical form."""
        if not raw_name or str(raw_name).lower() in ['nan', 'none', '']:
            return None
        
        name = str(raw_name).strip()
        
        # Skip Excel errors and obvious non-exercises
        if any(error in name for error in ['#DIV', '#VALUE', '#REF', 'Daily Work', 'like its your job']):
            return None
        
        # Skip pure numbers, timing, or non-exercise entries
        if re.match(r'^[\\d\\s\\-x@\\.]+$', name) or name.lower() in ['time', 'rest', 'off']:
            return None
        
        # Clean the name - be more permissive with special characters
        name = re.sub(r'[^\\w\\s\\-\\(\\)&+\\.]', ' ', name)
        name = re.sub(r'\\s+', ' ', name).strip()
        
        # Find matching canonical exercise - try exact match first
        name_lower = name.lower()
        for canonical_exercise, data in self.exercise_mapping.items():
            for alias in data['aliases']:
                if alias.lower() == name_lower:
                    return canonical_exercise
        
        # Try fuzzy matching for close variations
        for canonical_exercise, data in self.exercise_mapping.items():
            for alias in data['aliases']:
                if self._fuzzy_string_match(name_lower, alias.lower()):
                    return canonical_exercise
        
        # Special case handling for common patterns
        return self._handle_special_patterns(name_lower)
    
    def _fuzzy_string_match(self, str1: str, str2: str) -> bool:
        """Simple fuzzy string matching."""
        # Remove common variations
        str1_clean = re.sub(r'[\\s\\-_]', '', str1)
        str2_clean = re.sub(r'[\\s\\-_]', '', str2)
        
        # Check if one is contained in the other
        if str1_clean in str2_clean or str2_clean in str1_clean:
            return True
        
        # Check for typo tolerance (like 'squatuat' vs 'squat')
        if len(str1_clean) > 4 and len(str2_clean) > 4:
            # Allow 1-2 character differences for longer strings
            differences = sum(1 for a, b in zip(str1_clean, str2_clean) if a != b)
            if differences <= 2 and abs(len(str1_clean) - len(str2_clean)) <= 2:
                return True
        
        return False
    
    def _handle_special_patterns(self, name_lower: str) -> Optional[str]:
        """Handle special exercise patterns not caught by direct mapping."""
        # Handle numbered variations (like "4X1 Broad Jumps")
        if 'broad jump' in name_lower:
            return 'Broad Jump'
        
        # Handle sprint variations with numbers/distances
        if any(term in name_lower for term in ['sprint', '30m', '60m', '100m']):
            if '30' in name_lower:
                return '30m Sprint'
            elif '60' in name_lower:
                return '60m Sprint'
            elif '100' in name_lower:
                return '100m Sprint'
            else:
                return 'Sprints'
        
        # Handle general squat patterns
        if 'squat' in name_lower:
            if 'front' in name_lower:
                if 'slow' in name_lower:
                    return 'Front Squat (Tempo)'
                else:
                    return 'Front Squat'
            elif 'back' in name_lower:
                return 'Back Squat'
            elif 'overhead' in name_lower:
                return 'Overhead Squat'
            elif 'bulgarian' in name_lower or 'split' in name_lower:
                return 'Bulgarian Split Squat'
            else:
                return 'Back Squat'  # Default squat
        
        # Handle clean patterns
        if 'clean' in name_lower:
            if 'power' in name_lower or 'clean (power)' in name_lower:
                if 'block' in name_lower:
                    return 'Power Clean from Blocks'
                else:
                    return 'Power Clean'
            elif 'full' in name_lower or 'clean (full)' in name_lower:
                return 'Full Clean'
            elif 'hang' in name_lower:
                return 'Hang Clean'
            else:
                return 'Power Clean'  # Default to power clean
        
        # Handle snatch patterns
        if 'snatch' in name_lower:
            if 'power' in name_lower or 'snatch (power)' in name_lower:
                if 'block' in name_lower:
                    return 'Power Snatch from Blocks'
                else:
                    return 'Power Snatch'
            elif 'full' in name_lower:
                return 'Full Snatch'
            elif 'hang' in name_lower:
                return 'Hang Snatch'
            else:
                return 'Power Snatch'  # Default to power snatch
        
        # Handle other common exercises
        if 'drills' in name_lower or 'drill' in name_lower:
            return 'Technical Drills'
        
        if 'stretch' in name_lower:
            if 'adductor' in name_lower:
                return 'Adductor Stretching'
            else:
                return 'Stretching'
        
        if 'jog' in name_lower:
            return 'Easy Jog'
        
        if 'hurdle' in name_lower:
            return 'Hurdles'
        
        if 'bound' in name_lower:
            return 'Bounding'
        
        if 'bench' in name_lower and 'jump' in name_lower:
            return 'Bench Jumps'
        elif 'bench' in name_lower:
            return 'Bench Press'
        
        # Return None if no pattern matches
        return None
    
    def deduplicate_exercises(self, raw_data: Dict) -> Dict:
        """Main deduplication function."""
        print("Starting targeted exercise deduplication based on Joshua's actual training data...")
        
        # Extract all exercise names
        all_raw_names = []
        
        for exercise_key, exercise_data in raw_data.get('exercise_library', {}).items():
            # Main exercise name
            main_name = exercise_data.get('name', '')
            if main_name:
                all_raw_names.append(main_name)
            
            # Variation names
            for variation in exercise_data.get('variations', []):
                var_name = variation.get('name', '')
                if var_name:
                    all_raw_names.append(var_name)
        
        print(f"Found {len(all_raw_names)} total raw exercise names")
        
        # Map to canonical exercises and count frequencies
        canonical_counts = Counter()
        canonical_variations = defaultdict(set)
        
        for raw_name in all_raw_names:
            canonical = self.normalize_exercise_name(raw_name)
            if canonical:
                canonical_counts[canonical] += 1
                canonical_variations[canonical].add(raw_name)
        
        print(f"Mapped to {len(canonical_counts)} canonical exercises")
        
        # Create final exercise library
        final_exercises = {}
        
        for canonical_name, frequency in canonical_counts.items():
            exercise_data = self.exercise_mapping[canonical_name]
            exercise_id = str(uuid.uuid4())
            
            final_exercises[exercise_id] = {
                'id': exercise_id,
                'canonical_name': canonical_name,
                'category': exercise_data['category'],
                'bobsleigh_relevance': exercise_data['bobsleigh_relevance'],
                'frequency_count': frequency,
                'variations_found': sorted(list(canonical_variations[canonical_name])),
                'equipment': exercise_data['equipment'],
                'primary_muscles': exercise_data['primary_muscles'],
                'notes': exercise_data['notes'],
                'created_at': datetime.now().isoformat()
            }
        
        # Sort by relevance then frequency
        sorted_exercises = sorted(
            final_exercises.values(),
            key=lambda x: (
                {'very_high': 4, 'high': 3, 'medium': 2, 'low': 1}[x['bobsleigh_relevance']],
                x['frequency_count']
            ),
            reverse=True
        )
        
        # Create summary statistics
        relevance_counts = Counter(ex['bobsleigh_relevance'] for ex in final_exercises.values())
        category_counts = Counter(ex['category'] for ex in final_exercises.values())
        
        return {
            'metadata': {
                'total_raw_exercises': len(all_raw_names),
                'total_canonical_exercises': len(final_exercises),
                'deduplication_ratio': len(all_raw_names) / len(final_exercises) if final_exercises else 0,
                'processed_timestamp': datetime.now().isoformat(),
                'relevance_distribution': dict(relevance_counts),
                'category_distribution': dict(category_counts),
                'data_source': 'Joshua Hudson Training Plans 2023-2025'
            },
            'canonical_exercises': {ex['id']: ex for ex in sorted_exercises},
            'exercises_by_relevance': self._group_by_relevance(sorted_exercises),
            'exercises_by_category': self._group_by_category(sorted_exercises),
            'bobsleigh_priority_exercises': self._get_priority_exercises(sorted_exercises)
        }
    
    def _group_by_relevance(self, exercises: List[Dict]) -> Dict:
        """Group exercises by bobsleigh relevance."""
        groups = defaultdict(list)
        for ex in exercises:
            groups[ex['bobsleigh_relevance']].append({
                'name': ex['canonical_name'],
                'category': ex['category'],
                'frequency': ex['frequency_count']
            })
        return dict(groups)
    
    def _group_by_category(self, exercises: List[Dict]) -> Dict:
        """Group exercises by category."""
        groups = defaultdict(list)
        for ex in exercises:
            groups[ex['category']].append({
                'name': ex['canonical_name'],
                'relevance': ex['bobsleigh_relevance'],
                'frequency': ex['frequency_count']
            })
        return dict(groups)
    
    def _get_priority_exercises(self, exercises: List[Dict]) -> Dict:
        """Get top priority exercises for each category."""
        priorities = {}
        
        # Very high relevance exercises (must-have for bobsleigh)
        very_high = [ex for ex in exercises if ex['bobsleigh_relevance'] == 'very_high']
        priorities['core_bobsleigh_exercises'] = [
            {
                'name': ex['canonical_name'],
                'category': ex['category'],
                'frequency': ex['frequency_count'],
                'notes': ex['notes']
            }
            for ex in very_high
        ]
        
        # Most frequent exercises overall
        priorities['most_frequent'] = [
            {
                'name': ex['canonical_name'],
                'category': ex['category'],
                'relevance': ex['bobsleigh_relevance'],
                'frequency': ex['frequency_count']
            }
            for ex in sorted(exercises, key=lambda x: x['frequency_count'], reverse=True)[:15]
        ]
        
        return priorities


def main():
    """Main execution function."""
    # Load the raw data
    with open('comprehensive_joshua_exercise_data.json', 'r') as f:
        raw_data = json.load(f)
    
    # Initialize the final deduplicator
    deduplicator = FinalExerciseDeduplicator()
    
    # Perform deduplication
    result = deduplicator.deduplicate_exercises(raw_data)
    
    # Save results
    output_file = 'joshua_final_exercise_library.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Create human-readable summary
    summary_file = 'joshua_exercise_library_summary.md'
    with open(summary_file, 'w') as f:
        f.write(generate_summary_report(result))
    
    # Print detailed report
    print("\\n" + "="*80)
    print("JOSHUA HUDSON FINAL EXERCISE LIBRARY REPORT")
    print("="*80)
    
    metadata = result['metadata']
    print(f"Original exercise entries: {metadata['total_raw_exercises']}")
    print(f"Clean canonical exercises: {metadata['total_canonical_exercises']}")
    print(f"Deduplication ratio: {metadata['deduplication_ratio']:.1f}:1")
    
    print(f"\\nBOBSLEIGH RELEVANCE DISTRIBUTION:")
    for relevance, count in metadata['relevance_distribution'].items():
        print(f"  {relevance.replace('_', ' ').title()}: {count} exercises")
    
    print(f"\\nCORE BOBSLEIGH EXERCISES (Very High Relevance):")
    core_exercises = result['bobsleigh_priority_exercises']['core_bobsleigh_exercises']
    for ex in core_exercises:
        print(f"  • {ex['name']} ({ex['category']}) - Used {ex['frequency']}x")
    
    print(f"\\nMOST FREQUENTLY USED EXERCISES:")
    frequent_exercises = result['bobsleigh_priority_exercises']['most_frequent']
    for i, ex in enumerate(frequent_exercises, 1):
        relevance_marker = "★★★" if ex['relevance'] == 'very_high' else "★★" if ex['relevance'] == 'high' else "★" if ex['relevance'] == 'medium' else ""
        print(f"  {i:2d}. {ex['name']} ({ex['frequency']}x) {relevance_marker}")
    
    print(f"\\nEXERCISE CATEGORIES:")
    for category, exercises in result['exercises_by_category'].items():
        high_rel = sum(1 for ex in exercises if ex['relevance'] in ['very_high', 'high'])
        print(f"  {category}: {len(exercises)} exercises ({high_rel} high/very high relevance)")
    
    print(f"\\nOutput files created:")
    print(f"  • {output_file} (JSON data)")
    print(f"  • {summary_file} (Human-readable summary)")
    print("="*80)


def generate_summary_report(result: Dict) -> str:
    """Generate a human-readable summary report."""
    metadata = result['metadata']
    
    report = f"""# Joshua Hudson Exercise Library - Clean & Deduplicated

## Summary

This is a clean, properly deduplicated exercise library extracted from Joshua Hudson's actual training data (2023-2025). The original {metadata['total_raw_exercises']} exercise entries have been reduced to {metadata['total_canonical_exercises']} canonical exercises (deduplication ratio: {metadata['deduplication_ratio']:.1f}:1).

## Core Bobsleigh Exercises (Very High Relevance)

These are the most important exercises for bobsleigh performance based on Joshua's training:

"""
    
    core_exercises = result['bobsleigh_priority_exercises']['core_bobsleigh_exercises']
    for ex in core_exercises:
        report += f"### {ex['name']} ({ex['category']})\n"
        report += f"- **Frequency in training:** {ex['frequency']} times\n"
        for note in ex['notes']:
            report += f"- {note}\n"
        report += "\n"
    
    report += "## Exercise Categories\n\n"
    
    for category, exercises in result['exercises_by_category'].items():
        high_rel = sum(1 for ex in exercises if ex['relevance'] in ['very_high', 'high'])
        report += f"### {category}\n"
        report += f"Total: {len(exercises)} exercises ({high_rel} high/very high relevance)\n\n"
        
        for ex in exercises:
            relevance_marker = "★★★" if ex['relevance'] == 'very_high' else "★★" if ex['relevance'] == 'high' else "★" if ex['relevance'] == 'medium' else ""
            report += f"- {ex['name']} ({ex['frequency']}x) {relevance_marker}\n"
        report += "\n"
    
    report += """
## Most Frequently Used Exercises

"""
    
    frequent_exercises = result['bobsleigh_priority_exercises']['most_frequent']
    for i, ex in enumerate(frequent_exercises, 1):
        relevance_marker = "★★★" if ex['relevance'] == 'very_high' else "★★" if ex['relevance'] == 'high' else "★" if ex['relevance'] == 'medium' else ""
        report += f"{i:2d}. **{ex['name']}** ({ex['frequency']}x) {relevance_marker}\n"
    
    report += f"""

## Relevance Scoring

- ★★★ **Very High**: Core bobsleigh exercises essential for performance
- ★★ **High**: Important supporting exercises for bobsleigh training  
- ★ **Medium**: General strength and conditioning exercises
- (no stars) **Low**: Recovery, mobility, and non-specific exercises

## Notes

- This library is based on Joshua Hudson's actual training data from 2023-2025
- Joshua competed at European Championship level in bobsleigh
- Exercises are prioritized based on bobsleigh-specific movement patterns and energy systems
- The "Very High Relevance" exercises should form the core of any bobsleigh training program

---
*Generated on {metadata['processed_timestamp']}*
*Source: {metadata['data_source']}*
"""
    
    return report


if __name__ == "__main__":
    main()