# Restore

Restore is a desktop-first productivity and wellness assistant designed to help you work smarter when your brain feels overwhelmed. Rather than adding another task manager to your workflow, Restore watches for signs of cognitive overload — using simulated heart rate data and behavioral signals like app-switching patterns and session duration — and steps in at the right moment with short, low-friction interventions: breathing exercises, movement prompts, and guided refocus flows. The goal is simple: when you're mentally overloaded, you don't need more planning tools — you need timely support that helps you reset and get back into focused work.

## Run full stack

To start the frontend, backend, and heart-rate controller together:

```bash
npm install
npm run start:all
```

**First-time setup:**

- **Windows:** `cd backend` → `python -m venv .venv` → `.venv\Scripts\pip install -r requirements.txt`
- **macOS/Linux:** `cd backend` → `python3 -m venv .venv` → `.venv/bin/pip install -r requirements.txt`

The launcher uses `backend/.venv` automatically if present.

This launches the Vite dev server, Flask API (port 5000), and the controller GUI. See [controller/README.md](controller/README.md) for syncing the controller with the app.

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Built with Electron + React + Vite (frontend) and Flask + SQLite (backend), bundled into a single macOS app via PyInstaller.

---

## Prerequisites

- Node.js 18+
- Python 3.x with a virtual environment at `.venv/`
- Install Python dependencies:
  ```bash
  python -m venv .venv
  source .venv/bin/activate
  pip install -r backend/requirements.txt
  ```

---

## Development

Start the Vite dev server and Electron together. The backend (Flask) is spawned automatically by Electron on port 39762.

```bash
npm install
npm run dev
```

The backend must be able to run via `python app.py` from the `backend/` directory. Make sure your `.venv` is activated or `python` resolves to the correct interpreter.

---

## Production Build (macOS)

The full build compiles the Python backend into a standalone binary via PyInstaller, then packages everything into a macOS `.app` using electron-builder.

```bash
npm run build
```

This runs the following steps in order:

1. `npm run build:backend` — PyInstaller bundles `backend/app.py` into `backend-dist/restore-backend`
2. `tsc` — TypeScript compilation
3. `vite build` — builds the React frontend and Electron main/preload
4. `electron-builder` — packages everything into `release/`

Output files:
- `release/mac-arm64/Restore.app` — unpacked app (use for quick testing)
- `release/Restore-0.0.0-arm64.dmg` — DMG installer

---

## Running the Release on macOS

Because the app is unsigned, macOS Gatekeeper will block it. Strip the quarantine flag before opening:

```bash
xattr -cr release/mac-arm64/Restore.app
open release/mac-arm64/Restore.app
```

> The DMG (`release/Restore-0.0.0-arm64.dmg`) may fail to open on macOS Sequoia (15.x) with error -10673 due to Gatekeeper restrictions on unsigned DMGs. Use the `.app` directly from `release/mac-arm64/` instead.

To verify the backend started successfully:

```bash
curl http://localhost:39762/api/health
# Expected: {"status": "ok"}
```

---

## Quitting the App Safely

Always quit via the **tray icon** (menu bar) → **Quit**. This triggers the `before-quit` handler which cleanly stops the embedded Flask backend before Electron exits.

Avoid force-quitting (Cmd+Q on the window, or Activity Monitor force kill), as this can leave the backend process running and holding port 39762.

If port 39762 is stuck after an unclean exit:

```bash
lsof -ti :39762 | xargs kill -9
```

---

## Cleaning Build Artifacts

```bash
npm run clean
```

Removes `dist/`, `release/`, `backend-dist/`, and `build/` (PyInstaller work directory).

---

## Project Structure

```
├── backend/          # Flask API (heart rate, journal, session summary)
├── controller/       # Standalone Python GUI for simulating heart rate
├── chrome-extension/ # Browser tab tracking (sends events to Electron on port 9147)
├── electron/         # Electron main process and preload
├── src/              # React frontend
├── scripts/          # Build scripts (build-backend.sh)
└── public/           # Static assets (icons)
```

---

## Backend API

The Flask backend runs on `http://localhost:39762` and exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/heart-rate` | Submit a heart rate reading |
| GET | `/api/heart-rate/session/:id` | Get all readings for a session |
| GET | `/api/heart-rate/latest?session_id=` | Get latest reading for a session |
| POST | `/api/journal` | Submit a journal entry |
| GET | `/api/journal/session/:id` | Get all journal entries for a session |
| POST | `/api/session-summary` | Generate/update session summary |
| GET | `/api/session-summary/:id` | Get session summary |

SQLite database is stored at `~/Library/Application Support/Restore/app.db` when running the packaged app.
