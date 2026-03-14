"""
Database initialization and session handling for SQLite.
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker, scoped_session

# Default to app.db in the backend directory; override with DATABASE_URL env var
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "app.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

# New columns to add to session_summaries (for migrations from older schema)
SESSION_SUMMARY_MIGRATIONS = [
    ("min_bpm", "REAL"),
    ("duration_minutes", "REAL"),
    ("reading_count", "INTEGER"),
    ("abnormal_count", "INTEGER"),
    ("journal_count", "INTEGER"),
    ("intervention_count", "INTEGER"),
]


def init_db():
    """Create all tables. Safe to call on startup."""
    import models  # noqa: F401
    models.Base.metadata.create_all(bind=engine)
    _migrate_session_summaries()


def _migrate_session_summaries():
    """Add new columns to session_summaries if they don't exist (for existing DBs)."""
    with engine.connect() as conn:
        # Check if table exists (fresh DB may not have it yet)
        result = conn.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='session_summaries'"
        ))
        if not result.fetchone():
            return
        for col_name, col_type in SESSION_SUMMARY_MIGRATIONS:
            try:
                conn.execute(text(
                    f"ALTER TABLE session_summaries ADD COLUMN {col_name} {col_type}"
                ))
                conn.commit()
            except OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    pass  # Column already exists
                else:
                    raise


def get_session():
    """Return a new session. Caller should close or use as context."""
    return SessionLocal()


def close_session():
    """Remove the thread-local session."""
    SessionLocal.remove()
