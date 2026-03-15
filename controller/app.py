"""
Heart Rate Controller — Python GUI.
Sends simulated heart rate data to the Flask backend.
"""
from typing import Optional

import json
import random
import time
import tkinter as tk
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

API_BASE = "http://127.0.0.1:5001"
API_URL = f"{API_BASE}/api/heart-rate"
ACTIVE_SESSION_URL = f"{API_BASE}/api/active-session"
BPM_MIN = 40
BPM_MAX = 180


def fetch_active_session() -> Optional[str]:
    for _ in range(4):
        try:
            req = Request(ACTIVE_SESSION_URL, method="GET")
            with urlopen(req, timeout=3) as res:
                if res.getcode() == 200:
                    data = json.loads(res.read().decode())
                    sid = data.get("session_id")
                    if sid:
                        return sid
        except Exception:
            pass
        if _ < 3:
            time.sleep(2)
    return None


def main():
    root = tk.Tk()
    root.title("Heart Rate Controller")
    root.resizable(False, False)

    # State
    after_id = None
    current_session_id = None
    base_bpm = 72
    trend = 0.0
    stress_spike = 0.0

    # Widgets
    title_label = tk.Label(root, text="Heart Rate Controller", font=("", 11))
    title_label.pack(pady=(12, 4))

    bpm_var = tk.StringVar(value="0")
    bpm_label = tk.Label(root, textvariable=bpm_var, font=("TkDefaultFont", 48))
    bpm_label.pack(pady=4)

    bpm_unit = tk.Label(root, text="BPM", font=("", 9))
    bpm_unit.pack(pady=(0, 12))

    btn_frame = tk.Frame(root)
    btn_frame.pack(pady=4)

    btn_start = tk.Button(btn_frame, text="Start", width=8, bg="#BA7517", fg="white")
    btn_minus = tk.Button(btn_frame, text="−5", width=4, state="disabled")
    btn_plus = tk.Button(btn_frame, text="+5", width=4, state="disabled")

    btn_start.pack(side=tk.LEFT, padx=2)
    btn_minus.pack(side=tk.LEFT, padx=2)
    btn_plus.pack(side=tk.LEFT, padx=2)

    btn_frame2 = tk.Frame(root)
    btn_frame2.pack(pady=4)

    btn_minus10 = tk.Button(btn_frame2, text="−10", width=8, state="disabled")
    btn_plus10 = tk.Button(btn_frame2, text="+10", width=8, state="disabled")

    btn_minus10.pack(side=tk.LEFT, padx=2)
    btn_plus10.pack(side=tk.LEFT, padx=2)

    stress_var = tk.BooleanVar(value=False)
    stress_cb = tk.Checkbutton(
        root,
        text="Stress (spike +40 BPM)",
        variable=stress_var,
    )
    stress_cb.pack(pady=8)

    status_var = tk.StringVar(value="")
    status_label = tk.Label(root, textvariable=status_var, font=("", 9), fg="gray")
    status_label.pack(pady=8)

    def set_status(msg: str, is_error: bool = False) -> None:
        status_var.set(msg)
        status_label.config(fg="#D85A30" if is_error else ("#639922" if msg else "gray"))

    def compute_bpm() -> int:
        nonlocal trend, stress_spike
        trend += (random.random() - 0.5) * 5
        trend = max(-12, min(12, trend))
        noise = (random.random() - 0.5) * 12
        bpm = base_bpm + trend * 0.5 + noise * 0.5

        if stress_var.get():
            stress_spike = min(50, stress_spike + 15)
            bpm += stress_spike
        else:
            stress_spike = max(0, stress_spike - 8)
            bpm += stress_spike

        return round(max(BPM_MIN, min(BPM_MAX, bpm)))

    def send_heart_rate(bpm: int) -> bool:
        try:
            data = json.dumps({"session_id": current_session_id, "bpm": bpm}).encode()
            req = Request(
                API_URL,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(req, timeout=5) as res:
                if res.getcode() == 201:
                    set_status("Sent", False)
                    return True
                body = res.read().decode()
                err = json.loads(body).get("error", res.reason) if body else res.reason
                set_status(f"Error: {err}", True)
                return False
        except HTTPError as e:
            try:
                err = json.loads(e.read().decode()).get("error", str(e))
            except Exception:
                err = str(e)
            set_status(f"Error: {err}", True)
            return False
        except URLError as e:
            set_status(f"Backend unreachable: {e.reason}", True)
            return False
        except Exception as e:
            set_status(f"Error: {e}", True)
            return False

    def tick() -> None:
        nonlocal after_id
        bpm = compute_bpm()
        bpm_var.set(str(bpm))
        send_heart_rate(bpm)
        after_id = root.after(1000, tick)

    def start() -> None:
        nonlocal after_id, current_session_id
        if after_id is not None:
            return
        current_session_id = fetch_active_session()
        if not current_session_id:
            current_session_id = f"test-session-{int(time.time() * 1000)}"
        btn_start.config(text="Stop", bg="#D85A30")
        btn_minus.config(state="normal")
        btn_plus.config(state="normal")
        btn_minus10.config(state="normal")
        btn_plus10.config(state="normal")
        set_status("Running…")
        tick()

    def stop() -> None:
        nonlocal after_id, current_session_id
        if after_id is None:
            return
        root.after_cancel(after_id)
        after_id = None
        current_session_id = None
        bpm_var.set("0")
        btn_start.config(text="Start", bg="#BA7517")
        btn_minus.config(state="disabled")
        btn_plus.config(state="disabled")
        btn_minus10.config(state="disabled")
        btn_plus10.config(state="disabled")
        set_status("")

    def toggle() -> None:
        if after_id is not None:
            stop()
        else:
            start()

    def on_plus5() -> None:
        nonlocal base_bpm
        base_bpm = min(BPM_MAX, base_bpm + 5)

    def on_minus5() -> None:
        nonlocal base_bpm
        base_bpm = max(BPM_MIN, base_bpm - 5)

    def on_plus10() -> None:
        nonlocal base_bpm
        base_bpm = min(BPM_MAX, base_bpm + 10)

    def on_minus10() -> None:
        nonlocal base_bpm
        base_bpm = max(BPM_MIN, base_bpm - 10)

    btn_start.config(command=toggle)
    btn_minus.config(command=on_minus5)
    btn_plus.config(command=on_plus5)
    btn_minus10.config(command=on_minus10)
    btn_plus10.config(command=on_plus10)

    root.mainloop()


if __name__ == "__main__":
    main()
