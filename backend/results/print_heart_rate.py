"""
Print heart rate readings from the database to the terminal.
Usage:
  python results/print_heart_rate.py              # Show most recent session
  python results/print_heart_rate.py <session_id> # Show specific session

Run from the backend directory.
"""
import os
import sys

# Allow imports from parent (backend)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import db
import models


def main():
    db.init_db()
    session = db.get_session()

    try:
        if len(sys.argv) >= 2:
            session_id = sys.argv[1].strip()
        else:
            # Get most recent session (by latest reading timestamp)
            row = (
                session.query(models.HeartRateReading.session_id)
                .order_by(models.HeartRateReading.timestamp.desc())
                .first()
            )
            if not row:
                print("No heart rate data in database.")
                return
            session_id = row.session_id

        readings = (
            session.query(models.HeartRateReading)
            .filter(models.HeartRateReading.session_id == session_id)
            .order_by(models.HeartRateReading.timestamp)
            .all()
        )

        if not readings:
            print(f"No readings for session: {session_id}")
            return

        bpms = [r.bpm for r in readings]
        abnormal_count = sum(1 for r in readings if r.is_abnormal)

        print(f"\nSession: {session_id}")
        print("=" * 50)
        print(f"  Readings: {len(readings)}")
        print(f"  Min BPM: {min(bpms)}")
        print(f"  Max BPM: {max(bpms)}")
        print(f"  Avg BPM: {sum(bpms) / len(bpms):.1f}")
        print(f"  Abnormal: {abnormal_count}")
        print("-" * 50)
        for r in readings:
            ts = r.timestamp.strftime("%H:%M:%S") if r.timestamp else "?"
            flag = " *" if r.is_abnormal else ""
            print(f"  {ts}  {r.bpm:3} bpm{flag}")
        print("=" * 50)
    finally:
        session.close()
        db.close_session()


if __name__ == "__main__":
    main()
