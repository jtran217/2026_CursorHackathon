"""
Optional script to populate sample heart rate and journal data for testing.
Run from the backend directory with the Flask app not running (or using a separate DB),
or run after the app has created the DB: python sample_data.py
"""
import db
import models
from datetime import datetime, timedelta

def main():
    db.init_db()
    session = db.get_session()
    try:
        session_id = "sample-session-1"
        now = datetime.utcnow()

        # Sample heart rate readings (some normal, some abnormal)
        for i, bpm in enumerate([72, 78, 85, 92, 125, 118, 95, 88]):
            ts = now - timedelta(minutes=len([72, 78, 85, 92, 125, 118, 95, 88]) - i)
            reading = models.HeartRateReading(
                session_id=session_id,
                bpm=bpm,
                timestamp=ts,
                is_abnormal=(bpm >= 120 or bpm <= 40),
            )
            session.add(reading)

        # Sample journal entry (overwhelming trigger)
        session.add(
            models.JournalEntry(
                session_id=session_id,
                source="overwhelming_trigger",
                text="Heart rate spiked during the meeting. Felt overwhelmed.",
                timestamp=now - timedelta(minutes=5),
                activity="video call",
                intensity=4,
                coping_notes="Took a breath and muted for a minute.",
            )
        )
        # Sample journal entry (session ended)
        session.add(
            models.JournalEntry(
                session_id=session_id,
                source="session_ended",
                text="Session ended. Feeling better after stepping away.",
                timestamp=now,
                activity="desk work",
                intensity=2,
            )
        )

        # Session summary
        bpms = [72, 78, 85, 92, 125, 118, 95, 88]
        first_ts = now - timedelta(minutes=8)
        abnormal_count = sum(1 for b in bpms if b >= 120 or b <= 40)
        session.add(
            models.SessionSummary(
                session_id=session_id,
                average_bpm=round(sum(bpms) / len(bpms), 1),
                peak_strain=float(max(bpms)),
                min_bpm=float(min(bpms)),
                intervention=True,
                start_time=first_ts,
                end_time=now,
                duration_minutes=8.0,
                reading_count=len(bpms),
                abnormal_count=abnormal_count,
                journal_count=2,
                intervention_count=1,
            )
        )

        session.commit()
        print(f"Sample data added for session_id={session_id}")
        print("  - 8 heart rate readings (including 2 abnormal)")
        print("  - 2 journal entries (1 overwhelming_trigger, 1 session_ended)")
        print("  - 1 session summary")
        print("Try: GET /api/heart-rate/session/sample-session-1")
        print("     GET /api/journal/session/sample-session-1")
        print("     GET /api/session-summary/sample-session-1")
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()
        db.close_session()


if __name__ == "__main__":
    main()
