# Heart Rate Controller

Standalone testing UI for simulating heart rate data and sending it to the Flask backend. Fully separate from the backend — no Python, no shared code. Pure HTML + vanilla JavaScript.

## Controls

| Control | Behavior |
|---------|----------|
| **Current BPM** | Large readout, updates in real time |
| **Start / Stop** | Toggle; when started, sends heart rate every 1 second (session ID auto-generated) |
| **+5 / −5** | Increase or decrease base BPM by 5 |
| **+10 / −10** | Increase or decrease base BPM by 10 |
| **Stress** | Checkbox; when checked, adds a +40–50 BPM spike (decays when unchecked) |

## How to run

Two independent processes. Run in any order:

1. **Backend** (optional; required to persist data):
   ```bash
   cd backend
   .venv\Scripts\activate   # Windows
   flask --app app run --debug
   ```
   Backend runs at `http://127.0.0.1:5000`.

2. **Controller** (standalone):
   - Serve the folder: `npx serve controller` and visit the URL (e.g. `http://localhost:3000`). Recommended to avoid CORS issues.
   - Or open `controller/index.html` directly (`file://`); some browsers may block requests to `http://` from `file://`.

3. Use Start, adjust BPM with +/- buttons, enable Stress for spikes, then Stop when done.

If the backend is not running, the controller UI still updates but requests will fail. A status message shows success or error.

## API

The controller sends `POST http://127.0.0.1:5000/api/heart-rate` with:

```json
{ "session_id": "...", "bpm": 72 }
```

CORS is enabled on the backend, so the controller can call the API from any origin.
