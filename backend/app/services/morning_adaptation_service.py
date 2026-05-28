"""Morning adaptation service for readiness-based load adjustment.

Adjusts planned workout loads based on the athlete's morning wellness
check-in. Adaptation is computed on every read (not stored), keeping
the approved weekly plan immutable.

Readiness tiers determine weight multipliers and rep adjustments:
- 8-10: No change (multiplier 1.0)
- 6-7.9: Mild reduction (multiplier 0.90)
- 4-5.9: Moderate reduction (multiplier 0.80)
- 2-3.9: Significant reduction (multiplier 0.65)
- < 2: Severe reduction (multiplier 0.50), coach alerted
"""

import copy
import logging
from datetime import date

from app.db.repositories.athlete_repo import AthleteRepository
from app.db.repositories.wellbeing_repo import WellbeingRepository

logger = logging.getLogger(__name__)


# Readiness tier configuration: (min_readiness, multiplier, message, reduce_reps)
_READINESS_TIERS = [
    (8.0, 1.0, "You're ready - go as planned", False),
    (6.0, 0.90, "Slightly lighter today - listen to your body", False),
    (4.0, 0.80, "Reduced load today - focus on quality", True),
    (2.0, 0.65, "Light session recommended - recovery priority", True),
    (0.0, 0.50, "Recovery day strongly recommended", True),
]


def _round_to_plate(weight_kg: float) -> float:
    """Round weight to the nearest 2.5kg plate increment."""
    return round(weight_kg / 2.5) * 2.5


def _calculate_readiness(row: dict) -> float:
    """Calculate readiness score from a wellbeing assessment row.

    Formula: average of sleep_quality, inverted stress, nutrition_quality,
    physical_readiness, and mental_clarity. Result is on a 1-10 scale.
    """
    return (
        row["sleep_quality"]
        + (10 - row["stress_level"])
        + row["nutrition_quality"]
        + row["physical_readiness"]
        + row["mental_clarity"]
    ) / 5


def _get_tier(readiness: float) -> tuple:
    """Get the adaptation tier for a given readiness score.

    Returns (multiplier, message, reduce_reps) for the matching tier.
    """
    for min_score, multiplier, message, reduce_reps in _READINESS_TIERS:
        if readiness >= min_score:
            return multiplier, message, reduce_reps
    # Fallback (should not reach here given 0.0 floor)
    return 0.50, "Recovery day strongly recommended", True


class MorningAdaptationService:
    """Service that adapts today's planned workout based on morning check-in.

    Fetches the athlete's morning wellbeing assessment, calculates readiness,
    determines a load multiplier, and applies it to all weight-based exercises.
    Does NOT modify the original plan -- adapted values are additional fields.
    """

    def __init__(self) -> None:
        """Initialize morning adaptation service with repositories."""
        self.athlete_repo = AthleteRepository()
        self.wellbeing_repo = WellbeingRepository()

    async def adapt_workout(self, plan_day: dict, athlete_user_id: str) -> dict:
        """Adapt a planned workout day based on morning wellness check-in.

        Args:
            plan_day: The day entry from plan_data["days"] for today.
            athlete_user_id: The user_id of the athlete (for wellbeing lookup).

        Returns:
            A new dict with original plan data preserved and adaptation
            metadata + adapted exercise values added. If no check-in exists,
            returns the plan day unmodified with adaptation_applied = False.
        """
        # Fetch today's wellbeing check-in
        checkin = await self._get_todays_checkin(athlete_user_id)

        if checkin is None:
            # No morning check-in -- return plan unmodified
            return {
                **plan_day,
                "adaptation": {
                    "applied": False,
                    "readiness_score": None,
                    "multiplier": 1.0,
                    "message": "No morning check-in found - showing planned values",
                    "coach_alert": False,
                },
            }

        # Calculate readiness score
        readiness = _calculate_readiness(checkin)
        multiplier, message, reduce_reps = _get_tier(readiness)
        coach_alert = readiness < 2

        if coach_alert:
            logger.warning(
                "Low readiness alert for user %s: score=%.1f",
                athlete_user_id,
                readiness,
            )

        # Deep copy sections to avoid mutating the original plan_day
        adapted_sections = copy.deepcopy(plan_day.get("sections", []))

        # Apply adaptation to exercises in each section
        for section in adapted_sections:
            for exercise in section.get("exercises", []):
                # Adapt weight if planned_weight_kg exists
                if "planned_weight_kg" in exercise and exercise["planned_weight_kg"]:
                    planned_weight = exercise["planned_weight_kg"]
                    exercise["adapted_weight_kg"] = _round_to_plate(
                        planned_weight * multiplier
                    )

                # Adapt reps if readiness < 4 (reduce_reps tier)
                if reduce_reps and "reps" in exercise and exercise["reps"]:
                    planned_reps = exercise["reps"]
                    exercise["adapted_reps"] = max(
                        1, int(planned_reps * 0.75)
                    )

        return {
            **plan_day,
            "adaptation": {
                "applied": True,
                "readiness_score": round(readiness, 1),
                "multiplier": multiplier,
                "message": message,
                "coach_alert": coach_alert,
            },
            "sections": adapted_sections,
        }

    async def _get_todays_checkin(self, user_id: str) -> dict | None:
        """Fetch today's wellbeing assessment for the given user.

        Resolves user_id -> athlete_id (wellbeing_assessments is keyed by
        athlete_id), then queries today's record. Returns the row dict if
        found, or None if no check-in exists today.
        """
        try:
            today = date.today().isoformat()
            return self.wellbeing_repo.get_by_user_and_date(user_id, today)
        except Exception as e:
            logger.error(
                "Failed to fetch wellbeing check-in for user %s: %s",
                user_id,
                str(e),
            )
            # On error, return None so plan is shown unmodified
            return None
