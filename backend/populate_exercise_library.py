#!/usr/bin/env python3
"""
Populate the comprehensive exercise library database with Joshua Hudson's refined training data.
"""

import json
import psycopg2
from psycopg2.extras import RealDictCursor
import uuid
from typing import Dict, List, Any

class ExerciseLibraryPopulator:
    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.category_mapping = {}
        self.equipment_mapping = {}
        self.muscle_group_mapping = {}

    def populate_all(self):
        """Main method to populate all exercise library data"""
        print("Loading refined exercise data...")
        
        # Load the refined data
        with open('refined_exercises_library.json', 'r') as f:
            refined_exercises = json.load(f)
        
        with open('training_protocols.json', 'r') as f:
            training_protocols = json.load(f)
        
        with open('training_templates.json', 'r') as f:
            training_templates = json.load(f)
        
        # Connect to database
        conn = psycopg2.connect(self.db_connection_string)
        conn.autocommit = False
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                print("Populating reference data...")
                self._populate_reference_data(cur)
                
                print("Populating exercise library...")
                self._populate_exercises(cur, refined_exercises)
                
                print("Populating training protocols...")
                self._populate_protocols(cur, training_protocols)
                
                print("Populating training templates...")
                self._populate_templates(cur, training_templates)
                
                conn.commit()
                print("✓ All data populated successfully!")
                
        except Exception as e:
            conn.rollback()
            print(f"Error populating data: {e}")
            raise
        finally:
            conn.close()

    def _populate_reference_data(self, cur):
        """Populate reference tables (categories, equipment, muscle groups)"""
        
        # Exercise Categories
        categories = [
            ('olympic_lifts', 'Olympic weightlifting movements and variations', None),
            ('strength', 'Traditional strength training exercises', None),
            ('power', 'Explosive power development exercises', None),
            ('sprint', 'Sprint and speed development exercises', None),
            ('aerobic', 'Aerobic conditioning exercises', None),
            ('technique', 'Sport-specific technique development', None),
            ('recovery', 'Recovery and mobility exercises', None),
            ('core', 'Core stability and strength exercises', None),
            ('bobsleigh_specific', 'Bobsleigh-specific training exercises', None),
            ('general', 'General fitness and conditioning exercises', None)
        ]
        
        for name, description, parent in categories:
            cur.execute("""
                INSERT INTO exercise_categories (name, description, parent_category_id)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                RETURNING id
            """, (name, description, parent))
            category_id = cur.fetchone()['id']
            self.category_mapping[name] = category_id
        
        # Equipment
        equipment_list = [
            ('barbell', 'Olympic barbell for weightlifting', 'barbell', 'medium', 'high'),
            ('plates', 'Weight plates for barbell', 'barbell', 'medium', 'high'),
            ('squat_rack', 'Squat rack or power rack', 'barbell', 'large', 'high'),
            ('lifting_platform', 'Olympic lifting platform', 'barbell', 'large', 'high'),
            ('running_shoes', 'Athletic running shoes', 'footwear', 'small', 'low'),
            ('track', 'Running track or suitable surface', 'surface', 'large', 'medium'),
            ('starting_blocks', 'Sprint starting blocks', 'sprint', 'small', 'medium'),
            ('hurdles', 'Training hurdles', 'sprint', 'medium', 'medium'),
            ('stairs', 'Stairs for stair running', 'surface', 'large', 'free'),
            ('mat', 'Exercise mat for floor exercises', 'accessory', 'small', 'low'),
            ('sled', 'Training sled for pushing/pulling', 'sled', 'medium', 'high'),
            ('push_track', 'Bobsled push track', 'bobsleigh', 'large', 'high'),
            ('bodyweight', 'No equipment needed', 'bodyweight', 'small', 'free'),
            ('open_space', 'Open area for movement', 'space', 'medium', 'free')
        ]
        
        for name, description, category, space, cost in equipment_list:
            cur.execute("""
                INSERT INTO equipment (name, description, category, required_space, cost_category)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                RETURNING id
            """, (name, description, category, space, cost))
            equipment_id = cur.fetchone()['id']
            self.equipment_mapping[name] = equipment_id
        
        # Muscle Groups
        muscle_groups = [
            ('quadriceps', 'Quadriceps muscles', 'lower_body'),
            ('hamstrings', 'Hamstring muscles', 'lower_body'),
            ('glutes', 'Gluteal muscles', 'lower_body'),
            ('calves', 'Calf muscles', 'lower_body'),
            ('hip_flexors', 'Hip flexor muscles', 'lower_body'),
            ('chest', 'Pectoral muscles', 'upper_body'),
            ('shoulders', 'Deltoid muscles', 'upper_body'),
            ('back', 'Latissimus dorsi and rhomboids', 'upper_body'),
            ('traps', 'Trapezius muscles', 'upper_body'),
            ('biceps', 'Bicep muscles', 'upper_body'),
            ('triceps', 'Tricep muscles', 'upper_body'),
            ('forearms', 'Forearm muscles', 'upper_body'),
            ('core', 'Core stabilizing muscles', 'core'),
            ('abdominals', 'Abdominal muscles', 'core'),
            ('obliques', 'Oblique muscles', 'core'),
            ('lower_back', 'Lower back muscles', 'core'),
            ('full_body', 'Multiple muscle groups', 'full_body')
        ]
        
        for name, description, region in muscle_groups:
            cur.execute("""
                INSERT INTO muscle_groups (name, description, region)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
                RETURNING id
            """, (name, description, region))
            muscle_group_id = cur.fetchone()['id']
            self.muscle_group_mapping[name] = muscle_group_id

    def _populate_exercises(self, cur, exercises: Dict[str, Any]):
        """Populate the exercise library"""
        
        for exercise_name, exercise_data in exercises.items():
            # Get category ID
            category_name = exercise_data.get('category', 'general')
            category_id = self.category_mapping.get(category_name)
            
            if not category_id:
                print(f"Warning: Category '{category_name}' not found for exercise '{exercise_name}'")
                category_id = self.category_mapping['general']
            
            # Extract training recommendations
            typical_params = exercise_data.get('typical_parameters', {})
            
            # Parse sets and reps
            sets_range = self._parse_range(typical_params.get('sets', ''))
            reps_range = self._parse_range(typical_params.get('reps', ''))
            intensity_range = self._parse_intensity_range(typical_params.get('intensity', ''))
            rest_range = self._parse_rest_range(typical_params.get('rest_seconds', ''))
            frequency_range = self._parse_frequency_range(typical_params.get('frequency_per_week', ''))
            
            # Insert exercise
            cur.execute("""
                INSERT INTO exercise_library (
                    id, name, category_id, subcategory, bobsleigh_relevance,
                    movement_pattern, energy_system,
                    typical_sets_min, typical_sets_max,
                    typical_reps_min, typical_reps_max,
                    intensity_min_percent, intensity_max_percent,
                    rest_seconds_min, rest_seconds_max,
                    frequency_per_week_min, frequency_per_week_max,
                    progression_type, beginner_modification, advanced_modification,
                    coaching_cues, safety_considerations, assessment_metrics,
                    description, instructions
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (name) DO UPDATE SET
                    category_id = EXCLUDED.category_id,
                    bobsleigh_relevance = EXCLUDED.bobsleigh_relevance,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            """, (
                exercise_data.get('id', str(uuid.uuid4())),
                exercise_name,
                category_id,
                exercise_data.get('subcategory'),
                exercise_data.get('bobsleigh_relevance', 'low'),
                exercise_data.get('movement_pattern'),
                exercise_data.get('energy_system'),
                sets_range[0], sets_range[1],
                reps_range[0], reps_range[1],
                intensity_range[0], intensity_range[1],
                rest_range[0], rest_range[1],
                frequency_range[0], frequency_range[1],
                typical_params.get('progression'),
                self._get_beginner_modification(exercise_name),
                self._get_advanced_modification(exercise_name),
                exercise_data.get('coaching_cues', []),
                exercise_data.get('safety_considerations', []),
                exercise_data.get('assessment_metrics', []),
                exercise_data.get('description', f'Training exercise: {exercise_name}'),
                self._get_exercise_instructions(exercise_name)
            ))
            
            exercise_id = cur.fetchone()['id']
            
            # Add equipment relationships
            equipment_list = exercise_data.get('equipment', ['bodyweight'])
            for equipment_name in equipment_list:
                equipment_id = self.equipment_mapping.get(equipment_name)
                if equipment_id:
                    cur.execute("""
                        INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (exercise_id, equipment_id) DO NOTHING
                    """, (exercise_id, equipment_id, True))
            
            # Add muscle group relationships
            muscle_groups = exercise_data.get('muscle_groups', ['full_body'])
            for i, muscle_group_name in enumerate(muscle_groups):
                muscle_group_id = self.muscle_group_mapping.get(muscle_group_name)
                if muscle_group_id:
                    involvement = 'primary' if i == 0 else 'secondary'
                    cur.execute("""
                        INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_level)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING
                    """, (exercise_id, muscle_group_id, involvement))
            
            # Add variations
            for variation in exercise_data.get('variations', []):
                if isinstance(variation, str):
                    cur.execute("""
                        INSERT INTO exercise_variations (
                            base_exercise_id, variation_name, difficulty_level, description
                        ) VALUES (%s, %s, %s, %s)
                    """, (
                        exercise_id,
                        variation,
                        'intermediate',
                        f'Variation of {exercise_name}'
                    ))

    def _populate_protocols(self, cur, protocols: Dict[str, Any]):
        """Populate training protocols"""
        
        for protocol_name, protocol_data in protocols.items():
            if isinstance(protocol_data, dict):
                cur.execute("""
                    INSERT INTO training_protocols (
                        name, protocol_type, category, description, protocol_data,
                        equipment_required, bobsleigh_relevance, purpose
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (
                    protocol_data.get('name', protocol_name.replace('_', ' ').title()),
                    protocol_data.get('type', protocol_name),
                    self._get_protocol_category(protocol_name),
                    protocol_data.get('description', ''),
                    json.dumps(protocol_data),
                    protocol_data.get('equipment', []),
                    protocol_data.get('bobsleigh_relevance', 'medium'),
                    protocol_data.get('purpose', '')
                ))

    def _populate_templates(self, cur, templates: Dict[str, Any]):
        """Populate training templates"""
        
        for template_name, template_data in templates.items():
            if isinstance(template_data, dict):
                # Parse duration
                duration = template_data.get('duration_minutes', '60')
                duration_range = self._parse_duration_range(duration)
                
                cur.execute("""
                    INSERT INTO training_templates (
                        name, template_type, duration_minutes_min, duration_minutes_max,
                        frequency_per_week, intensity_level, volume_level,
                        description, structure
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (
                    template_data.get('name', template_name.replace('_', ' ').title()),
                    template_name,
                    duration_range[0],
                    duration_range[1],
                    template_data.get('frequency_per_week', '2-3'),
                    template_data.get('intensity', 'medium'),
                    template_data.get('volume', 'medium'),
                    f"Training template for {template_name.replace('_', ' ')}",
                    json.dumps(template_data.get('structure', []))
                ))

    # Helper methods for parsing
    def _parse_range(self, range_str: str) -> tuple:
        """Parse a range string like '3-5' into (min, max)"""
        if not range_str or range_str == '':
            return (None, None)
        
        if '-' in range_str:
            parts = range_str.split('-')
            try:
                return (int(parts[0]), int(parts[1]))
            except (ValueError, IndexError):
                return (None, None)
        else:
            try:
                val = int(range_str)
                return (val, val)
            except ValueError:
                return (None, None)

    def _parse_intensity_range(self, intensity_str: str) -> tuple:
        """Parse intensity range with % symbols"""
        if not intensity_str:
            return (None, None)
        
        # Remove % symbols and parse
        clean_str = intensity_str.replace('%', '').replace(' 1RM', '').replace('% of ', '')
        
        if '-' in clean_str:
            parts = clean_str.split('-')
            try:
                return (int(parts[0]), int(parts[1]))
            except (ValueError, IndexError):
                return (None, None)
        elif 'maximal' in intensity_str.lower():
            return (95, 100)
        elif 'moderate' in intensity_str.lower():
            return (60, 80)
        else:
            return (None, None)

    def _parse_rest_range(self, rest_str: str) -> tuple:
        """Parse rest period ranges"""
        if not rest_str:
            return (None, None)
        
        # Convert minutes to seconds
        if 'min' in rest_str:
            clean_str = rest_str.replace(' minutes', '').replace(' min', '').replace('minutes', '').replace('min', '')
            range_tuple = self._parse_range(clean_str)
            if range_tuple[0] is not None:
                return (range_tuple[0] * 60, range_tuple[1] * 60 if range_tuple[1] else range_tuple[0] * 60)
        
        # Already in seconds
        if 'sec' in rest_str or rest_str.isdigit():
            clean_str = rest_str.replace(' seconds', '').replace(' sec', '').replace('seconds', '').replace('sec', '')
            return self._parse_range(clean_str)
        
        return (None, None)

    def _parse_frequency_range(self, freq_str: str) -> tuple:
        """Parse frequency per week"""
        if not freq_str:
            return (None, None)
        
        return self._parse_range(freq_str.replace(' per week', '').replace('x', ''))

    def _parse_duration_range(self, duration_str: str) -> tuple:
        """Parse duration range"""
        if not duration_str:
            return (60, 90)  # Default
        
        clean_str = duration_str.replace(' minutes', '').replace(' min', '').replace('minutes', '').replace('min', '')
        return self._parse_range(clean_str)

    def _get_protocol_category(self, protocol_name: str) -> str:
        """Get category for protocol"""
        if 'fartlek' in protocol_name:
            return 'aerobic'
        elif 'sprint' in protocol_name:
            return 'anaerobic'
        elif 'strength' in protocol_name:
            return 'strength'
        else:
            return 'general'

    def _get_beginner_modification(self, exercise_name: str) -> str:
        """Get beginner modification for exercise"""
        modifications = {
            'Front Squat': 'Start with goblet squat using dumbbell',
            'Power Clean': 'Begin with hang clean from mid-thigh',
            '30m Sprint': 'Start with 20m builds at 70-80% effort',
            'Bounding': 'Begin with stationary jumps for height',
        }
        return modifications.get(exercise_name, 'Reduce load and focus on technique')

    def _get_advanced_modification(self, exercise_name: str) -> str:
        """Get advanced modification for exercise"""
        modifications = {
            'Front Squat': 'Add pause at bottom or use slow tempo',
            'Power Clean': 'Progress to full clean or add blocks',
            '30m Sprint': 'Add reaction starts or resistance',
            'Bounding': 'Progress to continuous bounds over distance',
        }
        return modifications.get(exercise_name, 'Increase complexity or load')

    def _get_exercise_instructions(self, exercise_name: str) -> str:
        """Get basic instructions for exercise"""
        instructions = {
            'Front Squat': 'Hold bar in front rack position, squat to full depth, drive through heels to stand',
            'Power Clean': 'Deadlift to knee, explosive hip extension, catch bar in front rack position',
            '30m Sprint': 'Explosive start, stay low initially, gradual rise to upright running position',
            'Stretching': 'Hold each stretch for 30-60 seconds, breathe normally, no bouncing',
        }
        return instructions.get(exercise_name, f'Perform {exercise_name} with proper form and control')

def main():
    """Main function to populate the exercise library"""
    
    # Database connection string - update as needed
    db_connection_string = "postgresql://postgres:password@localhost:5432/bobsleigh_coach"
    
    try:
        populator = ExerciseLibraryPopulator(db_connection_string)
        populator.populate_all()
        
        print("\n" + "="*50)
        print("EXERCISE LIBRARY POPULATION COMPLETE")
        print("="*50)
        print("✓ Exercise categories populated")
        print("✓ Equipment reference data populated") 
        print("✓ Muscle groups reference data populated")
        print("✓ Exercise library populated from Joshua Hudson data")
        print("✓ Training protocols populated")
        print("✓ Training templates populated")
        print("\nThe database is now ready for the bobsleigh training application!")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the database is running and the connection string is correct.")

if __name__ == "__main__":
    main()