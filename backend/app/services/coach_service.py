"""Coach service for roster management, PMC summaries, and alert generation.

Provides methods for coaches to manage their athlete roster, view multi-athlete
PMC summaries, and receive computed alerts for concerning trends. Alerts are
calculated on read (not stored) matching the established readiness pattern.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List

from app.db.repositories.coach_repo import CoachRepository
from app.db.repositories.wellbeing_repo import WellbeingRepository
from app.services.pmc_service import PMCService


def _calculate_readiness(row: dict) -> float:
    """Calculate readiness score from a wellbeing assessment row.

    Readiness formula: average of sleep_quality, inverted stress,
    nutrition_quality, physical_readiness, and mental_clarity.

    Args:
        row: Wellbeing assessment dict with metric fields.

    Returns:
        Readiness score as a float (1-10 scale).
    """
    return round(
        (
            row["sleep_quality"]
            + (10 - row["stress_level"])
            + row["nutrition_quality"]
            + row["physical_readiness"]
            + row["mental_clarity"]
        )
        / 5
    )


class CoachService:
    """Service for coach-specific operations including roster and alerts."""

    def __init__(self):
        """Initialize the coach service."""
        self.pmc_service = PMCService()
        self.coach_repo = CoachRepository()
        self.wellbeing_repo = WellbeingRepository()

    async def get_coach_id(self, user_id: str) -> str:
        """Look up the coach UUID for a given auth user ID.

        Args:
            user_id: Supabase auth user UUID.

        Returns:
            The coach UUID string.

        Raises:
            ValueError: If no coach record exists for this user.
        """
        coach_id = self.coach_repo.get_coach_id_by_user_id(user_id)
        if not coach_id:
            raise ValueError(f"No coach record found for user {user_id}")
        return coach_id

    async def get_athlete_ids(self, coach_id: str) -> List[str]:
        """Get list of active athlete IDs for a coach.

        Args:
            coach_id: Coach UUID.

        Returns:
            List of athlete UUID strings for active relationships.
        """
        return self.coach_repo.get_athlete_ids(coach_id)

    async def get_roster(self, coach_id: str) -> List[Dict]:
        """Get the coach's athlete roster with joined athlete data.

        Args:
            coach_id: Coach UUID.

        Returns:
            List of roster entries with athlete details (name, email, status).
        """
        return self.coach_repo.get_athletes(coach_id)

    async def get_athletes_pmc_summary(self, coach_id: str) -> List[Dict]:
        """Get PMC summary (CTL/ATL/TSB) for all coached athletes.

        Calculates current PMC metrics for each athlete using 14 days of
        training load data. Sequential per-athlete due to exponential decay
        math requirements.

        Args:
            coach_id: Coach UUID.

        Returns:
            List of dicts with athlete_id, athlete_name, ctl, atl, tsb,
            last_load, and last_load_date for each athlete.
        """
        athlete_ids = await self.get_athlete_ids(coach_id)
        if not athlete_ids:
            return []

        # Batch-fetch athlete names via repository
        name_map = self.coach_repo.get_athlete_names(athlete_ids)

        summaries = []

        for athlete_id in athlete_ids:
            pmc_data = await self.pmc_service.calculate_pmc_for_athlete(
                athlete_id, days=14
            )

            if pmc_data["dates"]:
                ctl = round(pmc_data["ctl"][-1], 1)
                atl = round(pmc_data["atl"][-1], 1)
                tsb = round(pmc_data["tsb"][-1], 1)
                last_load = round(pmc_data["loads"][-1], 0) if pmc_data["loads"] else None
                last_load_date = pmc_data["dates"][-1]
            else:
                ctl = 0.0
                atl = 0.0
                tsb = 0.0
                last_load = None
                last_load_date = None

            summaries.append(
                {
                    "athlete_id": athlete_id,
                    "athlete_name": name_map.get(athlete_id, "Unknown"),
                    "ctl": ctl,
                    "atl": atl,
                    "tsb": tsb,
                    "last_load": last_load,
                    "last_load_date": last_load_date,
                }
            )

        return summaries

    async def generate_alerts(self, coach_id: str) -> List[Dict]:
        """Generate computed alerts for all coached athletes.

        Alerts are calculated on read (not stored in notifications table).
        Checks for:
        - missed_checkin: No wellbeing assessment in 2+ days (severity: medium)
        - low_readiness: Average readiness < 4 over last 2 days (severity: high)
        - fatigue_spike: TSB < -20 or ATL/CTL ratio > 1.5 (severity: high)
        - overtraining_risk: TSB < -30 (severity: high)

        Uses batched wellbeing queries to avoid N+1 problem.

        Args:
            coach_id: Coach UUID.

        Returns:
            List of alert dicts with type, severity, athlete_id,
            athlete_name, message, and date.
        """
        athlete_ids = await self.get_athlete_ids(coach_id)
        if not athlete_ids:
            return []

        today = date.today()
        today_str = today.isoformat()
        two_days_ago = (today - timedelta(days=2)).isoformat()
        seven_days_ago = (today - timedelta(days=7)).isoformat()

        # Batch-fetch athlete metadata via repository
        athlete_rows = self.coach_repo.get_athletes_with_user_ids(athlete_ids)
        athlete_map = {
            a["id"]: {
                "name": f"{a['first_name']} {a['last_name']}",
                "user_id": a["user_id"],
            }
            for a in athlete_rows
        }

        # Build per-athlete recent assessment lists (last 7 days).
        # The wellbeing schema is now keyed by athlete_id + assessment_date.
        wellbeing_by_athlete: Dict[str, List[dict]] = {}
        for athlete_id in athlete_ids:
            rows = self.wellbeing_repo.get_range(athlete_id, seven_days_ago)
            # get_range returns ascending order; reverse for newest-first.
            wellbeing_by_athlete[athlete_id] = list(reversed(rows))

        alerts = []

        for athlete_id in athlete_ids:
            info = athlete_map.get(athlete_id)
            if not info:
                continue

            athlete_name = info["name"]
            assessments = wellbeing_by_athlete.get(athlete_id, [])

            # Alert 1: missed_checkin - no assessment in 2+ days
            if assessments:
                latest = assessments[0].get("assessment_date")
                latest_date = (
                    latest if isinstance(latest, str) else latest.isoformat()
                )
                if latest_date < two_days_ago:
                    alerts.append(
                        {
                            "type": "missed_checkin",
                            "severity": "medium",
                            "athlete_id": athlete_id,
                            "athlete_name": athlete_name,
                            "message": (
                                f"{athlete_name} has not submitted a "
                                f"wellbeing check-in since {latest_date}."
                            ),
                            "date": today_str,
                        }
                    )
            else:
                # No assessments at all in last 7 days
                alerts.append(
                    {
                        "type": "missed_checkin",
                        "severity": "medium",
                        "athlete_id": athlete_id,
                        "athlete_name": athlete_name,
                        "message": (
                            f"{athlete_name} has no recent wellbeing "
                            f"check-ins."
                        ),
                        "date": today_str,
                    }
                )

            # Alert 2: low_readiness - avg readiness < 4 over last 2 days
            recent_assessments = []
            for a in assessments:
                a_date = a.get("assessment_date")
                a_date_str = (
                    a_date if isinstance(a_date, str) else a_date.isoformat()
                )
                if a_date_str >= two_days_ago:
                    recent_assessments.append(a)
            if recent_assessments:
                readiness_scores = []
                for a in recent_assessments:
                    try:
                        readiness_scores.append(_calculate_readiness(a))
                    except (KeyError, TypeError):
                        continue
                if readiness_scores:
                    avg_readiness = sum(readiness_scores) / len(readiness_scores)
                    if avg_readiness < 4:
                        alerts.append(
                            {
                                "type": "low_readiness",
                                "severity": "high",
                                "athlete_id": athlete_id,
                                "athlete_name": athlete_name,
                                "message": (
                                    f"{athlete_name} has low readiness "
                                    f"(avg {avg_readiness:.1f}/10 over last 2 days). "
                                    f"Recovery day recommended."
                                ),
                                "date": today_str,
                            }
                        )

        # PMC-based alerts: fatigue_spike and overtraining_risk
        pmc_summaries = await self.get_athletes_pmc_summary(coach_id)
        for summary in pmc_summaries:
            athlete_id = summary["athlete_id"]
            info = athlete_map.get(athlete_id)
            if not info:
                continue
            athlete_name = info["name"]
            current_tsb = summary["tsb"]
            current_atl = summary["atl"]
            current_ctl = summary["ctl"]

            # Alert 3: fatigue_spike - TSB < -20 or ATL/CTL > 1.5
            is_fatigue_spike = False
            if current_tsb < -20:
                is_fatigue_spike = True
            if current_ctl > 0 and (current_atl / current_ctl) > 1.5:
                is_fatigue_spike = True

            if is_fatigue_spike and current_tsb >= -30:
                ratio_str = (
                    f"{current_atl / current_ctl:.2f}"
                    if current_ctl > 0
                    else "N/A"
                )
                alerts.append(
                    {
                        "type": "fatigue_spike",
                        "severity": "high",
                        "athlete_id": athlete_id,
                        "athlete_name": athlete_name,
                        "message": (
                            f"{athlete_name} shows a fatigue spike "
                            f"(TSB: {current_tsb}, ATL/CTL: {ratio_str}). "
                            f"Consider reducing training load."
                        ),
                        "date": today_str,
                    }
                )

            # Alert 4: overtraining_risk - TSB < -30
            if current_tsb < -30:
                alerts.append(
                    {
                        "type": "overtraining_risk",
                        "severity": "high",
                        "athlete_id": athlete_id,
                        "athlete_name": athlete_name,
                        "message": (
                            f"{athlete_name} is at overtraining risk "
                            f"(TSB: {current_tsb}). Immediate load "
                            f"reduction recommended."
                        ),
                        "date": today_str,
                    }
                )

        return alerts

    async def add_athlete(
        self,
        coach_id: str,
        athlete_id: str,
        relationship_type: str = "primary",
    ) -> Dict:
        """Add an athlete to the coach's roster.

        Args:
            coach_id: Coach UUID.
            athlete_id: Athlete UUID to add.
            relationship_type: Type of relationship (default: "primary").

        Returns:
            The inserted coach_athletes row.
        """
        return self.coach_repo.add_athlete(
            coach_id, athlete_id, relationship_type
        )

    async def remove_athlete(self, coach_id: str, athlete_id: str) -> Dict:
        """Soft-remove an athlete from the coach's roster.

        Sets ended_at to today rather than deleting the row, preserving
        the coaching relationship history.

        Args:
            coach_id: Coach UUID.
            athlete_id: Athlete UUID to remove.

        Returns:
            The updated coach_athletes row.
        """
        result = self.coach_repo.remove_athlete(coach_id, athlete_id)
        return result if result else {}
