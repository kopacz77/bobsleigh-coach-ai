#!/usr/bin/env python3
"""
Conservative Joshua Hudson Exercise Deduplicator
===============================================

This version uses a more conservative approach to avoid over-aggressive mapping.
It will identify the most common and relevant exercises while preserving
meaningful distinctions between different exercise types.
"""

import json
import re
from collections import defaultdict, Counter
from typing import Dict, List, Optional
import uuid
from datetime import datetime

class ConservativeExerciseDeduplicator:
    
    def __init__(self):
        # Build more conservative mappings based on exact matches and clear patterns
        self.exact_mappings = self._build_exact_mappings()
        self.pattern_mappings = self._build_pattern_mappings()
        self.bobsleigh_scoring = self._build_bobsleigh_scoring()
        
    def _build_exact_mappings(self) -> Dict[str, str]:
        """Exact string mappings for known variations."""
        return {
            # Olympic Lifts - Power Clean variations
            'power clean': 'Power Clean',
            'power cleans': 'Power Clean',
            'clean (power)': 'Power Clean',
            'cleans (power)': 'Power Clean',
            'pc': 'Power Clean',
            'p clean': 'Power Clean',
            
            # Clean from Blocks
            'clean from blocks': 'Power Clean from Blocks',
            'cleans from blocks': 'Power Clean from Blocks',
            'power clean from blocks': 'Power Clean from Blocks',
            'clean from block': 'Power Clean from Blocks',
            'cleans from block': 'Power Clean from Blocks',
            
            # Full Clean
            'full clean': 'Clean (Full)',
            'clean (full)': 'Clean (Full)',
            'cleans full': 'Clean (Full)',
            
            # Hang Clean
            'hang clean': 'Hang Clean',
            'hang cleans': 'Hang Clean',
            
            # Power Snatch
            'power snatch': 'Power Snatch',
            'snatch (power)': 'Power Snatch',
            'ps': 'Power Snatch',
            'p snatch': 'Power Snatch',
            
            # Snatch from Blocks
            'power snatch from blocks': 'Power Snatch from Blocks',
            'snatch from blocks': 'Power Snatch from Blocks',
            'snatch from block': 'Power Snatch from Blocks',
            
            # Full Snatch
            'full snatch': 'Snatch (Full)',
            
            # Hang Snatch
            'hang snatch': 'Hang Snatch',
            
            # Clean & Jerk
            'clean and jerk': 'Clean & Jerk',
            'clean & jerk': 'Clean & Jerk',
            'clean + jerk': 'Clean & Jerk',
            'split jerks (clean + jerk)': 'Clean & Jerk',
            'split jerks (clean & jerk)': 'Clean & Jerk',
            
            # Front Squat variations
            'front squat': 'Front Squat',
            'front squatuat': 'Front Squat',  # Fix typo
            'fs': 'Front Squat',
            'front': 'Front Squat',
            
            # Front Squat Tempo
            'front squat slow': 'Front Squat (Tempo)',
            'front squatuat slow': 'Front Squat (Tempo)',
            'front sq slow': 'Front Squat (Tempo)',
            'front squatuat 1.5 rep': 'Front Squat (Tempo)',
            'front squat 1.5 rep': 'Front Squat (Tempo)',
            
            # Back Squat
            'back squat': 'Back Squat',
            'back squatuat': 'Back Squat',
            'back squatuat 1.5': 'Back Squat',
            'back squat 1.5': 'Back Squat',
            'bs': 'Back Squat',
            
            # Overhead Squat
            'overhead squat': 'Overhead Squat',
            'overhead squat slow': 'Overhead Squat',
            
            # Bulgarian Split Squat
            'bulgarian split squat': 'Bulgarian Split Squat',
            'bulgarian split': 'Bulgarian Split Squat',
            'bulgarian split sq slow': 'Bulgarian Split Squat',
            
            # Jump Squats
            'jump squats': 'Jump Squats',
            
            # Broad Jump variations
            'broad jump': 'Broad Jump',
            'broad': 'Broad Jump',
            'standing broad jump': 'Broad Jump',
            '4x1 broad jumps': 'Broad Jump',
            '4x1 broad jumps': 'Broad Jump',
            '6x1 broad jumps': 'Broad Jump',
            '6x1 broad jumps': 'Broad Jump',
            'broad jump into sand/mat': 'Broad Jump',
            
            # Sprint variations
            'sprints': 'Sprint Training',
            'sprint': 'Sprint Training',
            '30m sprint': '30m Sprint',
            '60m sprint': '60m Sprint', 
            '100m sprint': '100m Sprint',
            'flying 30': 'Flying 30m Sprint',
            'flying 30m': 'Flying 30m Sprint',
            
            # Bounding
            'bounding': 'Bounding',
            'bounds': 'Bounding',
            'bound': 'Bounding',
            
            # Hurdles
            'hurdles': 'Hurdles',
            'hurdle': 'Hurdles',
            'hurldes': 'Hurdles',  # Fix typo
            '8x8 hurdle jumps': 'Hurdles',
            '8x8 hurdle jumps': 'Hurdles',
            
            # Bench variations
            'bench': 'Bench Press',
            'bench press': 'Bench Press',
            'bench jumps': 'Bench Jumps',
            
            # Rowing
            'bent over row': 'Bent Over Row',
            'bent row': 'Bent Over Row',
            
            # Overhead Press
            'overhead press': 'Overhead Press',
            'military press': 'Overhead Press',
            'press': 'Overhead Press',
            
            # Walking Lunges
            'walking lunges': 'Walking Lunges',
            'lunges': 'Walking Lunges',
            
            # Nordic
            'nordic': 'Nordic Hamstring Curls',
            'nordic hamstring': 'Nordic Hamstring Curls',
            
            # Conditioning
            'jog': 'Easy Jog',
            'jogging': 'Easy Jog',
            'easy jog': 'Easy Jog',
            'fartlek': 'Fartlek',
            'farhtenspeil': 'Fartlek',
            
            # Technical/Drills
            'drills': 'Technical Drills',
            'drill': 'Technical Drills',
            'technical': 'Technical Drills',
            'technique': 'Technical Drills',
            
            # Mobility/Recovery
            'stretch adductors': 'Adductor Stretching',
            'adductor stretch': 'Adductor Stretching',
            'adductors': 'Adductor Stretching',
            'stretch': 'General Stretching',
            'stretching': 'General Stretching',
            'mobility': 'Mobility Work',
            'warm up': 'Warm Up',
            'warmup': 'Warm Up',
            
            # Specialized
            'neck work': 'Neck Strengthening',
            'hamstrings': 'Hamstring Work',
            'frog': 'Frog Stretch',
            
            # Rest/Recovery
            'rest': 'Rest/Recovery',
            'off': 'Rest/Recovery',
        }
    
    def _build_pattern_mappings(self) -> List[tuple]:
        """Pattern-based mappings for variations not caught by exact matching."""
        return [
            # Numbers + exercise patterns
            (r'\\d+x\\d+.*broad.*jump', 'Broad Jump'),
            (r'\\d+.*broad.*jump', 'Broad Jump'),
            (r'\\d+.*sprint', 'Sprint Training'),
            (r'\\d+m.*sprint', 'Sprint Training'),
            (r'\\d+.*hurdle', 'Hurdles'),
            (r'\\d+.*bound', 'Bounding'),
            
            # Specific distance sprints
            (r'30m|30 m|30 meter', '30m Sprint'),
            (r'60m|60 m|60 meter', '60m Sprint'),
            (r'100m|100 m|100 meter', '100m Sprint'),
            
            # General exercise families (only if specific patterns don't match)
            (r'.*clean.*(?!jerk)(?!&)', 'General Clean Variation'),
            (r'.*snatch.*', 'General Snatch Variation'),
            (r'.*squat.*', 'General Squat Variation'),
        ]
    
    def _build_bobsleigh_scoring(self) -> Dict[str, Dict]:
        """Assign bobsleigh relevance and categories to exercises."""
        return {
            # Very High Relevance - Core bobsleigh exercises
            'Power Clean': {'relevance': 'very_high', 'category': 'Olympic Lifts'},
            'Power Clean from Blocks': {'relevance': 'very_high', 'category': 'Olympic Lifts'},
            'Front Squat': {'relevance': 'very_high', 'category': 'Squats'},
            '30m Sprint': {'relevance': 'very_high', 'category': 'Sprints'},
            'Broad Jump': {'relevance': 'very_high', 'category': 'Jumps & Plyometrics'},
            'Power Snatch': {'relevance': 'very_high', 'category': 'Olympic Lifts'},
            'Power Snatch from Blocks': {'relevance': 'very_high', 'category': 'Olympic Lifts'},
            'Flying 30m Sprint': {'relevance': 'very_high', 'category': 'Sprints'},
            
            # High Relevance - Important supporting exercises  
            'Back Squat': {'relevance': 'high', 'category': 'Squats'},
            'Clean (Full)': {'relevance': 'high', 'category': 'Olympic Lifts'},
            'Hang Clean': {'relevance': 'high', 'category': 'Olympic Lifts'},
            'Hang Snatch': {'relevance': 'high', 'category': 'Olympic Lifts'},
            'Front Squat (Tempo)': {'relevance': 'high', 'category': 'Squats'},
            'Bulgarian Split Squat': {'relevance': 'high', 'category': 'Squats'},
            '60m Sprint': {'relevance': 'high', 'category': 'Sprints'},
            'Sprint Training': {'relevance': 'high', 'category': 'Sprints'},
            'Bounding': {'relevance': 'high', 'category': 'Jumps & Plyometrics'},
            'Hurdles': {'relevance': 'high', 'category': 'Jumps & Plyometrics'},
            'Jump Squats': {'relevance': 'high', 'category': 'Squats'},
            'Nordic Hamstring Curls': {'relevance': 'high', 'category': 'Strength Accessories'},
            'Technical Drills': {'relevance': 'high', 'category': 'Technique'},
            'Adductor Stretching': {'relevance': 'high', 'category': 'Mobility & Recovery'},
            
            # Medium Relevance - General strength and conditioning
            'Clean & Jerk': {'relevance': 'medium', 'category': 'Olympic Lifts'},
            'Snatch (Full)': {'relevance': 'medium', 'category': 'Olympic Lifts'},
            'Overhead Squat': {'relevance': 'medium', 'category': 'Squats'},
            '100m Sprint': {'relevance': 'medium', 'category': 'Sprints'},
            'Bench Press': {'relevance': 'medium', 'category': 'Strength Accessories'},
            'Bent Over Row': {'relevance': 'medium', 'category': 'Strength Accessories'},
            'Overhead Press': {'relevance': 'medium', 'category': 'Strength Accessories'},
            'Walking Lunges': {'relevance': 'medium', 'category': 'Strength Accessories'},
            'Bench Jumps': {'relevance': 'medium', 'category': 'Jumps & Plyometrics'},
            'Fartlek': {'relevance': 'medium', 'category': 'Conditioning'},
            'Neck Strengthening': {'relevance': 'medium', 'category': 'Strength Accessories'},
            
            # Low Relevance - Recovery, mobility, non-specific
            'Easy Jog': {'relevance': 'low', 'category': 'Conditioning'},
            'General Stretching': {'relevance': 'low', 'category': 'Mobility & Recovery'},
            'Mobility Work': {'relevance': 'low', 'category': 'Mobility & Recovery'},
            'Warm Up': {'relevance': 'low', 'category': 'Mobility & Recovery'},
            'Rest/Recovery': {'relevance': 'low', 'category': 'Recovery'},
            'Hamstring Work': {'relevance': 'low', 'category': 'Mobility & Recovery'},
            'Frog Stretch': {'relevance': 'low', 'category': 'Mobility & Recovery'},
            
            # Handle general variations
            'General Clean Variation': {'relevance': 'medium', 'category': 'Olympic Lifts'},
            'General Snatch Variation': {'relevance': 'medium', 'category': 'Olympic Lifts'},
            'General Squat Variation': {'relevance': 'medium', 'category': 'Squats'},
        }
    
    def normalize_exercise_name(self, raw_name: str) -> Optional[str]:
        """Conservative normalization that preserves meaningful distinctions."""
        if not raw_name or str(raw_name).lower() in ['nan', 'none', '']:
            return None
        
        name = str(raw_name).strip()
        
        # Skip obvious non-exercises
        skip_patterns = [
            '#DIV', '#VALUE', '#REF', 'Daily Work', 'like its your job',
            'speed is all that matters', 'let your hips fly', 'got sick',
            'see how it goes', 'deep tissue massage', 'travelling game',
            'for fun', 'sailing', 'spotter', 'time', 'sets', 'medium',
            'fast', 'slow', 'pb', 'personal best'
        ]
        
        name_lower = name.lower()
        if any(pattern.lower() in name_lower for pattern in skip_patterns):
            return None
        
        # Skip pure numbers or sets/reps info
        if re.match(r'^[\\d\\s\\-x@\\.%]+$', name) or len(name) <= 2:
            return None
        
        # Clean the name
        name = re.sub(r'[^\\w\\s\\-\\(\\)&+\\.]', ' ', name)
        name = re.sub(r'\\s+', ' ', name).strip().lower()
        
        # Try exact mapping first
        if name in self.exact_mappings:
            return self.exact_mappings[name]
        
        # Try pattern matching
        for pattern, canonical in self.pattern_mappings:
            if re.search(pattern, name, re.IGNORECASE):
                return canonical
        
        # If no match and it's a meaningful exercise name, preserve it
        if len(name) > 3 and any(char.isalpha() for char in name):
            # Create a proper case version
            return ' '.join(word.capitalize() for word in name.split())
        
        return None
    
    def deduplicate_exercises(self, raw_data: Dict) -> Dict:
        """Main deduplication function with conservative approach."""
        print("Starting conservative exercise deduplication...")
        
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
        
        mapped_count = 0
        for raw_name in all_raw_names:
            canonical = self.normalize_exercise_name(raw_name)
            if canonical:
                canonical_counts[canonical] += 1
                canonical_variations[canonical].add(raw_name)
                mapped_count += 1
        
        print(f"Successfully mapped {mapped_count} exercise names to {len(canonical_counts)} canonical exercises")
        
        # Create final exercise library
        final_exercises = {}
        
        for canonical_name, frequency in canonical_counts.items():
            # Get exercise info or create default
            exercise_info = self.bobsleigh_scoring.get(canonical_name, {
                'relevance': 'low',
                'category': 'Other'
            })
            
            exercise_id = str(uuid.uuid4())
            
            final_exercises[exercise_id] = {
                'id': exercise_id,
                'canonical_name': canonical_name,
                'category': exercise_info['category'],
                'bobsleigh_relevance': exercise_info['relevance'],
                'frequency_count': frequency,
                'variations_found': sorted(list(canonical_variations[canonical_name])),
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
                'successfully_mapped': mapped_count,
                'mapping_success_rate': mapped_count / len(all_raw_names) * 100,
                'total_canonical_exercises': len(final_exercises),
                'deduplication_ratio': mapped_count / len(final_exercises) if final_exercises else 0,
                'processed_timestamp': datetime.now().isoformat(),
                'relevance_distribution': dict(relevance_counts),
                'category_distribution': dict(category_counts),
                'data_source': 'Joshua Hudson Training Plans 2023-2025'
            },
            'canonical_exercises': {ex['id']: ex for ex in sorted_exercises},
            'exercises_by_relevance': self._group_by_relevance(sorted_exercises),
            'exercises_by_category': self._group_by_category(sorted_exercises),
            'top_exercises': self._get_top_exercises(sorted_exercises)
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
    
    def _get_top_exercises(self, exercises: List[Dict]) -> Dict:
        """Get top exercises in different categories."""
        return {
            'very_high_relevance': [
                {
                    'name': ex['canonical_name'],
                    'category': ex['category'],
                    'frequency': ex['frequency_count']
                }
                for ex in exercises if ex['bobsleigh_relevance'] == 'very_high'
            ],
            'most_frequent': [
                {
                    'name': ex['canonical_name'],
                    'category': ex['category'],
                    'relevance': ex['bobsleigh_relevance'],
                    'frequency': ex['frequency_count']
                }
                for ex in sorted(exercises, key=lambda x: x['frequency_count'], reverse=True)[:20]
            ]
        }


def main():
    """Main execution function."""
    # Load the raw data
    with open('comprehensive_joshua_exercise_data.json', 'r') as f:
        raw_data = json.load(f)
    
    # Initialize the conservative deduplicator
    deduplicator = ConservativeExerciseDeduplicator()
    
    # Perform deduplication
    result = deduplicator.deduplicate_exercises(raw_data)
    
    # Save results
    output_file = 'joshua_conservative_exercise_library.json'
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Print detailed report
    print("\\n" + "="*90)
    print("JOSHUA HUDSON CONSERVATIVE EXERCISE LIBRARY REPORT")
    print("="*90)
    
    metadata = result['metadata']
    print(f"Original exercise entries: {metadata['total_raw_exercises']}")
    print(f"Successfully mapped: {metadata['successfully_mapped']} ({metadata['mapping_success_rate']:.1f}%)")
    print(f"Clean canonical exercises: {metadata['total_canonical_exercises']}")
    print(f"Deduplication ratio: {metadata['deduplication_ratio']:.1f}:1")
    
    print(f"\\nBOBSLEIGH RELEVANCE DISTRIBUTION:")
    for relevance, count in metadata['relevance_distribution'].items():
        print(f"  {relevance.replace('_', ' ').title()}: {count} exercises")
    
    print(f"\\nCATEGORY DISTRIBUTION:")
    for category, count in metadata['category_distribution'].items():
        print(f"  {category}: {count} exercises")
    
    print(f"\\nVERY HIGH RELEVANCE EXERCISES (Core for Bobsleigh):")
    very_high = result['top_exercises']['very_high_relevance']
    for ex in very_high:
        print(f"  • {ex['name']} ({ex['category']}) - {ex['frequency']}x")
    
    print(f"\\nTOP 20 MOST FREQUENT EXERCISES:")
    frequent = result['top_exercises']['most_frequent']
    for i, ex in enumerate(frequent, 1):
        relevance_marker = "★★★" if ex['relevance'] == 'very_high' else "★★" if ex['relevance'] == 'high' else "★" if ex['relevance'] == 'medium' else ""
        print(f"  {i:2d}. {ex['name']} ({ex['frequency']}x) {relevance_marker}")
    
    print(f"\\nBY CATEGORY:")
    for category, exercises in result['exercises_by_category'].items():
        high_rel = sum(1 for ex in exercises if ex['relevance'] in ['very_high', 'high'])
        print(f"\\n  {category}: {len(exercises)} exercises ({high_rel} high/very high relevance)")
        for ex in sorted(exercises, key=lambda x: x['frequency'], reverse=True)[:5]:
            relevance_marker = "★★★" if ex['relevance'] == 'very_high' else "★★" if ex['relevance'] == 'high' else "★" if ex['relevance'] == 'medium' else ""
            print(f"    - {ex['name']} ({ex['frequency']}x) {relevance_marker}")
    
    print(f"\\nOutput saved to: {output_file}")
    print("="*90)


if __name__ == "__main__":
    main()