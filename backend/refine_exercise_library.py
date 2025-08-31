#!/usr/bin/env python3
"""
Refine and clean the extracted exercise library to create a production-ready
bobsleigh exercise database with standardized names, proper categorization,
and enhanced metadata.
"""

import json
import re
from typing import Dict, List, Any
import uuid

class ExerciseLibraryRefiner:
    def __init__(self):
        self.exercise_mapping = {
            # Strength exercises
            'front squatuat slow': 'Front Squat (Slow Tempo)',
            'front sq slow': 'Front Squat (Slow Tempo)',
            'front sq': 'Front Squat',
            'back sq': 'Back Squat',
            'back squat': 'Back Squat',
            'front squat': 'Front Squat',
            
            # Olympic lifts
            'cleans from block': 'Power Clean from Blocks',
            'cleans from blocks': 'Power Clean from Blocks',
            'clean from blocks': 'Power Clean from Blocks',
            'power clean from blocks': 'Power Clean from Blocks',
            'snatch from blocks': 'Power Snatch from Blocks',
            'power snatch from blocks': 'Power Snatch from Blocks',
            'clean': 'Power Clean',
            'snatch': 'Power Snatch',
            
            # Running/Aerobic
            'running shoes': 'Running',
            'running': 'Running',
            'jog': 'Jogging',
            'jogging': 'Jogging',
            
            # Technique/Drills
            'focussed drill': 'Technique Drills',
            'technique drill': 'Technique Drills',
            'drills': 'Technique Drills',
            'drill': 'Technique Drills',
            
            # Power/Plyometric
            'bounds': 'Bounding',
            'bounding': 'Bounding',
            'hurldes': 'Hurdles',
            'hurdles': 'Hurdles',
            'hurdle': 'Hurdles',
            'stairs': 'Stair Running',
            'stair running': 'Stair Running',
            
            # Sprint
            '30m': '30m Sprint',
            '60m': '60m Sprint',
            '100m': '100m Sprint',
            'flying 30': '30m Flying Sprint',
            
            # Recovery
            'stretch': 'Stretching',
            'stretching': 'Stretching',
            'stretch adductors': 'Adductor Stretching',
            
            # Core/Stability
            'core': 'Core Training',
            'abs': 'Abdominal Training',
            'plank': 'Plank',
            
            # General
            'off': 'Rest Day',
            'rest': 'Rest Day'
        }
        
        self.category_mapping = {
            # Olympic Lifts
            'Power Clean': 'olympic_lifts',
            'Power Clean from Blocks': 'olympic_lifts',
            'Power Snatch': 'olympic_lifts',
            'Power Snatch from Blocks': 'olympic_lifts',
            'Clean & Jerk': 'olympic_lifts',
            
            # Strength
            'Front Squat': 'strength',
            'Front Squat (Slow Tempo)': 'strength',
            'Back Squat': 'strength',
            'Deadlift': 'strength',
            'Romanian Deadlift': 'strength',
            'Press': 'strength',
            'Bench Press': 'strength',
            'Row': 'strength',
            
            # Power/Plyometric
            'Bounding': 'power',
            'Hurdles': 'power',
            'Jump': 'power',
            'Box Jump': 'power',
            'Broad Jump': 'power',
            'Triple Broad Jump': 'power',
            'Medicine Ball Throw': 'power',
            
            # Sprint/Speed
            '30m Sprint': 'sprint',
            '60m Sprint': 'sprint',
            '100m Sprint': 'sprint',
            '30m Flying Sprint': 'sprint',
            'Block Starts': 'sprint',
            'Acceleration': 'sprint',
            
            # Aerobic
            'Running': 'aerobic',
            'Jogging': 'aerobic',
            'Fartlek': 'aerobic',
            'Stair Running': 'aerobic',
            
            # Technique
            'Technique Drills': 'technique',
            'Start Practice': 'technique',
            'Push Start Practice': 'bobsleigh_specific',
            
            # Recovery
            'Stretching': 'recovery',
            'Adductor Stretching': 'recovery',
            'Massage': 'recovery',
            'Foam Rolling': 'recovery',
            'Mobility': 'recovery',
            
            # Core
            'Core Training': 'core',
            'Abdominal Training': 'core',
            'Plank': 'core',
            
            # Bobsleigh Specific
            'Push Start': 'bobsleigh_specific',
            'Sled Push': 'bobsleigh_specific',
            'Drive Phase': 'bobsleigh_specific',
            
            # Rest
            'Rest Day': 'recovery'
        }
        
        self.bobsleigh_relevance = {
            # Very High Relevance
            'Power Clean': 'very_high',
            'Power Clean from Blocks': 'very_high',
            'Front Squat': 'very_high',
            'Back Squat': 'very_high',
            '30m Sprint': 'very_high',
            'Block Starts': 'very_high',
            'Push Start Practice': 'very_high',
            'Broad Jump': 'very_high',
            'Triple Broad Jump': 'very_high',
            
            # High Relevance
            'Power Snatch': 'high',
            'Power Snatch from Blocks': 'high',
            '60m Sprint': 'high',
            'Bounding': 'high',
            'Hurdles': 'high',
            'Technique Drills': 'high',
            'Core Training': 'high',
            
            # Medium Relevance
            '100m Sprint': 'medium',
            '30m Flying Sprint': 'medium',
            'Deadlift': 'medium',
            'Romanian Deadlift': 'medium',
            'Running': 'medium',
            'Stair Running': 'medium',
            
            # Low Relevance
            'Jogging': 'low',
            'Stretching': 'low',
            'Massage': 'low',
            'Rest Day': 'low'
        }

    def refine_library(self, raw_library: Dict) -> Dict:
        """Refine the raw exercise library"""
        refined_library = {}
        
        for exercise_name, exercise_data in raw_library.items():
            # Standardize exercise name
            standardized_name = self._standardize_name(exercise_name.lower())
            
            # Skip invalid or duplicate entries
            if not standardized_name or standardized_name in refined_library:
                continue
            
            # Create refined exercise entry
            refined_exercise = self._create_refined_exercise(standardized_name, exercise_data)
            
            if refined_exercise:
                refined_library[standardized_name] = refined_exercise
        
        return refined_library

    def _standardize_name(self, exercise_name: str) -> str:
        """Standardize exercise name"""
        name_lower = exercise_name.lower().strip()
        
        # Direct mapping
        if name_lower in self.exercise_mapping:
            return self.exercise_mapping[name_lower]
        
        # Pattern-based standardization
        # Sprint distances
        sprint_match = re.match(r'(\d+)\s*m', name_lower)
        if sprint_match:
            distance = sprint_match.group(1)
            return f"{distance}m Sprint"
        
        # Flying sprints
        flying_match = re.match(r'(\d+)\s*m?\s*flying', name_lower)
        if flying_match:
            distance = flying_match.group(1)
            return f"{distance}m Flying Sprint"
        
        # Weight-based exercises
        if 'squat' in name_lower:
            if 'front' in name_lower:
                if 'slow' in name_lower:
                    return 'Front Squat (Slow Tempo)'
                return 'Front Squat'
            elif 'back' in name_lower:
                return 'Back Squat'
            return 'Squat'
        
        if 'clean' in name_lower:
            if 'block' in name_lower:
                return 'Power Clean from Blocks'
            return 'Power Clean'
        
        if 'snatch' in name_lower:
            if 'block' in name_lower:
                return 'Power Snatch from Blocks'
            return 'Power Snatch'
        
        # Skip generic/invalid entries
        if len(name_lower) < 3 or name_lower in ['nan', 'notes', 'day', 'week', 'type']:
            return None
        
        # Title case for others
        return exercise_name.title()

    def _create_refined_exercise(self, exercise_name: str, raw_data: Dict) -> Dict:
        """Create a refined exercise entry"""
        if not exercise_name:
            return None
        
        # Get category
        category = self.category_mapping.get(exercise_name, 'general')
        
        # Get bobsleigh relevance
        relevance = self.bobsleigh_relevance.get(exercise_name, 'low')
        
        # Extract load progressions
        load_progressions = self._extract_load_progressions(raw_data.get('variations', []))
        
        # Get equipment
        equipment = self._determine_equipment(exercise_name, category)
        
        # Get training recommendations
        recommendations = self._get_training_recommendations(exercise_name, category)
        
        refined_exercise = {
            'id': str(uuid.uuid4()),
            'name': exercise_name,
            'category': category,
            'subcategory': self._get_subcategory(exercise_name, category),
            'equipment': equipment,
            'bobsleigh_relevance': relevance,
            'muscle_groups': self._get_muscle_groups(exercise_name),
            'movement_pattern': self._get_movement_pattern(exercise_name),
            'energy_system': self._get_energy_system(category),
            'load_progressions': load_progressions,
            'typical_parameters': recommendations,
            'variations': self._get_exercise_variations(exercise_name),
            'coaching_cues': self._get_coaching_cues(exercise_name),
            'safety_considerations': self._get_safety_considerations(exercise_name),
            'progression_pathway': self._get_progression_pathway(exercise_name),
            'assessment_metrics': self._get_assessment_metrics(exercise_name)
        }
        
        return refined_exercise

    def _extract_load_progressions(self, variations: List[Dict]) -> List[Dict]:
        """Extract meaningful load progressions"""
        progressions = []
        
        for variation in variations:
            load_data = variation.get('load_data', {})
            if load_data and any(v for v in load_data.values() if v is not None):
                progressions.append({
                    'weight_kg': load_data.get('weight_kg'),
                    'sets': load_data.get('sets'),
                    'reps': load_data.get('reps'),
                    'duration_seconds': load_data.get('duration_seconds'),
                    'context': {
                        'year': variation.get('year'),
                        'week': variation.get('week'),
                        'day': variation.get('day')
                    }
                })
        
        return progressions

    def _determine_equipment(self, exercise_name: str, category: str) -> List[str]:
        """Determine equipment needed"""
        equipment_map = {
            'olympic_lifts': ['barbell', 'plates', 'lifting_platform'],
            'strength': ['barbell', 'plates', 'squat_rack'],
            'sprint': ['running_shoes', 'track', 'blocks'],
            'power': ['running_shoes', 'open_space'],
            'aerobic': ['running_shoes'],
            'recovery': ['mat'],
            'core': ['mat'],
            'bobsleigh_specific': ['sled', 'push_track']
        }
        
        base_equipment = equipment_map.get(category, ['bodyweight'])
        
        # Specific overrides
        if 'hurdle' in exercise_name.lower():
            base_equipment.append('hurdles')
        elif 'block' in exercise_name.lower() and 'sprint' in category:
            base_equipment.append('starting_blocks')
        elif 'stair' in exercise_name.lower():
            base_equipment = ['stairs']
        
        return base_equipment

    def _get_subcategory(self, exercise_name: str, category: str) -> str:
        """Get exercise subcategory"""
        subcategories = {
            'olympic_lifts': {
                'clean': 'clean_variations',
                'snatch': 'snatch_variations'
            },
            'strength': {
                'squat': 'squat_variations',
                'deadlift': 'deadlift_variations',
                'press': 'press_variations'
            },
            'sprint': {
                'acceleration': 'acceleration',
                'max_velocity': 'max_velocity',
                'flying': 'flying_sprints'
            },
            'power': {
                'jump': 'jumping',
                'bound': 'bounding',
                'throw': 'throwing'
            }
        }
        
        name_lower = exercise_name.lower()
        
        if category in subcategories:
            for keyword, subcategory in subcategories[category].items():
                if keyword in name_lower:
                    return subcategory
        
        return category

    def _get_muscle_groups(self, exercise_name: str) -> List[str]:
        """Get primary muscle groups"""
        name_lower = exercise_name.lower()
        
        muscle_groups = []
        
        if any(term in name_lower for term in ['squat', 'jump', 'sprint']):
            muscle_groups.extend(['quadriceps', 'glutes', 'hamstrings'])
        
        if any(term in name_lower for term in ['clean', 'snatch', 'deadlift']):
            muscle_groups.extend(['hamstrings', 'glutes', 'back', 'shoulders'])
        
        if 'core' in name_lower or 'plank' in name_lower:
            muscle_groups.extend(['core', 'abdominals'])
        
        if any(term in name_lower for term in ['press', 'push']):
            muscle_groups.extend(['shoulders', 'triceps', 'chest'])
        
        return list(set(muscle_groups)) if muscle_groups else ['full_body']

    def _get_movement_pattern(self, exercise_name: str) -> str:
        """Get primary movement pattern"""
        name_lower = exercise_name.lower()
        
        patterns = {
            'squat': 'squat_pattern',
            'deadlift': 'hinge_pattern',
            'clean': 'triple_extension',
            'snatch': 'triple_extension',
            'press': 'vertical_push',
            'jump': 'explosive_extension',
            'sprint': 'horizontal_propulsion',
            'run': 'cyclical_locomotion'
        }
        
        for keyword, pattern in patterns.items():
            if keyword in name_lower:
                return pattern
        
        return 'general_movement'

    def _get_energy_system(self, category: str) -> str:
        """Get primary energy system"""
        energy_systems = {
            'olympic_lifts': 'phosphocreatine',
            'strength': 'phosphocreatine',
            'power': 'phosphocreatine',
            'sprint': 'phosphocreatine',
            'technique': 'skill_based',
            'aerobic': 'aerobic',
            'recovery': 'parasympathetic',
            'core': 'phosphocreatine',
            'bobsleigh_specific': 'phosphocreatine'
        }
        
        return energy_systems.get(category, 'mixed')

    def _get_training_recommendations(self, exercise_name: str, category: str) -> Dict:
        """Get detailed training recommendations"""
        base_recommendations = {
            'olympic_lifts': {
                'sets': '3-6',
                'reps': '1-3',
                'intensity': '70-95% 1RM',
                'rest_seconds': '180-300',
                'frequency_per_week': '2-3',
                'progression': 'load_and_technique'
            },
            'strength': {
                'sets': '3-5',
                'reps': '3-8',
                'intensity': '70-90% 1RM',
                'rest_seconds': '120-240',
                'frequency_per_week': '2-3',
                'progression': 'progressive_overload'
            },
            'power': {
                'sets': '3-5',
                'reps': '3-6',
                'intensity': 'maximal_effort',
                'rest_seconds': '120-300',
                'frequency_per_week': '2-3',
                'progression': 'complexity_and_speed'
            },
            'sprint': {
                'sets': '4-8',
                'reps': '1',
                'intensity': '95-100% max_speed',
                'rest_seconds': '120-300',
                'frequency_per_week': '2-4',
                'progression': 'speed_and_distance'
            },
            'aerobic': {
                'duration_minutes': '20-45',
                'intensity': '60-85% HRmax',
                'frequency_per_week': '2-4',
                'progression': 'duration_and_intensity'
            },
            'recovery': {
                'duration_minutes': '10-30',
                'intensity': 'low',
                'frequency_per_week': 'daily',
                'progression': 'range_of_motion'
            }
        }
        
        return base_recommendations.get(category, {
            'frequency_per_week': '1-2',
            'intensity': 'moderate',
            'progression': 'gradual'
        })

    def _get_exercise_variations(self, exercise_name: str) -> List[str]:
        """Get common exercise variations"""
        variations = {
            'Front Squat': [
                'Front Squat (Slow Tempo)',
                'Front Squat (Pause)',
                'Front Squat (1 1/4 Rep)',
                'Goblet Squat'
            ],
            'Back Squat': [
                'Back Squat (Low Bar)',
                'Back Squat (High Bar)',
                'Back Squat (Pause)',
                'Box Squat'
            ],
            'Power Clean': [
                'Power Clean from Blocks',
                'Hang Power Clean',
                'Muscle Clean',
                'Clean Pull'
            ],
            'Power Snatch': [
                'Power Snatch from Blocks',
                'Hang Power Snatch',
                'Muscle Snatch',
                'Snatch Pull'
            ],
            '30m Sprint': [
                'Block Start 30m',
                'Standing Start 30m',
                '3-Point Start 30m'
            ]
        }
        
        return variations.get(exercise_name, [])

    def _get_coaching_cues(self, exercise_name: str) -> List[str]:
        """Get key coaching cues"""
        cues = {
            'Front Squat': [
                'Elbows high',
                'Chest up',
                'Drive through heels',
                'Knees track over toes'
            ],
            'Power Clean': [
                'Aggressive second pull',
                'Fast elbows',
                'Receive in quarter squat',
                'Bar close to body'
            ],
            '30m Sprint': [
                'Powerful first step',
                'Stay low initially',
                'Pump arms aggressively',
                'Gradual rise to upright'
            ],
            'Stretching': [
                'Hold for 30+ seconds',
                'Breathe deeply',
                'No bouncing',
                'Gentle progression'
            ]
        }
        
        return cues.get(exercise_name, ['Focus on quality', 'Control the movement'])

    def _get_safety_considerations(self, exercise_name: str) -> List[str]:
        """Get safety considerations"""
        safety = {
            'olympic_lifts': [
                'Proper warm-up essential',
                'Use qualified spotters',
                'Progress load gradually',
                'Maintain proper form'
            ],
            'strength': [
                'Use safety bars when possible',
                'Ensure proper spotting',
                'Progress weight gradually',
                'Full range of motion'
            ],
            'sprint': [
                'Adequate warm-up required',
                'Proper footwear essential',
                'Check track conditions',
                'Allow full recovery between reps'
            ]
        }
        
        category = self._get_category_for_exercise(exercise_name)
        return safety.get(category, ['Follow proper progression', 'Listen to your body'])

    def _get_progression_pathway(self, exercise_name: str) -> List[str]:
        """Get progression pathway"""
        pathways = {
            'Front Squat': [
                'Bodyweight Squat',
                'Goblet Squat',
                'Front Squat (Light)',
                'Front Squat (Working Weight)',
                'Front Squat (Advanced Variations)'
            ],
            'Power Clean': [
                'Deadlift',
                'Clean Pull',
                'Hang Power Clean',
                'Power Clean from Floor',
                'Full Clean'
            ],
            '30m Sprint': [
                'Marching Drills',
                'Skip Progressions',
                'Build-up Runs',
                'Short Acceleration',
                'Full Sprint'
            ]
        }
        
        return pathways.get(exercise_name, ['Master basics', 'Add complexity', 'Increase intensity'])

    def _get_assessment_metrics(self, exercise_name: str) -> List[str]:
        """Get key assessment metrics"""
        metrics = {
            'Front Squat': ['1RM', '3RM', 'Depth Quality', 'Tempo Control'],
            'Power Clean': ['1RM', '3RM', 'Bar Speed', 'Technique Score'],
            '30m Sprint': ['Time', 'Split Times', 'Acceleration Curve', 'Start Reaction'],
            'Broad Jump': ['Distance', 'Takeoff Angle', 'Landing Quality'],
            'Stretching': ['Range of Motion', 'Flexibility Score', 'Asymmetry Check']
        }
        
        return metrics.get(exercise_name, ['Performance Quality', 'Progression Rate'])

    def _get_category_for_exercise(self, exercise_name: str) -> str:
        """Helper to get category for exercise"""
        return self.category_mapping.get(exercise_name, 'general')

def main():
    """Main function to refine the exercise library"""
    
    # Load the raw exercise library
    with open('exercises_library.json', 'r') as f:
        raw_library = json.load(f)
    
    # Create refiner and process
    refiner = ExerciseLibraryRefiner()
    refined_library = refiner.refine_library(raw_library)
    
    # Save refined library
    with open('refined_exercises_library.json', 'w') as f:
        json.dump(refined_library, f, indent=2, default=str)
    
    print(f"✓ Refined exercise library saved with {len(refined_library)} exercises")
    
    # Print summary by category
    categories = {}
    relevance = {}
    
    for exercise_data in refined_library.values():
        cat = exercise_data.get('category', 'unknown')
        rel = exercise_data.get('bobsleigh_relevance', 'unknown')
        
        categories[cat] = categories.get(cat, 0) + 1
        relevance[rel] = relevance.get(rel, 0) + 1
    
    print("\nRefined Exercise Categories:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} exercises")
    
    print("\nBobsleigh Relevance Distribution:")
    for rel, count in sorted(relevance.items(), key=lambda x: ['very_high', 'high', 'medium', 'low'].index(x[0]) if x[0] in ['very_high', 'high', 'medium', 'low'] else 999):
        print(f"  {rel}: {count} exercises")
    
    # Show some example high-relevance exercises
    print("\nHigh Relevance Exercises (sample):")
    high_rel_exercises = [(name, data) for name, data in refined_library.items() 
                         if data.get('bobsleigh_relevance') in ['very_high', 'high']]
    
    for name, data in sorted(high_rel_exercises[:10]):
        print(f"  {name} ({data['category']}) - {data['bobsleigh_relevance']} relevance")

if __name__ == "__main__":
    main()