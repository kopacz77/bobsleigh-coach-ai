"""Plan generation service -- core rule-based training plan engine.

Produces personalized 7-day training plans for bobsleigh athletes
using PMC data, workout history, wellbeing trends, and coach feedback.
Plans are stored in the weekly_plans table with status 'pending_review'
for coach approval.

This is the most important service in Phase 6 (AI Training Engine).
"""

import math
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from app.db.session import get_supabase
from app.services.exercise_selection_service import ExerciseSelectionService
from app.services.pmc_service import PMCService


# ============================================================
# Weekly templates by training phase
# Each template defines 7 days (Mon=0 through Sun=6).
# session_type drives exercise selection via ExerciseSelectionService.
# ============================================================

WEEKLY_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "general_prep": [
        {
            "day_number": 1,
            "day_name": "Monday",
            "is_rest_day": False,
            "session_type": "strength",
            "title": "Lower Body Strength",
            "estimated_duration_minutes": 90,
            "target_intensity": "high",
            "target_rpe": 7,
        },
        {
            "day_number": 2,
            "day_name": "Tuesday",
            "is_rest_day": False,
            "session_type": "speed",
            "title": "Speed / Acceleration",
            "estimated_duration_minutes": 75,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 3,
            "day_name": "Wednesday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "Upper Body / Active Recovery",
            "estimated_duration_minutes": 60,
            "target_intensity": "low",
            "target_rpe": 4,
        },
        {
            "day_number": 4,
            "day_name": "Thursday",
            "is_rest_day": False,
            "session_type": "power",
            "title": "Power Development",
            "estimated_duration_minutes": 85,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 5,
            "day_name": "Friday",
            "is_rest_day": False,
            "session_type": "speed",
            "title": "Speed Endurance / Conditioning",
            "estimated_duration_minutes": 75,
            "target_intensity": "medium",
            "target_rpe": 7,
        },
        {
            "day_number": 6,
            "day_name": "Saturday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest / Optional Light Technique",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 7,
            "day_name": "Sunday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
    ],
    "specific_prep": [
        {
            "day_number": 1,
            "day_name": "Monday",
            "is_rest_day": False,
            "session_type": "speed",
            "title": "Acceleration Development",
            "estimated_duration_minutes": 75,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 2,
            "day_name": "Tuesday",
            "is_rest_day": False,
            "session_type": "strength",
            "title": "Max Strength - Lower Body",
            "estimated_duration_minutes": 90,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 3,
            "day_name": "Wednesday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "Recovery / Mobility",
            "estimated_duration_minutes": 45,
            "target_intensity": "low",
            "target_rpe": 3,
        },
        {
            "day_number": 4,
            "day_name": "Thursday",
            "is_rest_day": False,
            "session_type": "power",
            "title": "Power - Olympic Lifts & Plyometrics",
            "estimated_duration_minutes": 85,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 5,
            "day_name": "Friday",
            "is_rest_day": False,
            "session_type": "speed",
            "title": "Speed - Flying Sprints & Push Practice",
            "estimated_duration_minutes": 75,
            "target_intensity": "high",
            "target_rpe": 8,
        },
        {
            "day_number": 6,
            "day_name": "Saturday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Light Strength or Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 7,
            "day_name": "Sunday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
    ],
    "pre_competition": [
        {
            "day_number": 1,
            "day_name": "Monday",
            "is_rest_day": False,
            "session_type": "speed",
            "title": "Speed - Race Pace Efforts",
            "estimated_duration_minutes": 60,
            "target_intensity": "high",
            "target_rpe": 9,
        },
        {
            "day_number": 2,
            "day_name": "Tuesday",
            "is_rest_day": False,
            "session_type": "power",
            "title": "Power Maintenance",
            "estimated_duration_minutes": 60,
            "target_intensity": "medium",
            "target_rpe": 7,
        },
        {
            "day_number": 3,
            "day_name": "Wednesday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 4,
            "day_name": "Thursday",
            "is_rest_day": False,
            "session_type": "technique",
            "title": "Light Technique / Activation",
            "estimated_duration_minutes": 45,
            "target_intensity": "low",
            "target_rpe": 4,
        },
        {
            "day_number": 5,
            "day_name": "Friday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 6,
            "day_name": "Saturday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Competition or Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 7,
            "day_name": "Sunday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
    ],
    "competition": [
        {
            "day_number": 1,
            "day_name": "Monday",
            "is_rest_day": False,
            "session_type": "strength",
            "title": "Maintenance Strength",
            "estimated_duration_minutes": 60,
            "target_intensity": "medium",
            "target_rpe": 6,
        },
        {
            "day_number": 2,
            "day_name": "Tuesday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 3,
            "day_name": "Wednesday",
            "is_rest_day": False,
            "session_type": "technique",
            "title": "Light Technique",
            "estimated_duration_minutes": 45,
            "target_intensity": "low",
            "target_rpe": 4,
        },
        {
            "day_number": 4,
            "day_name": "Thursday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 5,
            "day_name": "Friday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "Pre-Competition Activation",
            "estimated_duration_minutes": 30,
            "target_intensity": "low",
            "target_rpe": 3,
        },
        {
            "day_number": 6,
            "day_name": "Saturday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Competition Day",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 7,
            "day_name": "Sunday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
    ],
    "transition": [
        {
            "day_number": 1,
            "day_name": "Monday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "Active Recovery",
            "estimated_duration_minutes": 45,
            "target_intensity": "low",
            "target_rpe": 3,
        },
        {
            "day_number": 2,
            "day_name": "Tuesday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 3,
            "day_name": "Wednesday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "General Fitness",
            "estimated_duration_minutes": 45,
            "target_intensity": "low",
            "target_rpe": 4,
        },
        {
            "day_number": 4,
            "day_name": "Thursday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 5,
            "day_name": "Friday",
            "is_rest_day": False,
            "session_type": "recovery",
            "title": "Light Activity / Mobility",
            "estimated_duration_minutes": 40,
            "target_intensity": "low",
            "target_rpe": 3,
        },
        {
            "day_number": 6,
            "day_name": "Saturday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
        {
            "day_number": 7,
            "day_name": "Sunday",
            "is_rest_day": True,
            "session_type": None,
            "title": "Rest",
            "estimated_duration_minutes": 0,
            "target_intensity": "none",
            "target_rpe": 0,
        },
    ],
}

# Intensity percent ranges by training phase and target_intensity
INTENSITY_RANGES: Dict[str, Dict[str, tuple]] = {
    "general_prep": {"high": (65, 80), "medium": (55, 70), "low": (40, 55)},
    "specific_prep": {"high": (80, 95), "medium": (70, 85), "low": (50, 65)},
    "pre_competition": {"high": (90, 100), "medium": (75, 85), "low": (50, 60)},
    "competition": {"high": (85, 95), "medium": (70, 80), "low": (50, 60)},
    "transition": {"high": (55, 65), "medium": (45, 55), "low": (35, 45)},
}


def _round_to_plate(weight_kg: float) -> float:
    """Round weight to the nearest 2.5kg (standard plate increment).

    Args:
        weight_kg: Raw weight in kilograms.

    Returns:
        Weight rounded to nearest 2.5kg, minimum 0.
    """
    if weight_kg <= 0:
        return 0.0
    return round(weight_kg / 2.5) * 2.5


class PlanGenerationService:
    """Rule-based training plan generation engine.

    Produces personalized 7-day plans by combining:
    - Athlete profile (training level, frequency, targets)
    - Current PMC state (CTL, ATL, TSB)
    - Recent workout history (last 4 weeks)
    - Recent wellbeing data (last 7 days)
    - Coach feedback history (rejection notes)
    - Exercise selection from the exercises table
    """

    def __init__(self) -> None:
        """Initialize the plan generation service."""
        self.pmc_service = PMCService()
        self.exercise_service = ExerciseSelectionService()

    async def generate_plan(
        self,
        athlete_id: str,
        week_start: str,
    ) -> Dict:
        """Generate a 7-day training plan for an athlete.

        Args:
            athlete_id: UUID of the athlete.
            week_start: Monday date as YYYY-MM-DD string.

        Returns:
            The full weekly plan dict (also saved to weekly_plans table).

        Raises:
            ValueError: If week_start is not a Monday or athlete not found.
        """
        # Validate week_start is a Monday
        start_date = datetime.strptime(week_start, "%Y-%m-%d").date()
        if start_date.weekday() != 0:
            raise ValueError(
                f"week_start must be a Monday, got {start_date.strftime('%A')}"
            )

        end_date = start_date + timedelta(days=6)

        sb = get_supabase()

        # 1. Fetch athlete profile
        athlete = await self._get_athlete(sb, athlete_id)

        # 2. Get current PMC state
        pmc_data = await self.pmc_service.calculate_pmc_for_athlete(
            athlete_id, days=90
        )
        current_tsb = pmc_data["tsb"][-1] if pmc_data["tsb"] else 0.0
        current_ctl = pmc_data["ctl"][-1] if pmc_data["ctl"] else 0.0
        current_atl = pmc_data["atl"][-1] if pmc_data["atl"] else 0.0

        # 3. Get recent workouts (last 4 weeks)
        four_weeks_ago = (start_date - timedelta(weeks=4)).isoformat()
        recent_workouts = await self._get_recent_workouts(
            sb, athlete_id, four_weeks_ago
        )

        # 4. Get recent wellbeing data (last 7 days)
        seven_days_ago = (start_date - timedelta(days=7)).isoformat()
        recent_wellbeing = await self._get_recent_wellbeing(
            sb, athlete_id, seven_days_ago
        )

        # 5. Get coach feedback history (rejection notes)
        feedback_history = await self._get_feedback_history(sb, athlete_id)

        # 6. Determine training phase
        training_phase = self._determine_phase(athlete)

        # 7. Select weekly template
        frequency = athlete.get("training_frequency", 4)
        template = self._select_weekly_template(
            training_phase, current_tsb, frequency
        )

        # 8. Fill template with exercises
        days = await self._fill_template_with_exercises(
            template, start_date, training_phase
        )

        # 9. Assign weights using three-tier logic
        days = self._assign_weights(
            days, recent_workouts, athlete, training_phase
        )

        # 10. Apply coach preferences from feedback
        plan_data = {
            "week_start": week_start,
            "week_end": end_date.isoformat(),
            "training_phase": training_phase,
            "days": days,
        }
        plan_data = self._apply_coach_preferences(plan_data, feedback_history)

        # 11. Build generation metadata
        generation_metadata = {
            "generated_at": datetime.utcnow().isoformat(),
            "pmc_state": {
                "ctl": round(current_ctl, 2),
                "atl": round(current_atl, 2),
                "tsb": round(current_tsb, 2),
            },
            "athlete_training_level": athlete.get("training_level", "intermediate"),
            "training_frequency": frequency,
            "recent_workout_count": len(recent_workouts),
            "recent_wellbeing_count": len(recent_wellbeing),
            "feedback_applied": len(feedback_history),
        }

        # 12. Compute simple injury risk score
        injury_risk = self._compute_injury_risk(
            current_tsb, current_ctl, current_atl, recent_wellbeing
        )

        # 13. Check for existing plan (same athlete + week + version)
        existing = (
            sb.table("weekly_plans")
            .select("id, version")
            .eq("athlete_id", athlete_id)
            .eq("week_start", week_start)
            .order("version", desc=True)
            .limit(1)
            .execute()
        )
        version = 1
        parent_plan_id = None
        if existing.data:
            version = existing.data[0]["version"] + 1
            parent_plan_id = existing.data[0]["id"]

        # 14. Save to weekly_plans table
        row = {
            "athlete_id": athlete_id,
            "week_start": week_start,
            "week_end": end_date.isoformat(),
            "plan_data": plan_data,
            "training_phase": training_phase,
            "status": "pending_review",
            "version": version,
            "parent_plan_id": parent_plan_id,
            "generation_metadata": generation_metadata,
            "injury_risk_score": injury_risk["score"],
            "injury_risk_factors": injury_risk["factors"],
        }
        insert_result = sb.table("weekly_plans").insert(row).execute()
        saved_plan = insert_result.data[0] if insert_result.data else row

        return saved_plan

    async def generate_plans_batch(
        self,
        coach_id: str,
        week_start: str,
    ) -> List[Dict]:
        """Generate plans for all athletes assigned to a coach.

        Args:
            coach_id: Coach UUID.
            week_start: Monday date as YYYY-MM-DD string.

        Returns:
            List of generated plan dicts (or error dicts for failures).
        """
        from app.services.coach_service import CoachService

        coach_service = CoachService()
        athlete_ids = await coach_service.get_athlete_ids(coach_id)

        results: List[Dict] = []
        for athlete_id in athlete_ids:
            try:
                plan = await self.generate_plan(athlete_id, week_start)
                results.append(plan)
            except Exception as e:
                results.append(
                    {
                        "athlete_id": athlete_id,
                        "error": str(e),
                        "status": "generation_failed",
                    }
                )

        return results

    # ================================================================
    # Internal helpers
    # ================================================================

    async def _get_athlete(self, sb: Any, athlete_id: str) -> Dict:
        """Fetch athlete profile from the athletes table.

        Args:
            sb: Supabase client.
            athlete_id: Athlete UUID.

        Returns:
            Athlete profile dict.

        Raises:
            ValueError: If athlete not found.
        """
        result = (
            sb.table("athletes")
            .select("*")
            .eq("id", athlete_id)
            .execute()
        )
        if not result.data:
            raise ValueError(f"Athlete not found: {athlete_id}")
        return result.data[0]

    async def _get_recent_workouts(
        self, sb: Any, athlete_id: str, from_date: str
    ) -> List[Dict]:
        """Fetch recent workouts with their exercises.

        Args:
            sb: Supabase client.
            athlete_id: Athlete UUID.
            from_date: Start date for query (ISO format).

        Returns:
            List of workout dicts with workout_exercises.
        """
        result = (
            sb.table("workouts")
            .select("*, workout_exercises(*, exercises(name, category))")
            .eq("athlete_id", athlete_id)
            .gte("date", from_date)
            .order("date", desc=True)
            .execute()
        )
        return result.data

    async def _get_recent_wellbeing(
        self, sb: Any, athlete_id: str, from_date: str
    ) -> List[Dict]:
        """Fetch recent wellbeing assessments.

        Uses athlete_id to look up user_id first, since wellbeing_assessments
        are keyed by user_id in production.

        Args:
            sb: Supabase client.
            athlete_id: Athlete UUID.
            from_date: Start date for query (ISO format).

        Returns:
            List of wellbeing assessment dicts.
        """
        # Get user_id from athlete record
        athlete_result = (
            sb.table("athletes")
            .select("user_id")
            .eq("id", athlete_id)
            .execute()
        )
        if not athlete_result.data or not athlete_result.data[0].get("user_id"):
            return []

        user_id = athlete_result.data[0]["user_id"]
        result = (
            sb.table("wellbeing_assessments")
            .select("*")
            .eq("user_id", user_id)
            .gte("date", from_date)
            .order("date", desc=True)
            .execute()
        )
        return result.data

    async def _get_feedback_history(
        self, sb: Any, athlete_id: str
    ) -> List[Dict]:
        """Get rejection notes from past plans for this athlete.

        Args:
            sb: Supabase client.
            athlete_id: Athlete UUID.

        Returns:
            List of dicts with rejection_notes from rejected plans.
        """
        result = (
            sb.table("weekly_plans")
            .select("rejection_notes, rejected_at, week_start")
            .eq("athlete_id", athlete_id)
            .eq("status", "rejected")
            .order("rejected_at", desc=True)
            .limit(10)
            .execute()
        )
        return [
            row for row in result.data
            if row.get("rejection_notes")
        ]

    def _determine_phase(self, athlete: Dict) -> str:
        """Determine the current training phase for an athlete.

        Uses athlete.performance_targets.training_phase if set,
        otherwise defaults to 'general_prep'.

        Args:
            athlete: Athlete profile dict.

        Returns:
            Training phase string.
        """
        targets = athlete.get("performance_targets")
        if targets and isinstance(targets, dict):
            phase = targets.get("training_phase")
            if phase and phase in WEEKLY_TEMPLATES:
                return phase
        return "general_prep"

    def _select_weekly_template(
        self,
        phase: str,
        tsb: float,
        frequency: int,
    ) -> List[Dict]:
        """Select and optionally adjust a weekly template.

        If TSB is very negative (fatigued), reduce training days.
        If frequency is lower than template sessions, convert extra
        training days to rest.

        Args:
            phase: Training phase string.
            tsb: Current Training Stress Balance value.
            frequency: Athlete's preferred weekly training frequency.

        Returns:
            List of 7 day template dicts (potentially modified).
        """
        import copy

        template = copy.deepcopy(
            WEEKLY_TEMPLATES.get(phase, WEEKLY_TEMPLATES["general_prep"])
        )

        # Count training days in template
        training_days = [d for d in template if not d["is_rest_day"]]
        num_training = len(training_days)

        # If athlete is very fatigued (TSB < -20), reduce by 1 session
        if tsb < -20 and num_training > 2:
            # Convert the last training day to rest
            for d in reversed(template):
                if not d["is_rest_day"]:
                    d["is_rest_day"] = True
                    d["session_type"] = None
                    d["title"] = "Rest (fatigue adjustment)"
                    d["estimated_duration_minutes"] = 0
                    d["target_intensity"] = "none"
                    d["target_rpe"] = 0
                    break
            num_training -= 1

        # If frequency is lower than template sessions, trim from end
        while num_training > frequency:
            for d in reversed(template):
                if not d["is_rest_day"]:
                    d["is_rest_day"] = True
                    d["session_type"] = None
                    d["title"] = "Rest (frequency adjustment)"
                    d["estimated_duration_minutes"] = 0
                    d["target_intensity"] = "none"
                    d["target_rpe"] = 0
                    num_training -= 1
                    break

        return template

    async def _fill_template_with_exercises(
        self,
        template: List[Dict],
        start_date: date,
        training_phase: str,
    ) -> List[Dict]:
        """Fill each training day's sections with exercises.

        Args:
            template: 7-day template with session types.
            start_date: Monday date for this week.
            training_phase: Current training phase.

        Returns:
            List of 7 day dicts with populated sections.
        """
        days = []
        for day_template in template:
            day_date = start_date + timedelta(days=day_template["day_number"] - 1)
            day: Dict[str, Any] = {
                "day_number": day_template["day_number"],
                "day_name": day_template["day_name"],
                "date": day_date.isoformat(),
                "is_rest_day": day_template["is_rest_day"],
                "session_type": day_template.get("session_type"),
                "title": day_template["title"],
                "estimated_duration_minutes": day_template[
                    "estimated_duration_minutes"
                ],
                "target_intensity": day_template["target_intensity"],
                "target_rpe": day_template["target_rpe"],
            }

            if day_template["is_rest_day"]:
                day["sections"] = []
            else:
                session_type = day_template["session_type"] or "recovery"
                sections = []

                # Warm-up
                warm_up = await self.exercise_service.select_exercises(
                    session_type, "warm_up", count=2
                )
                sections.append({"name": "warm_up", "exercises": warm_up})

                # Main
                main = await self.exercise_service.select_exercises(
                    session_type, "main", count=3
                )
                sections.append({"name": "main", "exercises": main})

                # Accessory
                accessory = await self.exercise_service.select_exercises(
                    session_type, "accessory", count=2
                )
                if accessory:
                    sections.append({"name": "accessory", "exercises": accessory})

                # Cool-down
                cool_down = await self.exercise_service.select_exercises(
                    session_type, "cool_down", count=1
                )
                sections.append({"name": "cool_down", "exercises": cool_down})

                day["sections"] = sections

            days.append(day)

        return days

    def _assign_weights(
        self,
        days: List[Dict],
        recent_workouts: List[Dict],
        athlete: Dict,
        training_phase: str,
    ) -> List[Dict]:
        """Assign weights to exercises using three-tier logic.

        Tier 1: Use weight from recent workout history for this exercise.
        Tier 2: Use athlete profile max (performance_targets) with phase %.
        Tier 3: Conservative estimate at 50-60% of a related exercise.

        Args:
            days: Plan days with sections and exercises.
            recent_workouts: Last 4 weeks of workouts with exercises.
            athlete: Athlete profile dict.
            training_phase: Current training phase for intensity ranges.

        Returns:
            Days list with planned_weight_kg and intensity_percent added.
        """
        # Build exercise history lookup: exercise_name -> last weight used
        exercise_history = self._build_exercise_history(recent_workouts)

        # Get athlete's known maxes from performance_targets
        targets = athlete.get("performance_targets") or {}
        known_maxes = targets.get("maxes", {})

        # Get intensity range for this phase
        phase_ranges = INTENSITY_RANGES.get(
            training_phase, INTENSITY_RANGES["general_prep"]
        )

        for day in days:
            if day.get("is_rest_day"):
                continue

            target_intensity = day.get("target_intensity", "medium")
            intensity_range = phase_ranges.get(
                target_intensity, phase_ranges.get("medium", (60, 75))
            )
            # Use midpoint of intensity range
            target_pct = (intensity_range[0] + intensity_range[1]) / 2

            for section in day.get("sections", []):
                section_name = section.get("name", "")
                if section_name in ("warm_up", "cool_down"):
                    continue

                for exercise in section.get("exercises", []):
                    measurement = exercise.get("measurement_type", "weight")
                    if measurement != "weight":
                        continue

                    ex_name = exercise.get("exercise_name", "")

                    # Tier 1: History
                    if ex_name in exercise_history:
                        last_weight = exercise_history[ex_name]["weight"]
                        last_rpe = exercise_history[ex_name].get("rpe")

                        # Apply progression logic
                        if last_rpe and last_rpe <= 8:
                            # Completed comfortably -- small increase
                            planned = _round_to_plate(last_weight + 2.5)
                        elif last_rpe and last_rpe > 8:
                            # Was very hard -- maintain
                            planned = _round_to_plate(last_weight)
                        else:
                            # No RPE data -- maintain
                            planned = _round_to_plate(last_weight)

                        exercise["planned_weight_kg"] = planned
                        exercise["weight_source"] = "history"
                        exercise["last_performed_weight"] = last_weight
                        if last_weight > 0:
                            exercise["intensity_percent"] = round(
                                (planned / last_weight) * (target_pct / 100) * 100,
                                1,
                            )
                        continue

                    # Tier 2: Profile max
                    # Normalize name for lookup (e.g., "Back Squat" -> "back_squat")
                    max_key = ex_name.lower().replace(" ", "_")
                    one_rm = known_maxes.get(max_key)
                    if one_rm and one_rm > 0:
                        planned = _round_to_plate(one_rm * (target_pct / 100))
                        exercise["planned_weight_kg"] = planned
                        exercise["intensity_percent"] = target_pct
                        exercise["weight_source"] = "profile"
                        continue

                    # Tier 3: Conservative estimate
                    # Use 50-60% of any known exercise weight as baseline
                    conservative_pct = 0.55
                    estimated = False
                    for hist_name, hist_data in exercise_history.items():
                        if hist_data["weight"] > 0:
                            base_weight = hist_data["weight"] * conservative_pct
                            planned = _round_to_plate(base_weight)
                            exercise["planned_weight_kg"] = planned
                            exercise["weight_source"] = "estimate"
                            exercise["estimate_basis"] = hist_name
                            estimated = True
                            break

                    if not estimated:
                        # No reference at all -- skip weight assignment
                        exercise["weight_source"] = "none"
                        exercise["notes"] = exercise.get("notes", "") + (
                            " [Weight TBD - no history available]"
                        )

        return days

    def _build_exercise_history(
        self, recent_workouts: List[Dict]
    ) -> Dict[str, Dict]:
        """Build a lookup of exercise name -> latest performance data.

        Args:
            recent_workouts: Workouts with nested workout_exercises.

        Returns:
            Dict mapping exercise name to dict with weight, reps, rpe.
        """
        history: Dict[str, Dict] = {}

        # Workouts are ordered desc by date; first occurrence per exercise
        # is the most recent
        for workout in recent_workouts:
            workout_rpe = workout.get("rpe")
            for we in workout.get("workout_exercises", []):
                ex_data = we.get("exercises", {})
                if not ex_data:
                    continue
                ex_name = ex_data.get("name", "")
                if not ex_name or ex_name in history:
                    continue

                weight = (
                    we.get("actual_weight")
                    or we.get("planned_weight")
                    or 0
                )
                history[ex_name] = {
                    "weight": float(weight),
                    "reps": we.get("actual_reps") or we.get("planned_reps"),
                    "rpe": workout_rpe,
                    "date": workout.get("date"),
                }

        return history

    def _apply_coach_preferences(
        self,
        plan_data: Dict,
        feedback_history: List[Dict],
    ) -> Dict:
        """Adjust plan based on coach rejection feedback patterns.

        Simple keyword matching on rejection notes:
        - 'volume' + 'high'/'too much' -> reduce sets by 1
        - 'intensity' + 'high'/'heavy' -> reduce weight by 5%
        - 'volume' + 'low'/'not enough' -> increase sets by 1
        - 'intensity' + 'low'/'light' -> increase weight by 5%

        Args:
            plan_data: The plan_data dict with days/sections/exercises.
            feedback_history: List of dicts with rejection_notes.

        Returns:
            Adjusted plan_data dict.
        """
        if not feedback_history:
            return plan_data

        # Tally adjustments from recent rejections
        volume_adj = 0  # negative = reduce, positive = increase
        intensity_adj = 0.0  # negative = reduce weight %, positive = increase

        for fb in feedback_history:
            notes = (fb.get("rejection_notes") or "").lower()

            # Volume adjustments
            if "volume" in notes and any(
                w in notes for w in ["high", "too much", "reduce", "less"]
            ):
                volume_adj -= 1
            elif "volume" in notes and any(
                w in notes for w in ["low", "not enough", "more", "increase"]
            ):
                volume_adj += 1

            # Intensity adjustments
            if "intensity" in notes and any(
                w in notes for w in ["high", "heavy", "reduce", "lighter"]
            ):
                intensity_adj -= 0.05
            elif "intensity" in notes and any(
                w in notes for w in ["low", "light", "increase", "heavier"]
            ):
                intensity_adj += 0.05

        # Cap adjustments
        volume_adj = max(-2, min(2, volume_adj))
        intensity_adj = max(-0.15, min(0.15, intensity_adj))

        if volume_adj == 0 and intensity_adj == 0.0:
            return plan_data

        # Apply adjustments to exercises
        for day in plan_data.get("days", []):
            if day.get("is_rest_day"):
                continue
            for section in day.get("sections", []):
                if section.get("name") in ("warm_up", "cool_down"):
                    continue
                for exercise in section.get("exercises", []):
                    # Volume adjustment: modify sets
                    if volume_adj != 0 and "sets" in exercise:
                        exercise["sets"] = max(
                            1, exercise["sets"] + volume_adj
                        )

                    # Intensity adjustment: modify weight
                    if (
                        intensity_adj != 0.0
                        and "planned_weight_kg" in exercise
                    ):
                        adjusted = exercise["planned_weight_kg"] * (
                            1.0 + intensity_adj
                        )
                        exercise["planned_weight_kg"] = _round_to_plate(
                            adjusted
                        )

        return plan_data

    def _compute_injury_risk(
        self,
        tsb: float,
        ctl: float,
        atl: float,
        recent_wellbeing: List[Dict],
    ) -> Dict:
        """Compute a simple rule-based injury risk score.

        Combines TSB, ACWR (ATL/CTL), and recent wellbeing signals.

        Args:
            tsb: Current Training Stress Balance.
            ctl: Current Chronic Training Load.
            atl: Current Acute Training Load.
            recent_wellbeing: Recent wellbeing assessment rows.

        Returns:
            Dict with score (0-1), level (low/moderate/high), factors list.
        """
        risk_score = 0.0
        factors: List[str] = []

        # TSB component (0-0.3)
        if tsb < -30:
            risk_score += 0.3
            factors.append("Severe fatigue (TSB < -30)")
        elif tsb < -20:
            risk_score += 0.2
            factors.append("High fatigue (TSB < -20)")
        elif tsb < -10:
            risk_score += 0.1
            factors.append("Moderate fatigue")

        # ACWR component (0-0.3)
        if ctl > 0:
            acwr = atl / ctl
            if acwr > 1.5:
                risk_score += 0.3
                factors.append(f"ACWR > 1.5 ({acwr:.2f}) -- danger zone")
            elif acwr > 1.3:
                risk_score += 0.15
                factors.append(f"ACWR rising ({acwr:.2f})")
            elif acwr < 0.8:
                risk_score += 0.1
                factors.append(f"Under-prepared (ACWR {acwr:.2f})")

        # Wellbeing component (0-0.4)
        if recent_wellbeing:
            # Average readiness over last few days
            readiness_scores = []
            sleep_scores = []
            for wb in recent_wellbeing[:3]:  # last 3 entries
                # Use physical_readiness if available, else energy_level
                pr = wb.get("physical_readiness") or wb.get("energy_level")
                if pr is not None:
                    readiness_scores.append(float(pr))
                sq = wb.get("sleep_quality")
                if sq is not None:
                    sleep_scores.append(float(sq))

            if readiness_scores:
                avg_readiness = sum(readiness_scores) / len(readiness_scores)
                if avg_readiness < 4:
                    risk_score += 0.2
                    factors.append(
                        f"Poor readiness (3-day avg {avg_readiness:.1f})"
                    )
                elif avg_readiness < 6:
                    risk_score += 0.1
                    factors.append("Below-average readiness")

            if sleep_scores:
                avg_sleep = sum(sleep_scores) / len(sleep_scores)
                if avg_sleep < 4:
                    risk_score += 0.2
                    factors.append(
                        f"Poor sleep quality (avg {avg_sleep:.1f})"
                    )

        # Classify
        risk_score = min(risk_score, 1.0)
        if risk_score >= 0.6:
            level = "high"
        elif risk_score >= 0.3:
            level = "moderate"
        else:
            level = "low"

        return {
            "score": round(risk_score, 3),
            "level": level,
            "factors": factors,
        }
