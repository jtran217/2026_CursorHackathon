"""
Flask app for heart rate and journal API.
"""
import os
import statistics
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

import db
import llm_service
import models

# Fallback thresholds when session has fewer than 2 readings (can't compute std)
FALLBACK_ABNORMAL_MIN_BPM = 120
FALLBACK_ABNORMAL_MAX_BPM = 40

JOURNAL_SOURCES = ("overwhelming_trigger", "session_ended")

# In-memory active session (app registers, controller fetches)
_active_session_id = None

# File for controller to read (avoids HTTP polling)
def _active_session_file():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), ".active-session")


def create_app():
    app = Flask(__name__)
    CORS(app)

    db.init_db()

    @app.teardown_appcontext
    def teardown(exception=None):
        db.close_session()

    def is_abnormal_reading(bpm, existing_bpms):
        """Abnormal if bpm is >= mean+1*std (elevated) or <= mean-1*std (low).
        Uses fixed fallback thresholds when fewer than 2 prior readings exist."""
        if len(existing_bpms) < 2:
            return bpm >= FALLBACK_ABNORMAL_MIN_BPM or bpm <= FALLBACK_ABNORMAL_MAX_BPM
        mean_bpm = statistics.mean(existing_bpms)
        std_bpm = statistics.stdev(existing_bpms)
        high_threshold = mean_bpm + std_bpm
        low_threshold = mean_bpm - std_bpm
        return bpm >= high_threshold or bpm <= low_threshold

    def serialize_heart_rate(reading):
        ts = reading.timestamp.isoformat() + "Z" if reading.timestamp else None
        return {
            "id": reading.id,
            "timestamp": ts,
            "bpm": reading.bpm,
            "session_id": reading.session_id,
            "is_abnormal": reading.is_abnormal,
        }

    def serialize_journal(entry):
        return {
            "id": entry.id,
            "session_id": entry.session_id,
            "timestamp": entry.timestamp.isoformat() if entry.timestamp else None,
            "source": entry.source,
            "text": entry.text,
            "activity": entry.activity,
            "intensity": entry.intensity,
            "coping_notes": entry.coping_notes,
            "reminder_requested": entry.reminder_requested,
            "reminder_at": entry.reminder_at.isoformat() if entry.reminder_at else None,
        }

    def serialize_session_summary(summ):
        return {
            "id": summ.id,
            "session_id": summ.session_id,
            "average_bpm": summ.average_bpm,
            "peak_strain": summ.peak_strain,
            "min_bpm": summ.min_bpm,
            "intervention": summ.intervention,
            "start_time": summ.start_time.isoformat() if summ.start_time else None,
            "end_time": summ.end_time.isoformat() if summ.end_time else None,
            "duration_minutes": summ.duration_minutes,
            "reading_count": summ.reading_count,
            "abnormal_count": summ.abnormal_count,
            "journal_count": summ.journal_count,
            "intervention_count": summ.intervention_count,
        }

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.route("/api/llm/status")
    def get_llm_status():
        return jsonify({"ready": llm_service.is_ready()}), 200

    @app.route("/api/llm/ensure-ready", methods=["POST"])
    def post_llm_ensure_ready():
        try:
            llm_service.ensure_ready()
            return jsonify({"ready": True}), 200
        except Exception as e:
            return jsonify({"error": str(e), "ready": False}), 503

    @app.route("/api/llm/ground", methods=["POST"])
    def post_llm_ground():
        data = request.get_json(silent=True)
        if data is None or not isinstance(data, dict):
            return jsonify({"error": "Request body must be valid JSON"}), 400
        emotion = data.get("emotion")
        detail = data.get("detail")
        if emotion is None:
            return jsonify({"error": "emotion is required"}), 400
        if not isinstance(emotion, str) or emotion.strip() == "":
            return jsonify({"error": "emotion must be a non-empty string"}), 400
        emotion = emotion.strip().lower()
        if emotion not in llm_service.VALID_EMOTIONS:
            return jsonify({"error": "emotion must be one of: anxious, distracted, overwhelmed, frustrated, exhausted, other"}), 400
        if detail is not None and not isinstance(detail, str):
            return jsonify({"error": "detail must be a string or null"}), 400
        try:
            result = llm_service.get_grounding_suggestions(emotion, detail.strip() if detail else None)
            return jsonify(result), 200
        except Exception:
            fallback = llm_service._fallback_grounding(emotion)
            return jsonify(fallback), 200

    @app.route("/api/llm/refocus", methods=["POST"])
    def post_llm_refocus():
        data = request.get_json(silent=True)
        if data is None or not isinstance(data, dict):
            return jsonify({"error": "Request body must be valid JSON"}), 400
        emotion = data.get("emotion")
        detail = data.get("detail")
        if emotion is None:
            return jsonify({"error": "emotion is required"}), 400
        if not isinstance(emotion, str) or emotion.strip() == "":
            return jsonify({"error": "emotion must be a non-empty string"}), 400
        emotion = emotion.strip().lower()
        if emotion not in llm_service.VALID_EMOTIONS:
            return jsonify({"error": "emotion must be one of: anxious, distracted, overwhelmed, frustrated, exhausted, other"}), 400
        if detail is not None and not isinstance(detail, str):
            return jsonify({"error": "detail must be a string or null"}), 400
        try:
            result = llm_service.get_refocus_suggestions(emotion, detail.strip() if detail else None)
            return jsonify(result), 200
        except Exception:
            fallback = llm_service._fallback_refocus(emotion)
            return jsonify(fallback), 200

    @app.route("/api/active-session", methods=["GET"])
    def get_active_session():
        global _active_session_id
        if _active_session_id is None:
            return jsonify({"error": "No active session"}), 404
        return jsonify({"session_id": _active_session_id})

    @app.route("/api/active-session", methods=["POST"])
    def set_active_session():
        global _active_session_id
        data = request.get_json(silent=True)
        if data is None or not isinstance(data, dict):
            return jsonify({"error": "Request body must be valid JSON"}), 400
        session_id = data.get("session_id")
        if session_id is None or not isinstance(session_id, str) or session_id.strip() == "":
            return jsonify({"error": "session_id is required and must be a non-empty string"}), 400
        _active_session_id = session_id.strip()
        try:
            with open(_active_session_file(), "w") as f:
                f.write(_active_session_id)
        except OSError:
            pass
        return jsonify({"session_id": _active_session_id}), 200

    @app.route("/api/active-session", methods=["DELETE"])
    def clear_active_session():
        global _active_session_id
        _active_session_id = None
        try:
            p = _active_session_file()
            if os.path.exists(p):
                os.remove(p)
        except OSError:
            pass
        return jsonify({"status": "cleared"}), 200

    # ---- Heart rate ----
    @app.route("/api/heart-rate", methods=["POST"])
    def post_heart_rate():
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400

        session_id = data.get("session_id")
        bpm_raw = data.get("bpm")
        ts = data.get("timestamp")

        if session_id is None:
            return jsonify({"error": "session_id is required"}), 400
        if not isinstance(session_id, str):
            return jsonify({"error": "session_id must be a string"}), 400
        if session_id.strip() == "":
            return jsonify({"error": "session_id must not be empty"}), 400
        session_id = session_id.strip()

        if bpm_raw is None:
            return jsonify({"error": "bpm is required"}), 400
        if not isinstance(bpm_raw, int):
            return jsonify({"error": "bpm must be an integer"}), 400
        bpm = bpm_raw
        if bpm < 0 or bpm > 300:
            return jsonify({"error": "bpm must be between 0 and 300"}), 400

        if ts is not None and not isinstance(ts, str):
            return jsonify({"error": "timestamp must be a string (ISO format) or omitted"}), 400

        timestamp = datetime.utcnow()
        if ts:
            try:
                timestamp = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if timestamp.tzinfo:
                    timestamp = (timestamp - timestamp.utcoffset()).replace(tzinfo=None)
            except (ValueError, TypeError):
                pass

        session = db.get_session()
        try:
            existing = (
                session.query(models.HeartRateReading)
                .filter(models.HeartRateReading.session_id == session_id)
                .all()
            )
            existing_bpms = [r.bpm for r in existing]
            reading = models.HeartRateReading(
                session_id=session_id,
                bpm=bpm,
                timestamp=timestamp,
                is_abnormal=is_abnormal_reading(bpm, existing_bpms),
            )
            session.add(reading)
            session.commit()
            session.refresh(reading)
            return jsonify(serialize_heart_rate(reading)), 201
        except Exception:
            session.rollback()
            return jsonify({"error": "Database error"}), 500
        finally:
            session.close()

    @app.route("/api/heart-rate/session/<session_id>")
    def get_heart_rate_session(session_id):
        if not isinstance(session_id, str) or session_id.strip() == "":
            return jsonify({"error": "session_id must be a non-empty string"}), 400
        session_id = session_id.strip()
        session = db.get_session()
        try:
            readings = (
                session.query(models.HeartRateReading)
                .filter(models.HeartRateReading.session_id == session_id)
                .order_by(models.HeartRateReading.timestamp)
                .all()
            )
            if not readings:
                return jsonify({
                    "readings": [],
                    "summary": {
                        "count": 0,
                        "min_bpm": None,
                        "max_bpm": None,
                        "avg_bpm": None,
                        "abnormal_count": 0,
                    },
                })

            bpms = [r.bpm for r in readings]
            summary = {
                "count": len(readings),
                "min_bpm": min(bpms),
                "max_bpm": max(bpms),
                "avg_bpm": round(sum(bpms) / len(bpms), 1),
                "abnormal_count": sum(1 for r in readings if r.is_abnormal),
            }
            return jsonify(
                {"readings": [serialize_heart_rate(r) for r in readings], "summary": summary}
            )
        finally:
            session.close()

    @app.route("/api/heart-rate/active")
    def get_heart_rate_active():
        global _active_session_id
        if _active_session_id is None:
            return jsonify({"error": "No active session"}), 404
        session = db.get_session()
        try:
            reading = (
                session.query(models.HeartRateReading)
                .filter(models.HeartRateReading.session_id == _active_session_id)
                .order_by(models.HeartRateReading.timestamp.desc())
                .first()
            )
            if not reading:
                return jsonify({"error": "No readings found for active session"}), 404
            return jsonify(serialize_heart_rate(reading))
        finally:
            session.close()

    @app.route("/api/heart-rate/live")
    def get_heart_rate_live():
        session = db.get_session()
        try:
            reading = (
                session.query(models.HeartRateReading)
                .order_by(models.HeartRateReading.timestamp.desc())
                .first()
            )
            if not reading:
                return jsonify({"error": "No heart rate readings"}), 404
            return jsonify(serialize_heart_rate(reading))
        finally:
            session.close()

    @app.route("/api/heart-rate/latest")
    def get_heart_rate_latest():
        session_id = request.args.get("session_id")
        if session_id is None:
            return jsonify({"error": "session_id query parameter is required"}), 400
        if not isinstance(session_id, str):
            return jsonify({"error": "session_id must be a string"}), 400
        if session_id.strip() == "":
            return jsonify({"error": "session_id must not be empty"}), 400
        session_id = session_id.strip()
        session = db.get_session()
        try:
            reading = (
                session.query(models.HeartRateReading)
                .filter(models.HeartRateReading.session_id == session_id)
                .order_by(models.HeartRateReading.timestamp.desc())
                .first()
            )
            if not reading:
                return jsonify({"error": "No readings found for session"}), 404
            return jsonify(serialize_heart_rate(reading))
        finally:
            session.close()

    # ---- Journal ----
    @app.route("/api/journal", methods=["POST"])
    def post_journal():
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400

        session_id = data.get("session_id")
        source = data.get("source")
        text = data.get("text")
        ts = data.get("timestamp")
        activity = data.get("activity")
        intensity = data.get("intensity")
        coping_notes = data.get("coping_notes")
        reminder_requested = data.get("reminder_requested")
        reminder_at = data.get("reminder_at")

        if session_id is None:
            return jsonify({"error": "session_id is required"}), 400
        if not isinstance(session_id, str):
            return jsonify({"error": "session_id must be a string"}), 400
        if session_id.strip() == "":
            return jsonify({"error": "session_id must not be empty"}), 400
        session_id = session_id.strip()

        if source is None:
            return jsonify({"error": "source is required"}), 400
        if not isinstance(source, str):
            return jsonify({"error": "source must be a string"}), 400
        if source not in JOURNAL_SOURCES:
            return jsonify(
                {"error": f"source must be one of: {', '.join(JOURNAL_SOURCES)}"}
            ), 400

        if text is None:
            return jsonify({"error": "text is required"}), 400
        if not isinstance(text, str):
            return jsonify({"error": "text must be a string"}), 400

        if ts is not None and not isinstance(ts, str):
            return jsonify({"error": "timestamp must be a string (ISO format) or omitted"}), 400
        if activity is not None and not isinstance(activity, str):
            return jsonify({"error": "activity must be a string or omitted"}), 400
        if intensity is not None:
            if not isinstance(intensity, int):
                return jsonify({"error": "intensity must be an integer or omitted"}), 400
        if coping_notes is not None and not isinstance(coping_notes, str):
            return jsonify({"error": "coping_notes must be a string or omitted"}), 400
        if reminder_requested is not None and not isinstance(reminder_requested, bool):
            return jsonify({"error": "reminder_requested must be a boolean or omitted"}), 400
        if reminder_at is not None and not isinstance(reminder_at, str):
            return jsonify({"error": "reminder_at must be a string (ISO format) or omitted"}), 400

        timestamp = datetime.utcnow()
        if ts:
            try:
                timestamp = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                if timestamp.tzinfo:
                    timestamp = (timestamp - timestamp.utcoffset()).replace(tzinfo=None)
            except (ValueError, TypeError):
                pass

        if reminder_at:
            try:
                reminder_at = datetime.fromisoformat(
                    reminder_at.replace("Z", "+00:00")
                )
                if reminder_at.tzinfo:
                    reminder_at = (reminder_at - reminder_at.utcoffset()).replace(tzinfo=None)
            except (ValueError, TypeError):
                reminder_at = None

        session = db.get_session()
        try:
            entry = models.JournalEntry(
                session_id=session_id,
                source=source,
                text=text,
                timestamp=timestamp,
                activity=activity or None,
                intensity=intensity,
                coping_notes=coping_notes or None,
                reminder_requested=reminder_requested,
                reminder_at=reminder_at,
            )
            session.add(entry)
            session.commit()
            session.refresh(entry)
            return jsonify(serialize_journal(entry)), 201
        except Exception:
            session.rollback()
            return jsonify({"error": "Database error"}), 500
        finally:
            session.close()

    @app.route("/api/journal/session/<session_id>")
    def get_journal_session(session_id):
        if not isinstance(session_id, str) or session_id.strip() == "":
            return jsonify({"error": "session_id must be a non-empty string"}), 400
        session_id = session_id.strip()
        session = db.get_session()
        try:
            entries = (
                session.query(models.JournalEntry)
                .filter(models.JournalEntry.session_id == session_id)
                .order_by(models.JournalEntry.timestamp)
                .all()
            )
            return jsonify({"entries": [serialize_journal(e) for e in entries]})
        finally:
            session.close()

    # ---- Session summary ----
    @app.route("/api/session-summary", methods=["POST"])
    def post_session_summary():
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({"error": "Request body must be valid JSON"}), 400
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400
        session_id = data.get("session_id")
        if session_id is None:
            return jsonify({"error": "session_id is required"}), 400
        if not isinstance(session_id, str):
            return jsonify({"error": "session_id must be a string"}), 400
        if session_id.strip() == "":
            return jsonify({"error": "session_id must not be empty"}), 400
        session_id = session_id.strip()

        session = db.get_session()
        try:
            readings = (
                session.query(models.HeartRateReading)
                .filter(models.HeartRateReading.session_id == session_id)
                .all()
            )
            journal_entries = (
                session.query(models.JournalEntry)
                .filter(models.JournalEntry.session_id == session_id)
                .all()
            )

            average_bpm = None
            peak_strain = None
            min_bpm = None
            start_time = None
            end_time = None
            duration_minutes = None
            reading_count = len(readings)
            abnormal_count = sum(1 for r in readings if r.is_abnormal)
            journal_count = len(journal_entries)
            intervention_count = sum(1 for e in journal_entries if e.source == "overwhelming_trigger")

            if readings:
                bpms = [r.bpm for r in readings]
                average_bpm = round(sum(bpms) / len(bpms), 1)
                peak_strain = float(max(bpms))
                min_bpm = float(min(bpms))
                timestamps = [r.timestamp for r in readings if r.timestamp]
                if timestamps:
                    start_time = min(timestamps)
                    end_time = max(timestamps)

            if not start_time or not end_time:
                journal_timestamps = [e.timestamp for e in journal_entries if e.timestamp]
                if journal_timestamps:
                    if not start_time:
                        start_time = min(journal_timestamps)
                    if not end_time:
                        end_time = max(journal_timestamps)

            if start_time and end_time:
                delta = end_time - start_time
                duration_minutes = round(delta.total_seconds() / 60, 1)

            intervention = any(
                e.source == "overwhelming_trigger" for e in journal_entries
            )

            existing = (
                session.query(models.SessionSummary)
                .filter(models.SessionSummary.session_id == session_id)
                .first()
            )
            if existing:
                existing.average_bpm = average_bpm
                existing.peak_strain = peak_strain
                existing.min_bpm = min_bpm
                existing.intervention = intervention
                existing.start_time = start_time
                existing.end_time = end_time
                existing.duration_minutes = duration_minutes
                existing.reading_count = reading_count
                existing.abnormal_count = abnormal_count
                existing.journal_count = journal_count
                existing.intervention_count = intervention_count
                session.commit()
                session.refresh(existing)
                return jsonify(serialize_session_summary(existing)), 200
            else:
                summary = models.SessionSummary(
                    session_id=session_id,
                    average_bpm=average_bpm,
                    peak_strain=peak_strain,
                    min_bpm=min_bpm,
                    intervention=intervention,
                    start_time=start_time,
                    end_time=end_time,
                    duration_minutes=duration_minutes,
                    reading_count=reading_count,
                    abnormal_count=abnormal_count,
                    journal_count=journal_count,
                    intervention_count=intervention_count,
                )
                session.add(summary)
                session.commit()
                session.refresh(summary)
                return jsonify(serialize_session_summary(summary)), 201
        except Exception:
            session.rollback()
            return jsonify({"error": "Database error"}), 500
        finally:
            session.close()

    @app.route("/api/session-summary/<session_id>")
    def get_session_summary(session_id):
        if not isinstance(session_id, str) or session_id.strip() == "":
            return jsonify({"error": "session_id must be a non-empty string"}), 400
        session_id = session_id.strip()
        session = db.get_session()
        try:
            summary = (
                session.query(models.SessionSummary)
                .filter(models.SessionSummary.session_id == session_id)
                .first()
            )
            if not summary:
                return jsonify({"error": "Session summary not found"}), 404
            return jsonify(serialize_session_summary(summary))
        finally:
            session.close()

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 5001))
    is_frozen = getattr(__import__('sys'), 'frozen', False)
    app.run(host='127.0.0.1', port=port, debug=not is_frozen, use_reloader=not is_frozen)
