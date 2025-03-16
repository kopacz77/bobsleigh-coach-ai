from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date, Text, JSON
from sqlalchemy.orm import relationship

from app.db.session import Base


class PerformanceMetric(Base):
    """Database model for athlete performance metrics"""

    __tablename__ = "performance_metrics"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    metric_type = Column(String, nullable=False)  # Strength, Speed, Power, etc.
    metric_name = Column(String, nullable=False)  # Squat 1RM, 30m Sprint, etc.
    value = Column(Float, nullable=False)
    unit = Column(String)  # kg, seconds, cm, etc.
    notes = Column(Text)

    # Relationships
    athlete = relationship("Athlete", back_populates="performance_metrics")


class TrainingLoad(Base):
    """Database model for athlete training load data"""

    __tablename__ = "training_loads"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    training_load = Column(Float, nullable=False)  # Daily training load value
    ctl = Column(Float)  # Chronic Training Load (fitness)
    atl = Column(Float)  # Acute Training Load (fatigue)
    tsb = Column(Float)  # Training Stress Balance (form)
    rpe = Column(Float)  # Rate of Perceived Exertion (0-10)
    fatigue = Column(Float)  # Fatigue score (0-10)
    soreness = Column(Float)  # Muscle soreness score (0-10)
    sleep_quality = Column(Float)  # Sleep quality score (0-10)
    sleep_hours = Column(Float)  # Hours of sleep
    notes = Column(Text)

    # Relationships
    athlete = relationship("Athlete", backref="training_loads")


class TrainingRecommendation(Base):
    """Database model for AI-generated training recommendations"""

    __tablename__ = "training_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    recommendation_date = Column(Date, nullable=False)  # Date when the recommendation should be performed
    workout_type = Column(String, nullable=False)  # Strength, Speed, Endurance, etc.
    focus = Column(String, nullable=False)  # Focus area of the workout
    duration = Column(Integer)  # Recommended duration in minutes
    intensity = Column(String)  # Low, Medium, High
    exercises = Column(JSON)  # JSON array of recommended exercises
    notes = Column(Text)  # Generated notes/explanation
    is_completed = Column(Integer, default=0)  # 0=Not done, 1=Done, 2=Modified

    # Relationships
    athlete = relationship("Athlete", backref="training_recommendations")
