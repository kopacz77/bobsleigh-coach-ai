"""Exercise selection service for training plan generation.

Queries the exercises table and selects appropriate exercises for each
session type and section. Falls back to hardcoded bobsleigh-specific
defaults when database exercises are unavailable.
"""

from typing import Dict, List, Optional

from app.db.session import get_supabase


# Mapping from session type to exercise categories in the exercises table
SESSION_TYPE_CATEGORIES: Dict[str, List[str]] = {
    "speed": ["sprints", "sport_specific"],
    "strength": ["squats", "strength"],
    "power": ["olympic_lifts", "jumps"],
    "recovery": ["mobility"],
    "technique": ["sport_specific", "sprints"],
}

# Complementary categories for accessory work
ACCESSORY_CATEGORIES: Dict[str, List[str]] = {
    "squats": ["strength"],        # posterior chain complement
    "strength": ["squats"],        # quad complement
    "olympic_lifts": ["jumps"],    # plyometric complement
    "sprints": ["jumps"],          # jump complement
    "sport_specific": ["strength"],
}

# Hardcoded warm-up exercises (common across all session types)
DEFAULT_WARM_UP: List[Dict] = [
    {
        "exercise_name": "Dynamic Mobility Routine",
        "sets": 1,
        "duration_minutes": 10,
        "notes": "Progressive warm-up: hip circles, leg swings, arm circles",
    },
    {
        "exercise_name": "Sprint Drills",
        "sets": 2,
        "reps": 5,
        "rest_seconds": 30,
        "notes": "A-skips, B-skips, high knees",
    },
]

# Hardcoded cool-down exercises
DEFAULT_COOL_DOWN: List[Dict] = [
    {
        "exercise_name": "Static Stretching",
        "sets": 1,
        "duration_minutes": 10,
        "notes": "Focus on hip flexors, hamstrings, and quads",
    },
]

# Hardcoded bobsleigh-specific fallback exercises by session type
FALLBACK_EXERCISES: Dict[str, Dict[str, List[Dict]]] = {
    "speed": {
        "main": [
            {
                "exercise_name": "30m Sprint",
                "sets": 6,
                "rest_seconds": 120,
                "notes": "From standing start, 100% effort",
                "measurement_type": "time",
            },
            {
                "exercise_name": "Block Starts",
                "sets": 8,
                "rest_seconds": 120,
                "notes": "Focus on first-step explosiveness, 15m distance",
                "measurement_type": "time",
            },
        ],
        "accessory": [
            {
                "exercise_name": "Broad Jump",
                "sets": 4,
                "reps": 3,
                "rest_seconds": 90,
                "notes": "Max effort each rep",
                "measurement_type": "distance",
            },
        ],
    },
    "strength": {
        "main": [
            {
                "exercise_name": "Back Squat",
                "sets": 5,
                "reps": 3,
                "rest_seconds": 240,
                "notes": "Focus on depth and drive",
                "measurement_type": "weight",
            },
            {
                "exercise_name": "Romanian Deadlift",
                "sets": 4,
                "reps": 6,
                "rest_seconds": 180,
                "notes": "Hip hinge emphasis",
                "measurement_type": "weight",
            },
        ],
        "accessory": [
            {
                "exercise_name": "Bulgarian Split Squat",
                "sets": 3,
                "reps": 8,
                "rest_seconds": 120,
                "notes": "Per leg, dumbbells",
                "measurement_type": "weight",
            },
        ],
    },
    "power": {
        "main": [
            {
                "exercise_name": "Power Clean",
                "sets": 5,
                "reps": 3,
                "rest_seconds": 180,
                "notes": "Explosive triple extension",
                "measurement_type": "weight",
            },
            {
                "exercise_name": "Power Snatch",
                "sets": 4,
                "reps": 2,
                "rest_seconds": 180,
                "notes": "Rate of force development",
                "measurement_type": "weight",
            },
        ],
        "accessory": [
            {
                "exercise_name": "Broad Jump",
                "sets": 4,
                "reps": 3,
                "rest_seconds": 90,
                "notes": "Max effort each rep",
                "measurement_type": "distance",
            },
        ],
    },
    "recovery": {
        "main": [
            {
                "exercise_name": "Foam Rolling",
                "sets": 1,
                "duration_minutes": 15,
                "notes": "Full body, focus on tight areas",
            },
            {
                "exercise_name": "Light Bodyweight Circuit",
                "sets": 2,
                "reps": 15,
                "rest_seconds": 60,
                "notes": "Squats, lunges, push-ups at low intensity",
            },
        ],
        "accessory": [],
    },
    "technique": {
        "main": [
            {
                "exercise_name": "Sprint Technique Drills",
                "sets": 4,
                "duration_minutes": 10,
                "rest_seconds": 60,
                "notes": "Focus on drive phase mechanics",
            },
            {
                "exercise_name": "Sled Push",
                "sets": 6,
                "rest_seconds": 120,
                "notes": "Sport-specific pushing power",
                "measurement_type": "weight",
            },
        ],
        "accessory": [],
    },
}


class ExerciseSelectionService:
    """Service for selecting exercises from the database for plan generation.

    Queries the exercises table by category, mapping session types to
    exercise categories. Falls back to hardcoded bobsleigh-specific
    defaults when the database has insufficient exercises.
    """

    async def select_exercises(
        self,
        session_type: str,
        section: str,
        count: int = 3,
    ) -> List[Dict]:
        """Select exercises for a given session type and section.

        Args:
            session_type: Type of training session (speed, strength, power,
                          recovery, technique).
            section: Section within the session (warm_up, main, accessory,
                     cool_down).
            count: Maximum number of exercises to return.

        Returns:
            List of exercise dicts with exercise_name, exercise_id (if from
            DB), and default set/rep/rest parameters.
        """
        # Warm-up and cool-down use hardcoded defaults
        if section == "warm_up":
            return DEFAULT_WARM_UP[:count]
        if section == "cool_down":
            return DEFAULT_COOL_DOWN[:count]

        # Try to fetch from database
        db_exercises = await self._query_exercises_by_session(
            session_type, section, count
        )
        if db_exercises:
            return db_exercises

        # Fallback to hardcoded defaults
        return self._get_fallback_exercises(session_type, section, count)

    async def _query_exercises_by_session(
        self,
        session_type: str,
        section: str,
        count: int,
    ) -> List[Dict]:
        """Query the exercises table for matching exercises.

        Args:
            session_type: Training session type.
            section: Section name (main or accessory).
            count: Max exercises to return.

        Returns:
            List of exercise dicts from DB, or empty list if none found.
        """
        categories = self._get_categories(session_type, section)
        if not categories:
            return []

        try:
            sb = get_supabase()
            result = (
                sb.table("exercises")
                .select("id, name, category, measurement_type, "
                        "muscle_groups, difficulty_level")
                .eq("is_active", True)
                .in_("category", categories)
                .limit(count)
                .execute()
            )

            if not result.data:
                return []

            return [
                self._format_db_exercise(ex, section)
                for ex in result.data
            ]
        except Exception:
            # Database unavailable -- fall through to fallback
            return []

    def _get_categories(
        self, session_type: str, section: str
    ) -> List[str]:
        """Get exercise categories for a session type and section.

        Args:
            session_type: Training session type.
            section: Section name (main or accessory).

        Returns:
            List of category strings to query against exercises table.
        """
        if section == "main":
            return SESSION_TYPE_CATEGORIES.get(session_type, [])

        if section == "accessory":
            main_categories = SESSION_TYPE_CATEGORIES.get(session_type, [])
            accessory_cats: List[str] = []
            for cat in main_categories:
                accessory_cats.extend(
                    ACCESSORY_CATEGORIES.get(cat, [])
                )
            # Deduplicate while preserving order
            seen = set()
            unique: List[str] = []
            for c in accessory_cats:
                if c not in seen:
                    seen.add(c)
                    unique.append(c)
            return unique

        return []

    def _format_db_exercise(
        self, exercise: Dict, section: str
    ) -> Dict:
        """Format a database exercise row into plan exercise format.

        Args:
            exercise: Row from exercises table.
            section: Section name for default set/rep assignment.

        Returns:
            Formatted exercise dict for plan_data.
        """
        measurement = exercise.get("measurement_type", "weight")
        base: Dict = {
            "exercise_id": exercise["id"],
            "exercise_name": exercise["name"],
            "measurement_type": measurement,
        }

        # Assign default sets/reps based on measurement type and section
        if measurement == "weight":
            if section == "main":
                base["sets"] = 4
                base["reps"] = 5
                base["rest_seconds"] = 180
            else:
                base["sets"] = 3
                base["reps"] = 8
                base["rest_seconds"] = 120
        elif measurement == "time":
            if section == "main":
                base["sets"] = 6
                base["rest_seconds"] = 120
            else:
                base["sets"] = 4
                base["rest_seconds"] = 90
        elif measurement == "distance":
            base["sets"] = 4
            base["reps"] = 3
            base["rest_seconds"] = 90

        return base

    def _get_fallback_exercises(
        self,
        session_type: str,
        section: str,
        count: int,
    ) -> List[Dict]:
        """Get hardcoded fallback exercises for a session type and section.

        Args:
            session_type: Training session type.
            section: Section name (main or accessory).
            count: Max exercises to return.

        Returns:
            List of fallback exercise dicts.
        """
        type_fallbacks = FALLBACK_EXERCISES.get(session_type, {})
        section_exercises = type_fallbacks.get(section, [])
        return section_exercises[:count]
