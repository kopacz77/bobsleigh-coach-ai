from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.db.session import Base


class Athlete(Base):
    """Database model for athletes"""

    __tablename__ = "athletes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    sport = Column(String, nullable=False)
    height = Column(Float)  # in cm
    weight = Column(Float)  # in kg
    birth_date = Column(Date)

    # Relationships
    user = relationship("User", back_populates="athlete")
    workouts = relationship("Workout", back_populates="athlete")
    performance_metrics = relationship("PerformanceMetric", back_populates="athlete")
