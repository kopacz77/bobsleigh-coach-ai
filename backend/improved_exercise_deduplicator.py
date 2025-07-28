#!/usr/bin/env python3
"""
Improved Joshua Hudson Exercise Deduplicator
============================================

This improved version uses more sophisticated pattern matching and manual 
exercise mapping to create a clean, properly deduplicated exercise library.

Key improvements:
1. Manual mapping of known exercise patterns
2. Better text preprocessing and normalization
3. Semantic grouping of exercise families
4. Proper bobsleigh relevance scoring
5. Clean canonical names with proper formatting
"""

import json
import re
from collections import defaultdict, Counter
from typing import Dict, List, Set, Tuple, Optional
import uuid
from datetime import datetime

class ImprovedExerciseDeduplicator:
    
    def __init__(self):
        self.canonical_mapping = self._build_canonical_mapping()
        self.exercise_patterns = self._build_exercise_patterns()
        self.bobsleigh_relevance_map = self._build_bobsleigh_relevance_map()
        self.frequency_counts = Counter()
        self.processed_exercises = {}
        
    def _build_canonical_mapping(self) -> Dict[str, str]:
        """Manual mapping of known exercise variations to canonical names."""
        return {
            # Olympic Lifts - Power Clean variations
            'power clean': 'Power Clean',
            'pc': 'Power Clean',
            'p clean': 'Power Clean',
            'p.clean': 'Power Clean',
            'clean': 'Power Clean',
            'cleans': 'Power Clean',
            'power cleans': 'Power Clean',
            'clean (power)': 'Power Clean',
            'cleans (power)': 'Power Clean',
            
            # Power Clean from Blocks
            'power clean from block': 'Power Clean from Blocks',
            'power clean from blocks': 'Power Clean from Blocks',
            'pc from block': 'Power Clean from Blocks',
            'pc from blocks': 'Power Clean from Blocks',
            'clean from block': 'Power Clean from Blocks',
            'clean from blocks': 'Power Clean from Blocks',
            'cleans from block': 'Power Clean from Blocks',
            'cleans from blocks': 'Power Clean from Blocks',
            
            # Full Clean variations
            'full clean': 'Clean (Full)',
            'clean (full)': 'Clean (Full)',
            'cleans full': 'Clean (Full)',
            'cleans (full)': 'Clean (Full)',
            
            # Hang Clean variations
            'hang clean': 'Hang Clean',
            'hang cleans': 'Hang Clean',
            'clean hang': 'Hang Clean',
            'cleans hang': 'Hang Clean',
            
            # Power Snatch variations
            'power snatch': 'Power Snatch',
            'ps': 'Power Snatch',
            'p snatch': 'Power Snatch',
            'p.snatch': 'Power Snatch',
            'snatch': 'Power Snatch',
            'snatch (power)': 'Power Snatch',
            
            # Power Snatch from Blocks
            'power snatch from block': 'Power Snatch from Blocks',
            'power snatch from blocks': 'Power Snatch from Blocks',
            'ps from block': 'Power Snatch from Blocks',
            'ps from blocks': 'Power Snatch from Blocks',
            'snatch from block': 'Power Snatch from Blocks',
            'snatch from blocks': 'Power Snatch from Blocks',
            
            # Front Squat variations
            'front squat': 'Front Squat',
            'fs': 'Front Squat',
            'f squat': 'Front Squat',
            'f.squat': 'Front Squat',
            'front sq': 'Front Squat',
            'front squatuat': 'Front Squat',  # Fix typo
            'front squatuat slow': 'Front Squat (Tempo)',
            'front sq slow': 'Front Squat (Tempo)',
            'front squat slow': 'Front Squat (Tempo)',
            'front squat tempo': 'Front Squat (Tempo)',
            
            # Back Squat variations
            'back squat': 'Back Squat',
            'bs': 'Back Squat',
            'b squat': 'Back Squat',
            'b.squat': 'Back Squat',
            'back sq': 'Back Squat',
            'squat': 'Back Squat',
            'back squat full': 'Back Squat',
            
            # Sprint variations
            '30m sprint': '30m Sprint',
            '30m': '30m Sprint',
            '30 m': '30m Sprint',
            '30 meter': '30m Sprint',
            '30 meters': '30m Sprint',
            '30 metre': '30m Sprint',
            '30 metres': '30m Sprint',
            
            '60m sprint': '60m Sprint', 
            '60m': '60m Sprint',
            '60 m': '60m Sprint',
            '60 meter': '60m Sprint',
            '60 meters': '60m Sprint',
            '60 metre': '60m Sprint',
            '60 metres': '60m Sprint',
            
            '100m sprint': '100m Sprint',
            '100m': '100m Sprint',
            '100 m': '100m Sprint',
            '100 meter': '100m Sprint',
            '100 meters': '100m Sprint',
            '100 metre': '100m Sprint',
            '100 metres': '100m Sprint',
            
            # Flying sprints
            'flying 30m': 'Flying 30m Sprint',
            'flying 30': 'Flying 30m Sprint',
            '30m flying': 'Flying 30m Sprint',
            'fly 30': 'Flying 30m Sprint',
            'fly 30m': 'Flying 30m Sprint',
            
            # Jump variations
            'broad jump': 'Broad Jump',
            'bj': 'Broad Jump',
            'standing broad jump': 'Broad Jump',
            'standing broad': 'Broad Jump',
            'broad': 'Broad Jump',
            
            'triple broad jump': 'Triple Broad Jump',
            'tbj': 'Triple Broad Jump',
            'triple broad': 'Triple Broad Jump',
            'triple bj': 'Triple Broad Jump',
            '3 broad jump': 'Triple Broad Jump',
            
            # Plyometric exercises
            'bounding': 'Bounding',
            'bounds': 'Bounding',
            'bound': 'Bounding',
            
            'hurdles': 'Hurdles',
            'hurdle': 'Hurdles',
            'hurldes': 'Hurdles',  # Fix typo
            
            # Box jumps
            'box jump': 'Box Jump',
            'box jumps': 'Box Jump',
            
            # Accessories
            'bent over row': 'Bent Over Row',
            'bent row': 'Bent Over Row',
            'barbell row': 'Bent Over Row',
            
            'bench press': 'Bench Press',
            'bench': 'Bench Press',
            
            'overhead press': 'Overhead Press',
            'press': 'Overhead Press',
            'military press': 'Overhead Press',
            
            # Conditioning
            'jog': 'Easy Jog',
            'jogging': 'Easy Jog',
            'light jog': 'Easy Jog',
            'easy jog': 'Easy Jog',
            
            'fartlek': 'Fartlek',
            'farhtenspeil': 'Fartlek',  # From original data
            
            # Recovery/Mobility
            'stretch': 'Stretching',
            'stretching': 'Stretching',
            'stretch adductors': 'Adductor Stretching',
            'adductor stretch': 'Adductor Stretching',
            'adductors': 'Adductor Stretching',
            
            'mobility': 'Mobility Work',
            'mobility work': 'Mobility Work',
            
            'warm up': 'Warm Up',
            'warmup': 'Warm Up',
            'warm-up': 'Warm Up',
            
            'cool down': 'Cool Down',
            'cooldown': 'Cool Down',
            'cool-down': 'Cool Down',
            
            # Rest/Off days
            'rest': 'Rest',
            'off': 'Rest',
            'rest day': 'Rest',
            'off day': 'Rest',
        }
    
    def _build_exercise_patterns(self) -> List[Tuple[str, str]]:
        """Regex patterns to match exercise variations."""
        return [
            # Olympic lift patterns with weights/reps
            (r'(\\d+)\\s*x\\s*(\\d+)\\s*clean', 'Power Clean'),
            (r'(\\d+)\\s*x\\s*(\\d+)\\s*snatch', 'Power Snatch'),
            (r'clean.*\\d+', 'Power Clean'),
            (r'snatch.*\\d+', 'Power Snatch'),
            
            # Sprint patterns with variations
            (r'(\\d+)m.*(?:sprint|fast|tempo)', '{distance}m Sprint'),
            (r'(\\d+)\\s*meter.*(?:sprint|fast)', '{distance}m Sprint'),
            (r'(\\d+)\\s*metre.*(?:sprint|fast)', '{distance}m Sprint'),
            
            # Jump patterns
            (r'(\\d+)\\s*x\\s*(\\d+)\\s*broad', 'Broad Jump'),
            (r'broad.*jump', 'Broad Jump'),
            (r'triple.*broad', 'Triple Broad Jump'),
            
            # Squat patterns
            (r'front.*squat.*(?:slow|tempo)', 'Front Squat (Tempo)'),
            (r'front.*squat', 'Front Squat'),
            (r'back.*squat', 'Back Squat'),
            (r'\\bsquat\\b(?!.*front)', 'Back Squat'),
            
            # General patterns
            (r'(\\d+)\\s*min.*jog', 'Easy Jog'),
            (r'stairs?.*running', 'Stair Running'),
            (r'drills?', 'Technical Drills'),
        ]
    
    def _build_bobsleigh_relevance_map(self) -> Dict[str, str]:
        """Map exercises to bobsleigh relevance levels."""
        return {
            # Very High Relevance - Core bobsleigh exercises
            'very_high': [
                'Power Clean', 'Power Clean from Blocks', 'Front Squat',
                '30m Sprint', 'Broad Jump', 'Triple Broad Jump',
                'Flying 30m Sprint', 'Power Snatch', 'Power Snatch from Blocks'
            ],
            
            # High Relevance - Important supporting exercises
            'high': [
                'Back Squat', 'Clean (Full)', 'Hang Clean', '60m Sprint',
                '100m Sprint', 'Bounding', 'Box Jump', 'Hurdles',
                'Bulgarian Split Squat', 'Front Squat (Tempo)'
            ],
            
            # Medium Relevance - General strength and conditioning
            'medium': [
                'Bent Over Row', 'Bench Press', 'Overhead Press',
                'Romanian Deadlift', 'Walking Lunge', 'Single Leg RDL',
                'Clean & Jerk', 'Snatch (Full)', 'Stair Running'
            ],
            
            # Low Relevance - Recovery, mobility, non-specific
            'low': [
                'Easy Jog', 'Stretching', 'Adductor Stretching',
                'Mobility Work', 'Warm Up', 'Cool Down', 'Rest',
                'Technical Drills', 'Fartlek'
            ]
        }
    
    def clean_exercise_name(self, raw_name: str) -> Optional[str]:
        """Clean and normalize a raw exercise name."""
        if not raw_name or str(raw_name).lower() in ['nan', 'none', '#div/0!', '#value!', '#ref!']:
            return None
            
        # Convert to string and basic cleaning
        name = str(raw_name).strip()
        
        # Remove Excel errors and obvious non-exercises
        if any(error in name.lower() for error in ['#div', '#value', '#ref', 'got sick', 'pb']):
            return None
        
        # Remove pure numbers or sets/reps only
        if re.match(r'^[\d\s\-x@\.]+$', name):
            return None
            
        # Remove obvious non-exercise entries
        non_exercises = [
            'daily work', 'notes', 'like its your job', 'speed is all that matters',
            'let your hips fly', 'deep tissue massage', 'travelling game',
            'feedback', 'see how it goes', 'spotter', 'got sick'
        ]
        
        name_lower = name.lower()
        for non_ex in non_exercises:
            if non_ex in name_lower:
                return None
        
        # Basic normalization
        name = re.sub(r'[^\\w\\s\\-\\(\\)\\+\\.]', ' ', name)  # Remove special chars except basic ones
        name = re.sub(r'\\s+', ' ', name)  # Collapse whitespace
        name = name.strip().lower()
        
        return name if name else None
    
    def map_to_canonical(self, cleaned_name: str) -> str:
        """Map a cleaned exercise name to its canonical form."""
        # Direct mapping lookup
        if cleaned_name in self.canonical_mapping:
            return self.canonical_mapping[cleaned_name]
        
        # Pattern matching for variations
        for pattern, canonical in self.exercise_patterns:
            match = re.search(pattern, cleaned_name, re.IGNORECASE)
            if match:
                if '{distance}' in canonical:
                    distance = match.group(1)
                    return canonical.format(distance=distance)
                return canonical
        
        # Fuzzy matching for close variations
        for known_name, canonical in self.canonical_mapping.items():
            if self._fuzzy_match(cleaned_name, known_name):
                return canonical
        
        # If no match found, create a proper case version
        return self._title_case(cleaned_name)
    
    def _fuzzy_match(self, name1: str, name2: str, threshold: float = 0.8) -> bool:
        """Simple fuzzy matching based on word overlap."""
        words1 = set(name1.split())
        words2 = set(name2.split())
        
        if not words1 or not words2:
            return False
            
        overlap = len(words1.intersection(words2))
        total = len(words1.union(words2))
        
        return (overlap / total) >= threshold
    
    def _title_case(self, name: str) -> str:
        """Convert to proper title case."""
        # Special cases for common abbreviations
        special_cases = {
            'm': 'm',  # Keep meters lowercase
            'kg': 'kg',  # Keep kg lowercase
            'x': 'x',   # Keep x lowercase
            'reps': 'Reps',
            'sets': 'Sets'
        }
        
        words = name.split()
        title_words = []
        
        for word in words:
            if word in special_cases:
                title_words.append(special_cases[word])
            else:
                title_words.append(word.capitalize())
        
        return ' '.join(title_words)
    
    def get_bobsleigh_relevance(self, canonical_name: str) -> str:
        """Get bobsleigh relevance for an exercise."""
        for relevance, exercises in self.bobsleigh_relevance_map.items():
            if canonical_name in exercises:
                return relevance
        return 'low'  # Default to low relevance
    
    def get_exercise_family(self, canonical_name: str) -> str:
        """Determine exercise family."""
        name_lower = canonical_name.lower()
        
        # Olympic lifts
        if any(term in name_lower for term in ['clean', 'snatch', 'jerk']):
            return 'Olympic Lifts'
        
        # Squats
        elif 'squat' in name_lower:
            return 'Squats'
        
        # Sprints
        elif any(term in name_lower for term in ['sprint', 'flying', '30m', '60m', '100m']):
            return 'Sprints'
        
        # Jumps/Plyometrics
        elif any(term in name_lower for term in ['jump', 'bound', 'hurdle', 'hop']):
            return 'Jumps & Plyometrics'
        
        # Strength accessories
        elif any(term in name_lower for term in ['row', 'press', 'bench', 'deadlift', 'curl']):
            return 'Strength Accessories'
        
        # Conditioning
        elif any(term in name_lower for term in ['jog', 'run', 'bike', 'fartlek', 'tempo']):
            return 'Conditioning'
        
        # Mobility/Recovery
        elif any(term in name_lower for term in ['stretch', 'mobility', 'warm', 'cool', 'massage']):
            return 'Mobility & Recovery'
        
        else:
            return 'Other'
    
    def get_equipment(self, canonical_name: str) -> List[str]:
        """Determine required equipment."""
        name_lower = canonical_name.lower()
        equipment = []
        
        if any(term in name_lower for term in ['clean', 'snatch', 'squat', 'deadlift', 'row', 'bench', 'press']):
            equipment.append('Barbell')
        
        if any(term in name_lower for term in ['sprint', 'run', 'jog']):
            equipment.append('Track/Field')
        
        if any(term in name_lower for term in ['jump', 'bound']) and not equipment:
            equipment.append('Bodyweight')
        
        if 'box' in name_lower:
            equipment.append('Plyo Box')
        
        if 'hurdle' in name_lower:
            equipment.append('Hurdles')
        
        if not equipment:
            equipment.append('Bodyweight')
        
        return equipment
    
    def deduplicate_exercises(self, raw_data: Dict) -> Dict:
        """Main deduplication function."""
        print("Starting improved exercise deduplication...")
        
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
        
        # Clean and map to canonical names
        canonical_exercises = defaultdict(lambda: {
            'canonical_name': '',
            'variations': set(),
            'frequency': 0
        })
        
        for raw_name in all_raw_names:
            cleaned = self.clean_exercise_name(raw_name)
            if cleaned:
                canonical = self.map_to_canonical(cleaned)
                canonical_exercises[canonical]['canonical_name'] = canonical
                canonical_exercises[canonical]['variations'].add(raw_name)
                canonical_exercises[canonical]['frequency'] += 1
        
        # Convert to final format
        final_exercises = {}
        
        for canonical_name, data in canonical_exercises.items():
            if data['frequency'] >= 1:  # Keep exercises that appear at least once
                exercise_id = str(uuid.uuid4())
                
                final_exercises[exercise_id] = {
                    'id': exercise_id,
                    'canonical_name': canonical_name,
                    'exercise_family': self.get_exercise_family(canonical_name),
                    'bobsleigh_relevance': self.get_bobsleigh_relevance(canonical_name),
                    'frequency_count': data['frequency'],
                    'variations': sorted(list(data['variations'])),
                    'equipment': self.get_equipment(canonical_name),
                    'created_at': datetime.now().isoformat()
                }
        
        # Sort by relevance and frequency
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
        family_counts = Counter(ex['exercise_family'] for ex in final_exercises.values())
        
        print(f"Created {len(final_exercises)} canonical exercises")
        print(f"Relevance distribution: {dict(relevance_counts)}")
        print(f"Family distribution: {dict(family_counts)}")
        
        return {
            'metadata': {
                'total_raw_exercises': len(all_raw_names),
                'total_canonical_exercises': len(final_exercises),
                'deduplication_ratio': len(all_raw_names) / len(final_exercises) if final_exercises else 0,
                'processed_timestamp': datetime.now().isoformat(),
                'relevance_distribution': dict(relevance_counts),
                'family_distribution': dict(family_counts),
                'very_high_relevance_exercises': [
                    ex['canonical_name'] for ex in sorted_exercises 
                    if ex['bobsleigh_relevance'] == 'very_high'
                ]
            },
            'canonical_exercises': {ex['id']: ex for ex in sorted_exercises},
            'exercise_families': self._group_by_family(sorted_exercises),
            'relevance_groups': self._group_by_relevance(sorted_exercises)
        }
    
    def _group_by_family(self, exercises: List[Dict]) -> Dict:
        """Group exercises by family."""
        families = defaultdict(list)
        for ex in exercises:
            families[ex['exercise_family']].append({
                'name': ex['canonical_name'],
                'relevance': ex['bobsleigh_relevance'],
                'frequency': ex['frequency_count']
            })
        return dict(families)
    
    def _group_by_relevance(self, exercises: List[Dict]) -> Dict:
        """Group exercises by relevance."""
        relevance = defaultdict(list)
        for ex in exercises:
            relevance[ex['bobsleigh_relevance']].append({
                'name': ex['canonical_name'],
                'family': ex['exercise_family'],
                'frequency': ex['frequency_count']
            })
        return dict(relevance)


def main():
    """Main execution function."""
    # Load the raw data
    with open('comprehensive_joshua_exercise_data.json', 'r') as f:
        raw_data = json.load(f)
    
    # Initialize the improved deduplicator
    deduplicator = ImprovedExerciseDeduplicator()
    
    # Perform deduplication
    result = deduplicator.deduplicate_exercises(raw_data)
    
    # Save results
    output_file = 'joshua_clean_exercise_library.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Print detailed report
    print("\\n" + "="*70)
    print("JOSHUA HUDSON CLEAN EXERCISE LIBRARY REPORT")
    print("="*70)
    
    metadata = result['metadata']
    print(f"Original exercise entries: {metadata['total_raw_exercises']}")
    print(f"Clean canonical exercises: {metadata['total_canonical_exercises']}")
    print(f"Deduplication ratio: {metadata['deduplication_ratio']:.1f}:1")
    
    print(f"\\nRELEVANCE DISTRIBUTION:")
    for relevance, count in metadata['relevance_distribution'].items():
        print(f"  {relevance.replace('_', ' ').title()}: {count} exercises")
    
    print(f"\\nVERY HIGH RELEVANCE (Core Bobsleigh Exercises):")
    for exercise in metadata['very_high_relevance_exercises']:
        print(f"  • {exercise}")
    
    print(f"\\nEXERCISE FAMILIES:")
    for family, exercises in result['exercise_families'].items():
        high_relevance = sum(1 for ex in exercises if ex['relevance'] in ['very_high', 'high'])
        print(f"  {family}: {len(exercises)} exercises ({high_relevance} high/very high relevance)")
    
    print(f"\\nTOP 15 MOST FREQUENT EXERCISES:")
    top_exercises = sorted(
        result['canonical_exercises'].values(),
        key=lambda x: x['frequency_count'],
        reverse=True
    )[:15]
    
    for i, ex in enumerate(top_exercises, 1):
        relevance_marker = "★★★" if ex['bobsleigh_relevance'] == 'very_high' else "★★" if ex['bobsleigh_relevance'] == 'high' else "★" if ex['bobsleigh_relevance'] == 'medium' else ""
        print(f"  {i:2d}. {ex['canonical_name']} ({ex['frequency_count']}x) {relevance_marker}")
    
    print(f"\\nOutput saved to: {output_file}")
    print("="*70)


if __name__ == "__main__":
    main()