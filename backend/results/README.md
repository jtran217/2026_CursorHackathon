# Results

Tools for viewing heart rate data stored in the backend database.

## print_heart_rate.py

Prints heart rate readings to the terminal. Run from the **backend** directory:

```bash
cd backend
.\.venv\Scripts\Activate.ps1   # Windows; or source .venv/bin/activate
python results/print_heart_rate.py              # Most recent session
python results/print_heart_rate.py <session_id> # Specific session
```

Output includes session ID, summary (count, min/max/avg BPM, abnormal count), and a list of readings. Readings marked abnormal are flagged with `*`.
