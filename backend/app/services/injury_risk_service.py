"""Injury risk assessment service.

Combines ACWR (Acute:Chronic Workload Ratio), TSB (Training Stress Balance),
wellbeing trends, and sleep quality into a single composite risk score (0-1).

This is a rule-based assessment -- not the ML model from ml/models/injury_risk_model.py
which requires sufficient training data. The rules encode sport science thresholds
commonly used in athlete monitoring literature.
"""

import logging
from datetime import date, timedelta
from typing import Any, Dict, List

from app.db.repositories.wellbeing_repo import WellbeingRepository
from app.services.pmc_service import PMCService

logger = logging.getLogger(__name__)


def _calculate_readiness(row: dict) -> float:
    """Calculate readiness score from a wellbeing assessment row.

    Mirrors the formula in coach_service._calculate_readiness:
    average of sleep_quality, inverted stress, nutrition_quality,
    physical_readiness, and mental_clarity.

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


class InjuryRiskService:
    """Service for computing composite injury risk scores.

    Risk components:
    - TSB component (0-0.3): Training Stress Balance fatigue signal
    - ACWR component (0-0.3): Acute:Chronic Workload Ratio
    - Wellbeing trend component (0-0.2): 3-day readiness average
    - Sleep component (0-0.2): 3-day sleep quality average

    Classification:
    - score >= 0.6: "high"
    - score >= 0.3: "moderate"
    - else: "low"
    """

    def __init__(self) -> None:
        """Initialize injury risk service with PMC dependency."""
        self.pmc_service = PMCService()
        self.wellbeing_repo = WellbeingRepository()

    async def assess_risk(self, athlete_id: str) -> Dict[str, Any]:
        """Assess composite injury risk for an athlete.

        Gathers PMC data and recent wellbeing assessments, then scores
        each risk component independently and sums them.

        Args:
            athlete_id: UUID of the athlete.

        Returns:
            Dict with:
                score (float): 0.0-1.0 composite risk score.
                level (str): "low", "moderate", or "high".
                factors (list[str]): Contributing risk factor descriptions.
                acwr (float): Current ACWR value (0.0 if no CTL data).
        """
        risk_score = 0.0
        factors: List[str] = []
        acwr = 0.0

        # ---- PMC data (TSB + ACWR) ----
        pmc_data = await self.pmc_service.calculate_pmc_for_athlete(
            athlete_id, days=90
        )

        current_tsb = pmc_data["tsb"][-1] if pmc_data["tsb"] else 0.0
        current_ctl = pmc_data["ctl"][-1] if pmc_data["ctl"] else 0.0
        current_atl = pmc_data["atl"][-1] if pmc_data["atl"] else 0.0

        # TSB component (0-0.3)
        if current_tsb < -30:
            risk_score += 0.3
            factors.append("Severe fatigue TSB < -30")
        elif current_tsb < -20:
            risk_score += 0.2
            factors.append("High fatigue TSB < -20")
        elif current_tsb < -10:
            risk_score += 0.1
            factors.append("Moderate fatigue")

        # ACWR component (0-0.3)
        if current_ctl > 0:
            acwr = current_atl / current_ctl

            if acwr > 1.5:
                risk_score += 0.3
                factors.append(f"ACWR > 1.5 danger zone ({acwr:.2f})")
            elif acwr > 1.3:
                risk_score += 0.15
                factors.append(f"ACWR rising 1.3-1.5 ({acwr:.2f})")
            elif acwr < 0.6:
                risk_score += 0.15
                factors.append(f"Under-prepared ACWR < 0.6 ({acwr:.2f})")
            elif acwr < 0.8:
                risk_score += 0.1
                factors.append(f"Under-prepared ACWR < 0.8 ({acwr:.2f})")

        # ---- Wellbeing data (readiness + sleep) ----
        wellbeing = await self._get_recent_wellbeing(athlete_id, days=3)

        if wellbeing:
            # Wellbeing trend component (0-0.2)
            readiness_scores = []
            for row in wellbeing:
                try:
                    readiness_scores.append(_calculate_readiness(row))
                except (KeyError, TypeError):
                    # Skip rows missing required fields
                    continue

            if readiness_scores:
                avg_readiness = sum(readiness_scores) / len(readiness_scores)
                if avg_readiness < 4:
                    risk_score += 0.2
                    factors.append(
                        f"Poor readiness 3-day avg < 4 ({avg_readiness:.1f})"
                    )
                elif avg_readiness < 6:
                    risk_score += 0.1
                    factors.append("Below-average readiness")

            # Sleep component (0-0.2)
            sleep_scores = [
                float(row["sleep_quality"])
                for row in wellbeing
                if row.get("sleep_quality") is not None
            ]
            if sleep_scores:
                avg_sleep = sum(sleep_scores) / len(sleep_scores)
                if avg_sleep < 4:
                    risk_score += 0.2
                    factors.append(
                        f"Poor sleep quality ({avg_sleep:.1f})"
                    )

        # Cap and classify
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
            "acwr": round(acwr, 3),
        }

    async def _get_recent_wellbeing(
        self, athlete_id: str, days: int = 3
    ) -> List[Dict]:
        """Fetch recent wellbeing assessments for an athlete.

        Uses athlete_id directly since the wellbeing_assessments table is
        keyed by athlete_id (per fresh_clean_schema.sql).

        Args:
            athlete_id: Athlete UUID.
            days: Number of recent days to query.

        Returns:
            List of wellbeing assessment dicts, newest first.
        """
        from_date = (date.today() - timedelta(days=days)).isoformat()
        # get_range returns ascending; reverse for newest-first
        rows = self.wellbeing_repo.get_range(athlete_id, from_date)
        return list(reversed(rows))
