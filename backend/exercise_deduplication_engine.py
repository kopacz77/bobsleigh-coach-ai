#!/usr/bin/env python3
"""
Joshua Hudson Exercise Deduplication Engine
==========================================

This script analyzes the 814 messy exercise entries from Joshua Hudson's training data
and performs comprehensive deduplication, standardization, and relevance scoring
for bobsleigh training.

Key functions:
1. Text normalization (case, punctuation, spacing)
2. Abbreviation/acronym expansion for bobsleigh terminology
3. Exercise family grouping (squats, cleans, sprints, etc.)
4. Frequency analysis and bobsleigh relevance scoring
5. Generation of clean, canonical exercise library
"""

import json
import re
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple
import uuid
from datetime import datetime

class ExerciseDeduplicationEngine:
    
    def __init__(self):
        self.sport_acronyms = self._build_sport_acronym_dict()
        self.exercise_families = self._build_exercise_families()
        self.stop_words = self._build_stop_words()
        self.canonical_mapping = {}
        self.frequency_counts = Counter()
        self.relevance_scores = {}
        
    def _build_sport_acronym_dict(self) -> Dict[str, str]:
        """Build comprehensive acronym/abbreviation dictionary for bobsleigh/athletics."""
        return {
            # Olympic Lifts
            'pc': 'power clean',
            'p clean': 'power clean', 
            'p.clean': 'power clean',
            'power clean': 'power clean',
            'clean': 'power clean',  # Default to power clean in bobsleigh context
            'cleans': 'power clean',
            'cleans from block': 'power clean from blocks',
            'cleans from blocks': 'power clean from blocks',
            'pc from block': 'power clean from blocks',
            'pc from blocks': 'power clean from blocks',
            
            # Snatch variations
            'ps': 'power snatch',
            'p snatch': 'power snatch',
            'p.snatch': 'power snatch',
            'power snatch': 'power snatch',
            'snatch': 'power snatch',  # Default to power snatch
            'snatch from block': 'power snatch from blocks',
            'snatch from blocks': 'power snatch from blocks',
            'ps from block': 'power snatch from blocks',
            'ps from blocks': 'power snatch from blocks',
            
            # Squats
            'fs': 'front squat',
            'f squat': 'front squat',
            'f.squat': 'front squat',
            'front sq': 'front squat',
            'front squat': 'front squat',
            'front squatuat': 'front squat',  # Fix typo from data
            'front sq slow': 'front squat tempo',
            'front squat slow': 'front squat tempo',
            
            'bs': 'back squat',
            'b squat': 'back squat',
            'b.squat': 'back squat',
            'back sq': 'back squat',
            'back squat': 'back squat',
            'squat': 'back squat',  # Default to back squat
            
            # Sprint distances
            '30m': '30m sprint',
            '30 m': '30m sprint',
            '30m sprint': '30m sprint',
            '30 meter': '30m sprint',
            '30 meters': '30m sprint',
            
            '60m': '60m sprint',
            '60 m': '60m sprint', 
            '60m sprint': '60m sprint',
            '60 meter': '60m sprint',
            '60 meters': '60m sprint',
            
            '100m': '100m sprint',
            '100 m': '100m sprint',
            '100m sprint': '100m sprint',
            '100 meter': '100m sprint',
            '100 meters': '100m sprint',
            
            # Flying sprints
            'flying 30': 'flying 30m sprint',
            'flying 30m': 'flying 30m sprint',
            '30m flying': 'flying 30m sprint',
            'fly 30': 'flying 30m sprint',
            
            # Jump/Power movements
            'bj': 'broad jump',
            'broad': 'broad jump',
            'standing broad': 'broad jump',
            'standing broad jump': 'broad jump',
            
            'tbj': 'triple broad jump',
            'triple broad': 'triple broad jump',
            'triple bj': 'triple broad jump',
            '3 broad jump': 'triple broad jump',
            
            # Plyometrics
            'bounds': 'bounding',
            'bounding': 'bounding',
            
            # Common training terms
            'tempo': 'tempo',
            'slow': 'tempo',
            'pause': 'pause',
            'paused': 'pause',
            
            # Recovery/mobility
            'stretch': 'stretching',
            'stretching': 'stretching',
            'mobility': 'mobility work',
            'warm up': 'warm up',
            'warmup': 'warm up',
            'cool down': 'cool down',
            'cooldown': 'cool down',
            
            # Equipment/method indicators  
            'block': 'from blocks',
            'blocks': 'from blocks',
            'hang': 'hang',
            'hanging': 'hang',
            
            # Common variations
            'w/': 'with',
            'with': 'with',
            'x': 'x',  # Set/rep separator
            '@': 'at',  # Intensity indicator
        }
    
    def _build_exercise_families(self) -> Dict[str, List[str]]:
        """Define exercise families for bobsleigh training."""
        return {
            'olympic_lifts': [
                'power clean', 'power snatch', 'clean', 'snatch',
                'from blocks', 'hang', 'muscle'
            ],
            'squats': [
                'squat', 'front squat', 'back squat', 'overhead squat',
                'goblet squat', 'split squat', 'lunge'
            ],
            'sprints': [
                'sprint', '30m', '60m', '100m', 'flying', 'acceleration',
                'start', 'push start'
            ],
            'jumps_plyometrics': [
                'jump', 'broad', 'triple', 'vertical', 'box jump',
                'depth jump', 'bound', 'hop'
            ],
            'strength_accessories': [
                'row', 'pull', 'press', 'bench', 'deadlift',
                'curl', 'extension', 'raise'
            ],
            'aerobic_conditioning': [
                'run', 'jog', 'bike', 'cycle', 'row', 'fartlek',
                'tempo run', 'easy', 'recovery'
            ],
            'mobility_recovery': [
                'stretch', 'mobility', 'massage', 'foam roll',
                'activation', 'warm up', 'cool down'
            ],
            'bobsleigh_specific': [
                'push start', 'sled push', 'track work', 'pilot',
                'brake', 'slide work'
            ]
        }
    
    def _build_stop_words(self) -> Set[str]:
        """Common words to ignore when normalizing exercise names."""
        return {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'each', 'per', 'sets', 'reps', 'kg', 'lbs',
            'seconds', 'minutes', 'hours', 'rest', 'break', 'pause',
            'light', 'medium', 'heavy', 'max', 'maximum', 'min', 'mins'
        }
    
    def normalize_text(self, text: str) -> str:
        """Comprehensive text normalization."""
        if not text or pd.isna(text):
            return ""
            
        # Convert to lowercase
        text = str(text).lower().strip()
        
        # Remove Excel error values
        if text.startswith('#'):
            return ""
            
        # Remove special characters and extra whitespace
        text = re.sub(r'[^\w\s\-\./()]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        
        # Remove parenthetical content that's not meaningful
        text = re.sub(r'\([^)]*sick[^)]*\)', '', text)
        text = re.sub(r'\([^)]*pb[^)]*\)', '', text)
        text = re.sub(r'\([^)]*see how it goes[^)]*\)', '', text)
        
        # Remove numeric-only content that's not exercise names
        if re.match(r'^[\d\.\s\-x@]+$', text):
            return ""
        
        # Remove obvious non-exercise entries
        non_exercises = [
            'daily work', 'notes', 'off', 'rest', 'feedback',
            'deep tissue massage', 'got sick', 'lets see how it goes',
            'speed is all that matters', 'let your hips fly'
        ]
        
        for non_ex in non_exercises:
            if non_ex in text:
                return ""
        
        return text.strip()
    
    def expand_acronyms(self, text: str) -> str:
        """Expand known sport acronyms and abbreviations."""
        words = text.split()
        expanded_words = []
        
        for word in words:
            # Check exact matches first
            if word in self.sport_acronyms:
                expanded_words.append(self.sport_acronyms[word])
            else:
                # Check for partial matches
                found_match = False
                for acronym, expansion in self.sport_acronyms.items():
                    if acronym in word:
                        expanded_words.append(expansion)
                        found_match = True
                        break
                if not found_match:
                    expanded_words.append(word)
        
        return ' '.join(expanded_words)
    
    def identify_exercise_family(self, exercise_name: str) -> str:
        """Identify which exercise family this belongs to."""
        name_lower = exercise_name.lower()
        
        for family, keywords in self.exercise_families.items():
            for keyword in keywords:
                if keyword in name_lower:
                    return family
        
        return 'general'
    
    def calculate_bobsleigh_relevance(self, exercise_name: str, frequency: int) -> str:
        """Calculate bobsleigh-specific relevance score."""
        name_lower = exercise_name.lower()
        
        # Very High Relevance (Core bobsleigh exercises)
        very_high_keywords = [
            'power clean', 'front squat', '30m sprint', 'broad jump',
            'triple broad', 'push start', 'acceleration'
        ]
        
        # High Relevance (Important supporting exercises)
        high_keywords = [
            'back squat', 'power snatch', '60m sprint', '100m sprint',
            'bound', 'flying', 'squat', 'olympic'
        ]
        
        # Medium Relevance (General strength/conditioning)
        medium_keywords = [
            'row', 'press', 'pull', 'deadlift', 'lunge', 'jump'
        ]
        
        # Check relevance based on keywords
        for keyword in very_high_keywords:
            if keyword in name_lower:
                return 'very_high'
        
        for keyword in high_keywords:
            if keyword in name_lower:
                return 'high'
        
        for keyword in medium_keywords:
            if keyword in name_lower:
                return 'medium'
        
        # Frequency-based relevance boost
        if frequency >= 10:
            return 'high'
        elif frequency >= 5:
            return 'medium'
        else:
            return 'low'
    
    def deduplicate_exercises(self, raw_data: Dict) -> Dict:
        """Main deduplication function."""
        print("Starting comprehensive exercise deduplication...")
        
        # Step 1: Extract all exercise names and variations
        all_exercises = []
        exercise_contexts = defaultdict(list)
        
        for exercise_key, exercise_data in raw_data.get('exercise_library', {}).items():
            # Main exercise name
            main_name = exercise_data.get('name', '')
            if main_name:
                all_exercises.append(main_name)
                exercise_contexts[main_name].append({
                    'source': 'main',
                    'data': exercise_data
                })
            
            # Variation names
            for variation in exercise_data.get('variations', []):
                var_name = variation.get('name', '')
                if var_name:
                    all_exercises.append(var_name)
                    exercise_contexts[var_name].append({
                        'source': 'variation',
                        'data': variation,
                        'parent': main_name
                    })
        
        print(f"Found {len(all_exercises)} total exercise entries")
        
        # Step 2: Normalize and group similar exercises
        normalized_groups = defaultdict(list)
        
        for exercise in all_exercises:
            normalized = self.normalize_text(exercise)
            if normalized:  # Only process non-empty normalized names
                expanded = self.expand_acronyms(normalized)
                normalized_groups[expanded].append(exercise)
                self.frequency_counts[expanded] += 1
        
        print(f"Grouped into {len(normalized_groups)} normalized exercise types")
        
        # Step 3: Create canonical mapping
        canonical_exercises = {}
        
        for canonical_name, variations in normalized_groups.items():
            if not canonical_name:
                continue
                
            # Skip if too few occurrences (likely noise)
            if len(variations) < 2 and self.frequency_counts[canonical_name] < 2:
                continue
            
            # Create canonical exercise entry
            exercise_id = str(uuid.uuid4())
            family = self.identify_exercise_family(canonical_name)
            relevance = self.calculate_bobsleigh_relevance(canonical_name, self.frequency_counts[canonical_name])
            
            # Determine best canonical name (most complete/descriptive)
            best_name = self._select_best_canonical_name(variations, canonical_name)
            
            canonical_exercises[exercise_id] = {
                'id': exercise_id,
                'canonical_name': best_name,
                'normalized_name': canonical_name,
                'exercise_family': family,
                'bobsleigh_relevance': relevance,
                'frequency_count': self.frequency_counts[canonical_name],
                'variations': variations,
                'equipment': self._infer_equipment(canonical_name),
                'muscle_groups': self._infer_muscle_groups(canonical_name),
                'movement_pattern': self._infer_movement_pattern(canonical_name),
                'energy_system': self._infer_energy_system(canonical_name),
                'notes': self._generate_exercise_notes(canonical_name, family, relevance)
            }
        
        print(f"Created {len(canonical_exercises)} canonical exercises")
        
        # Step 4: Sort by relevance and frequency
        sorted_exercises = sorted(
            canonical_exercises.values(),
            key=lambda x: (
                {'very_high': 4, 'high': 3, 'medium': 2, 'low': 1}[x['bobsleigh_relevance']],
                x['frequency_count']
            ),
            reverse=True
        )
        
        return {
            'metadata': {
                'total_raw_exercises': len(all_exercises),
                'total_canonical_exercises': len(canonical_exercises),
                'deduplication_ratio': len(all_exercises) / len(canonical_exercises) if canonical_exercises else 0,
                'processed_timestamp': datetime.now().isoformat(),
                'high_relevance_count': len([ex for ex in canonical_exercises.values() if ex['bobsleigh_relevance'] in ['very_high', 'high']]),
                'very_high_relevance_exercises': [ex['canonical_name'] for ex in canonical_exercises.values() if ex['bobsleigh_relevance'] == 'very_high']
            },
            'canonical_exercises': {ex['id']: ex for ex in sorted_exercises},
            'exercise_families': self._summarize_by_family(sorted_exercises),
            'frequency_analysis': dict(self.frequency_counts.most_common(20)),
            'acronym_mappings': self.sport_acronyms
        }
    
    def _select_best_canonical_name(self, variations: List[str], normalized: str) -> str:
        """Select the best representative name from variations."""
        if not variations:
            return normalized
        
        # Prefer longer, more descriptive names
        best_variation = max(variations, key=len)
        
        # Clean up the best variation
        cleaned = re.sub(r'\s+', ' ', best_variation).strip()
        cleaned = cleaned.title()  # Proper case
        
        # Apply some standard formatting
        cleaned = re.sub(r'\bM\b', 'm', cleaned)  # 30M -> 30m
        cleaned = re.sub(r'\bKg\b', 'kg', cleaned)  # Kg -> kg
        cleaned = re.sub(r'\bSq\b', 'Squat', cleaned)  # Sq -> Squat
        
        return cleaned
    
    def _infer_equipment(self, exercise_name: str) -> List[str]:
        """Infer required equipment from exercise name."""
        equipment = []
        name_lower = exercise_name.lower()
        
        if any(word in name_lower for word in ['clean', 'snatch', 'squat', 'deadlift', 'row', 'press']):
            equipment.append('barbell')
        if 'dumbbell' in name_lower or 'db' in name_lower:
            equipment.append('dumbbell')
        if any(word in name_lower for word in ['run', 'sprint', 'jog']):
            equipment.append('track')
        if any(word in name_lower for word in ['jump', 'bound', 'hop']) and 'barbell' not in equipment:
            equipment.append('bodyweight')
        if 'stretch' in name_lower or 'mobility' in name_lower:
            equipment.append('bodyweight')
        if not equipment:
            equipment.append('unknown')
            
        return equipment
    
    def _infer_muscle_groups(self, exercise_name: str) -> List[str]:
        """Infer primary muscle groups."""
        muscle_groups = []
        name_lower = exercise_name.lower()
        
        if any(word in name_lower for word in ['squat', 'lunge', 'jump']):
            muscle_groups.extend(['quadriceps', 'glutes'])
        if any(word in name_lower for word in ['clean', 'snatch', 'deadlift']):
            muscle_groups.extend(['hamstrings', 'glutes', 'traps'])
        if any(word in name_lower for word in ['sprint', 'run']):
            muscle_groups.extend(['hamstrings', 'glutes', 'calves'])
        if any(word in name_lower for word in ['row', 'pull']):
            muscle_groups.extend(['lats', 'rhomboids'])
        if any(word in name_lower for word in ['press', 'bench']):
            muscle_groups.extend(['chest', 'shoulders', 'triceps'])
            
        return list(set(muscle_groups)) if muscle_groups else ['full_body']
    
    def _infer_movement_pattern(self, exercise_name: str) -> str:
        """Infer primary movement pattern."""
        name_lower = exercise_name.lower()
        
        if any(word in name_lower for word in ['squat', 'lunge']):
            return 'squat_pattern'
        elif any(word in name_lower for word in ['deadlift', 'clean', 'snatch']):
            return 'hinge_pattern'
        elif any(word in name_lower for word in ['press', 'push']):
            return 'push_pattern'
        elif any(word in name_lower for word in ['row', 'pull']):
            return 'pull_pattern'
        elif any(word in name_lower for word in ['sprint', 'run']):
            return 'locomotion'
        elif any(word in name_lower for word in ['jump', 'bound', 'hop']):
            return 'plyometric'
        else:
            return 'other'
    
    def _infer_energy_system(self, exercise_name: str) -> str:
        """Infer primary energy system."""
        name_lower = exercise_name.lower()
        
        if any(word in name_lower for word in ['sprint', '30m', '60m', 'flying']):
            return 'phosphocreatine'
        elif any(word in name_lower for word in ['100m', 'bound', 'fartlek']):
            return 'glycolytic'
        elif any(word in name_lower for word in ['jog', 'easy', 'recovery', 'tempo']):
            return 'aerobic'
        elif any(word in name_lower for word in ['clean', 'snatch', 'squat', 'jump']):
            return 'phosphocreatine'
        else:
            return 'mixed'
    
    def _generate_exercise_notes(self, exercise_name: str, family: str, relevance: str) -> List[str]:
        """Generate coaching notes based on exercise characteristics."""
        notes = []
        name_lower = exercise_name.lower()
        
        if 'power clean' in name_lower:
            notes.append("Focus on explosive hip extension and vertical bar path")
            notes.append("Critical for bobsleigh push start power development")
        elif 'front squat' in name_lower:
            notes.append("Maintain upright torso and full depth")
            notes.append("Essential for bobsleigh leg strength and push start position")
        elif '30m sprint' in name_lower:
            notes.append("Primary bobsleigh push distance - maximize acceleration")
            notes.append("Focus on low driving angle and powerful triple extension")
        elif 'broad jump' in name_lower:
            notes.append("Measure of horizontal power output")
            notes.append("Key performance indicator for bobsleigh athletes")
        
        if relevance == 'very_high':
            notes.append("PRIORITY EXERCISE: Core for bobsleigh performance")
        elif relevance == 'high':
            notes.append("Important supporting exercise for bobsleigh training")
            
        return notes
    
    def _summarize_by_family(self, exercises: List[Dict]) -> Dict:
        """Summarize exercises by family."""
        family_summary = defaultdict(list)
        
        for exercise in exercises:
            family = exercise['exercise_family']
            family_summary[family].append({
                'name': exercise['canonical_name'],
                'relevance': exercise['bobsleigh_relevance'],
                'frequency': exercise['frequency_count']
            })
        
        # Sort each family by relevance and frequency
        for family in family_summary:
            family_summary[family].sort(
                key=lambda x: (
                    {'very_high': 4, 'high': 3, 'medium': 2, 'low': 1}[x['relevance']],
                    x['frequency']
                ),
                reverse=True
            )
        
        return dict(family_summary)


def main():
    """Main execution function."""
    # Load the raw data
    with open('comprehensive_joshua_exercise_data.json', 'r') as f:
        raw_data = json.load(f)
    
    # Initialize the deduplication engine
    engine = ExerciseDeduplicationEngine()
    
    # Perform deduplication
    deduplicated_data = engine.deduplicate_exercises(raw_data)
    
    # Save results
    output_file = 'joshua_deduplicated_exercise_library.json'
    with open(output_file, 'w') as f:
        json.dump(deduplicated_data, f, indent=2)
    
    # Print summary report
    print("\n" + "="*60)
    print("JOSHUA HUDSON EXERCISE DEDUPLICATION REPORT")
    print("="*60)
    
    metadata = deduplicated_data['metadata']
    print(f"Original exercise entries: {metadata['total_raw_exercises']}")
    print(f"Canonical exercises created: {metadata['total_canonical_exercises']}")
    print(f"Deduplication ratio: {metadata['deduplication_ratio']:.1f}:1")
    print(f"High relevance exercises: {metadata['high_relevance_count']}")
    
    print(f"\nVery High Relevance Exercises ({len(metadata['very_high_relevance_exercises'])}):")
    for exercise in metadata['very_high_relevance_exercises']:
        print(f"  • {exercise}")
    
    print(f"\nTop 10 Most Frequent Exercises:")
    for exercise, frequency in list(deduplicated_data['frequency_analysis'].items())[:10]:
        print(f"  • {exercise}: {frequency} occurrences")
    
    print(f"\nExercise Families Summary:")
    for family, exercises in deduplicated_data['exercise_families'].items():
        high_rel = len([ex for ex in exercises if ex['relevance'] in ['very_high', 'high']])
        print(f"  • {family.replace('_', ' ').title()}: {len(exercises)} exercises ({high_rel} high relevance)")
    
    print(f"\nOutput saved to: {output_file}")
    print("="*60)


if __name__ == "__main__":
    # Need to import pandas for nan checking
    import pandas as pd
    main()