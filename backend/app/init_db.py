"""Initialize the database with some sample data.

This script creates the database tables and populates them with sample data.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import engine, Base, SessionLocal
from app.db.models import *
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """Initialize the database with tables and sample data."""
    try:
        # Create tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully.")

        # Create a session
        db = SessionLocal()

        # Check if there is already data in the database
        if db.query(User).first():
            logger.info("Database already contains data. Skipping initialization.")
            db.close()
            return

        # Create sample user
        logger.info("Creating sample user...")
        sample_user = User(
            id=1,
            email="test@example.com",
            hashed_password="$2b$12$1IrzArXzhB2hJ9xH1W9PY.6HnqDJKO0zhELr5Mlvx9v9o6DYAQi0O",  # 'password'
            full_name="Test User",
            is_active=True,
            is_superuser=False,
        )
        db.add(sample_user)
        db.flush()

        # Create sample athlete
        logger.info("Creating sample athlete...")
        sample_athlete = Athlete(
            id=1,
            user_id=sample_user.id,
            first_name="John",
            last_name="Doe",
            email="test@example.com",
            sport="Bobsleigh",
            height=185,
            weight=85,
            birth_date=datetime.strptime("1995-05-15", "%Y-%m-%d").date(),
        )
        db.add(sample_athlete)
        db.flush()

        # Create sample exercises if they don't exist
        logger.info("Creating sample exercises...")
        if db.query(Exercise).first() is None:
            exercises = [
                Exercise(id=1, name="Back Squat", description="Barbell squat with weight on upper back", category="Strength", measurement_type="Weight"),
                Exercise(id=2, name="Bench Press", description="Horizontal press with barbell", category="Strength", measurement_type="Weight"),
                Exercise(id=3, name="Deadlift", description="Barbell lift from floor", category="Strength", measurement_type="Weight"),
                Exercise(id=4, name="Power Clean", description="Olympic lift from floor to shoulders", category="Power", measurement_type="Weight"),
                Exercise(id=5, name="30m Sprint", description="30 meter sprint", category="Speed", measurement_type="Time"),
                Exercise(id=6, name="Box Jump", description="Jumping onto elevated platform", category="Power", measurement_type="Height"),
            ]
            for exercise in exercises:
                db.add(exercise)
            db.flush()

        # Create sample workouts
        logger.info("Creating sample workouts...")
        today = datetime.now().date()
        sample_workouts = [
            Workout(
                id=1,
                athlete_id=sample_athlete.id,
                name="Monday Strength",
                date=today - timedelta(days=2),
                duration=90,
                type="Strength",
                notes="Focus on explosiveness",
            ),
            Workout(
                id=2,
                athlete_id=sample_athlete.id,
                name="Wednesday Sprint",
                date=today - timedelta(days=4),
                duration=60,
                type="Sprint",
                notes="Track session",
            ),
        ]
        for workout in sample_workouts:
            db.add(workout)
        db.flush()

        # Create sample workout exercises
        logger.info("Creating sample workout exercises...")
        sample_workout_exercises = [
            WorkoutExercise(
                id=1,
                workout_id=1,
                exercise_id=1,
                sets=4,
                reps=6,
                weight=120,
                notes="Felt strong",
            ),
            WorkoutExercise(
                id=2,
                workout_id=1,
                exercise_id=2,
                sets=3,
                reps=8,
                weight=100,
                notes="Increased weight",
            ),
            WorkoutExercise(
                id=3,
                workout_id=2,
                exercise_id=5,
                sets=6,
                distance=30,
                time=4.2,
                notes="Good acceleration",
            ),
        ]
        for workout_exercise in sample_workout_exercises:
            db.add(workout_exercise)

        # Create sample performance metrics
        logger.info("Creating sample performance metrics...")
        sample_metrics = [
            PerformanceMetric(
                athlete_id=sample_athlete.id,
                date=today - timedelta(days=7),
                metric_type="Strength",
                metric_name="Squat 1RM",
                value=140,
                unit="kg",
            ),
            PerformanceMetric(
                athlete_id=sample_athlete.id,
                date=today,
                metric_type="Strength",
                metric_name="Squat 1RM",
                value=150,
                unit="kg",
            ),
            PerformanceMetric(
                athlete_id=sample_athlete.id,
                date=today - timedelta(days=7),
                metric_type="Speed",
                metric_name="30m Sprint",
                value=4.3,
                unit="sec",
            ),
            PerformanceMetric(
                athlete_id=sample_athlete.id,
                date=today,
                metric_type="Speed",
                metric_name="30m Sprint",
                value=4.1,
                unit="sec",
            ),
        ]
        for metric in sample_metrics:
            db.add(metric)

        # Create sample training load data (last 30 days)
        logger.info("Creating sample training load data...")
        for i in range(30):
            date = today - timedelta(days=i)
            # Create a weekly pattern with rest days
            if date.weekday() == 6:  # Sunday
                load = 0  # Rest day
            elif date.weekday() == 3:  # Wednesday
                load = 40  # Light day
            else:
                # Normal training day (with some variation)
                base_load = 80
                variation = (i % 5) * 10  # Some variation in load
                load = base_load + variation

            training_load = TrainingLoad(
                athlete_id=sample_athlete.id,
                date=date,
                training_load=load,
                rpe=load / 20,  # Scale to 0-10
                fatigue=min(10, load / 15),  # Scale to 0-10
                soreness=min(10, load / 18),  # Scale to 0-10
                sleep_quality=7,  # Default value
                sleep_hours=7.5,  # Default value
            )
            db.add(training_load)

        # Create sample training recommendations
        logger.info("Creating sample training recommendations...")
        sample_recommendations = [
            TrainingRecommendation(
                athlete_id=sample_athlete.id,
                date=today,
                recommendation_date=today + timedelta(days=1),
                workout_type="Strength",
                focus="Lower body power",
                duration=75,
                intensity="High",
                exercises=[
                    {"name": "Back Squat", "sets": 5, "reps": 5, "weight": 130},
                    {"name": "Split Squat", "sets": 3, "reps": 6, "weight": 80},
                    {"name": "Box Jumps", "sets": 4, "reps": 8, "height": 30},
                ],
                notes="Focus on explosive power and proper form.",
                is_completed=0,
            ),
            TrainingRecommendation(
                athlete_id=sample_athlete.id,
                date=today,
                recommendation_date=today + timedelta(days=3),
                workout_type="Sprint",
                focus="Acceleration",
                duration=60,
                intensity="Medium-High",
                exercises=[
                    {"name": "Resisted Sprints", "sets": 6, "distance": 20, "rest": 90},
                    {"name": "Flying Sprints", "sets": 5, "distance": 30, "rest": 120},
                    {"name": "Hill Sprints", "sets": 4, "duration": 12, "rest": 180},
                ],
                notes="Focus on quick acceleration and maintaining form throughout.",
                is_completed=0,
            ),
        ]
        for recommendation in sample_recommendations:
            db.add(recommendation)

        # Commit all changes
        db.commit()
        logger.info("Sample data created successfully.")

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialization complete.")
