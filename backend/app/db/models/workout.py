from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text
from sqlalchemy.orm import relationship

from app.db.session import Base


class Exercise(Base):
    """Database model for exercises"""

    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    category = Column(String)  # Strength, Speed, Endurance, etc.
    measurement_type = Column(String)  # Weight, Distance, Time, etc.

    # Relationships
    workout_exercises = relationship("WorkoutExercise", back_populates="exercise")


class Workout(Base):
    """Database model for workouts"""

    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False, index=True)
    duration = Column(Integer)  # in minutes
    type = Column(String, nullable=False)  # Strength, Speed, Endurance, etc.
    notes = Column(Text)

    # Relationships
    athlete = relationship("Athlete", back_populates="workouts")
    exercises = relationship("WorkoutExercise", back_populates="workout")


class WorkoutExercise(Base):
    """Database model for exercises in a workout"""

    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    sets = Column(Integer)
    reps = Column(Integer)
    weight = Column(Float)  # in kg
    distance = Column(Float)  # in meters
    time = Column(Float)  # in seconds
    notes = Column(Text)

    # Relationships
    workout = relationship("Workout", back_populates="exercises")
    exercise = relationship("Exercise", back_populates="workout_exercises")
    sets_data = relationship("WorkoutExerciseSet", back_populates="workout_exercise")


class WorkoutExerciseSet(Base):
    """Database model for individual sets in a workout exercise"""

    __tablename__ = "workout_exercise_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_exercise_id = Column(
        Integer, ForeignKey("workout_exercises.id"), nullable=False
    )
    set_number = Column(Integer, nullable=False)
    reps = Column(Integer)
    weight = Column(Float)  # in kg
    distance = Column(Float)  # in meters
    time = Column(Float)  # in seconds
    notes = Column(Text)

    # Relationships
    workout_exercise = relationship(
        "WorkoutExercise", back_populates="sets_data"
    )
