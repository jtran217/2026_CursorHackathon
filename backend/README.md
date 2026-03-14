# Backend (Flask)

Heart rate and journal API for the Electron/Vite app. Data is stored in SQLite.

## Setup

1. Create a virtualenv (recommended):

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate   # macOS/Linux
   ```

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:

   ```bash
   flask --app app run --debug
   ```

   Server runs at `http://127.0.0.1:5000` by default.

---

## API Reference

Base URL: `http://127.0.0.1:5000` (use `http://127.0.0.1:5000` from the Electron renderer or Vite dev server to avoid CORS issues; CORS is enabled for the frontend).

### Health

- **GET /api/health**  
  Returns `{ "status": "ok" }`. Use for liveness/readiness checks.

### Heart rate

- **POST /api/heart-rate**  
  Create a heart rate reading.  
  **Body:** `{ "session_id": string, "bpm": number, "timestamp"?: string (ISO optional) }`  
  **Response:** `201` and the created reading (includes `id`, `timestamp`, `bpm`, `session_id`, `is_abnormal`).  
  `is_abnormal` is set when `bpm >= 120` or `bpm <= 40`.

- **GET /api/heart-rate/session/<session_id>**  
  List all readings for a session plus summary.  
  **Response:** `{ "readings": [...], "summary": { "count", "min_bpm", "max_bpm", "avg_bpm", "abnormal_count" } }`.

- **GET /api/heart-rate/latest?session_id=<session_id>**  
  Latest reading for the session. Returns `404` if none.

### Journal

- **POST /api/journal**  
  Create a journal entry (same schema for trigger and session-ended).  
  **Body:**  
  - Required: `session_id` (string), `source` (`"overwhelming_trigger"` | `"session_ended"`), `text` (string).  
  - Optional: `timestamp`, `activity`, `intensity` (int), `coping_notes`, `reminder_requested` (bool), `reminder_at` (ISO string).  
  **Response:** `201` and the created entry (all fields including optional).

- **GET /api/journal/session/<session_id>**  
  List all journal entries for a session, ordered by time.  
  **Response:** `{ "entries": [...] }`. Each entry includes `source` and all prompt fields.

### Session summary

- **POST /api/session-summary**  
  Create or update a session summary (computed from heart rate and journal data).  
  **Body:** `{ "session_id": string }`  
  **Response:** `200` or `201` and the summary with `average_bpm`, `peak_strain` (max bpm), `min_bpm`, `intervention` (true if any overwhelming_trigger journal), `intervention_count` (number of overwhelming_trigger journal entries), `start_time`, `end_time`, `duration_minutes`, `reading_count`, `abnormal_count`, `journal_count`.

- **GET /api/session-summary/<session_id>**  
  Get the summary for a session. Returns `404` if none exists.

---

## Frontend (Electron/Vite) integration

- Run the backend at `http://127.0.0.1:5000` when developing or packaging (e.g. start it from the Electron main process or document that the user must start it).
- **When to POST heart rate:** When the app receives a new heart rate sample (e.g. from a device or simulator), send `POST /api/heart-rate` with the current `session_id` and `bpm`. Optionally include `timestamp` in ISO format.
- **When to POST journal:**  
  - When the **overwhelming trigger** fires (stress/overwhelm detected), show the journal popup and on submit send `POST /api/journal` with `source: "overwhelming_trigger"` and the form fields (`text`, and optionally `activity`, `intensity`, `coping_notes`, `reminder_requested`, `reminder_at`).  
  - When the **user ends the session**, show the journal popup and on submit send `POST /api/journal` with `source: "session_ended"` and the same optional fields.
- Use the same `session_id` for a given monitoring session so that heart rate readings and journal entries can be correlated via `GET /api/heart-rate/session/<id>` and `GET /api/journal/session/<id>`.
- When a session ends, call `POST /api/session-summary` with the `session_id` to create or update the session summary (average bpm, peak strain, intervention flag, start/end time).

Example fetch from the renderer:

```js
// POST a heart rate reading
const res = await fetch('http://127.0.0.1:5000/api/heart-rate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ session_id: currentSessionId, bpm: 98 })
});

// POST a journal entry (e.g. when session ends)
const res = await fetch('http://127.0.0.1:5000/api/journal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: currentSessionId,
    source: 'session_ended',
    text: userJournalText,
    activity: userActivity,
    intensity: userIntensity
  })
});
```

---

## Example requests (curl / HTTPie)

**Health:**

```bash
curl http://127.0.0.1:5000/api/health
```

**Create heart rate reading:**

```bash
curl -X POST http://127.0.0.1:5000/api/heart-rate -H "Content-Type: application/json" -d "{\"session_id\":\"sess-1\",\"bpm\":95}"
```

**Create abnormal heart rate (e.g. 125 bpm):**

```bash
curl -X POST http://127.0.0.1:5000/api/heart-rate -H "Content-Type: application/json" -d "{\"session_id\":\"sess-1\",\"bpm\":125}"
```

**Get session heart rate and summary:**

```bash
curl http://127.0.0.1:5000/api/heart-rate/session/sess-1
```

**Get latest heart rate:**

```bash
curl "http://127.0.0.1:5000/api/heart-rate/latest?session_id=sess-1"
```

**Create journal entry (session ended):**

```bash
curl -X POST http://127.0.0.1:5000/api/journal -H "Content-Type: application/json" -d "{\"session_id\":\"sess-1\",\"source\":\"session_ended\",\"text\":\"Felt calm. Took a short walk.\",\"activity\":\"desk work\",\"intensity\":3}"
```

**Create journal entry (overwhelming trigger):**

```bash
curl -X POST http://127.0.0.1:5000/api/journal -H "Content-Type: application/json" -d "{\"session_id\":\"sess-1\",\"source\":\"overwhelming_trigger\",\"text\":\"Got stressed during the call.\",\"coping_notes\":\"Stepped away for 2 min\"}"
```

**Get journal entries for session:**

```bash
curl http://127.0.0.1:5000/api/journal/session/sess-1
```

**Create session summary:**

```bash
curl -X POST http://127.0.0.1:5000/api/session-summary -H "Content-Type: application/json" -d "{\"session_id\":\"sess-1\"}"
```

**Get session summary:**

```bash
curl http://127.0.0.1:5000/api/session-summary/sess-1
```

---

## Sample data (optional)

To load sample heart rate readings and journal entries for a test session:

```bash
cd backend
.venv\Scripts\activate   # or source .venv/bin/activate
python sample_data.py
```

This adds session `sample-session-1` with 8 heart rate readings (including 2 abnormal) and 2 journal entries. Then call `GET /api/heart-rate/session/sample-session-1` and `GET /api/journal/session/sample-session-1` (with the Flask app running).
