"""
SQLAlchemy models for heart rate readings, journal entries, and session summaries.
"""
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class HeartRateReading(Base):
    __tablename__ = "heart_rate_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    bpm = Column(Integer, nullable=False)
    session_id = Column(String(64), nullable=False, index=True)
    is_abnormal = Column(Boolean, nullable=False, default=False)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    source = Column(String(32), nullable=False)  # "overwhelming_trigger" | "session_ended"
    text = Column(Text, nullable=False)
    activity = Column(String(512), nullable=True)
    intensity = Column(Integer, nullable=True)
    coping_notes = Column(Text, nullable=True)
    reminder_requested = Column(Boolean, nullable=True)
    reminder_at = Column(DateTime, nullable=True)


class SessionSummary(Base):
    __tablename__ = "session_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), nullable=False, unique=True, index=True)
    average_bpm = Column(Float, nullable=True)
    peak_strain = Column(Float, nullable=True)  # max bpm in session
    min_bpm = Column(Float, nullable=True)
    intervention = Column(Boolean, nullable=False, default=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    reading_count = Column(Integer, nullable=True)
    abnormal_count = Column(Integer, nullable=True)
    journal_count = Column(Integer, nullable=True)
    intervention_count = Column(Integer, nullable=True)  # count of overwhelming_trigger journal entries
