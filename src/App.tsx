import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./screens/Home";
import { FocusMode } from "./screens/FocusMode";
import { Intervention } from "./screens/Intervention";
import { SessionSummary } from "./screens/SessionSummary";
import { Journal } from "./screens/Journal";
import { FirstTimeSetup, isSetupDone } from "./screens/FirstTimeSetup";
import { useSessionStore } from "./store/sessionStore";
import { useHeartRateStore } from "./store/heartRateStore";

// MOVE THIS TO A LIB or UTIL
function TrayImOverwhelmedHandler() {
  const navigate = useNavigate();
  const { startSession, triggerIntervention } = useSessionStore();

  useEffect(() => {
    const handler = () => {
      startSession();
      triggerIntervention();
      navigate("/intervention");
    };
    window.ipcRenderer?.on("tray-im-overwhelmed", handler);
    return () => {
      window.ipcRenderer?.off("tray-im-overwhelmed", handler);
    };
  }, [navigate, startSession, triggerIntervention]);

  return null;
}

// MOVE THIS TO A LIB or UTIL
function TrayStartFocusHandler() {
  const navigate = useNavigate();
  const { startSession } = useSessionStore();

  useEffect(() => {
    const handler = () => {
      startSession();
      navigate("/focus");
    };
    window.ipcRenderer?.on("tray-start-focus-session", handler);
    return () => {
      window.ipcRenderer?.off("tray-start-focus-session", handler);
    };
  }, [navigate, startSession]);

  return null;
}

function TrayEndFocusHandler() {
  const navigate = useNavigate();
  const { endSession } = useSessionStore();
  const { currentHR, hrHistory, strainScore } = useHeartRateStore();

  useEffect(() => {
    const handler = () => {
      const avgHR =
        hrHistory.length > 0
          ? Math.round(
              hrHistory.reduce((s, p) => s + p.value, 0) / hrHistory.length,
            )
          : currentHR;
      const focusQuality = Math.max(0, Math.min(100, 100 - strainScore));
      endSession({ avgHR, peakStrain: strainScore, focusQuality });
      navigate("/summary");
    };
    window.ipcRenderer?.on("tray-end-focus-session", handler);
    return () => {
      window.ipcRenderer?.off("tray-end-focus-session", handler);
    };
  }, [navigate, endSession, currentHR, hrHistory, strainScore]);

  return null;
}

function TrayFocusSessionSync() {
  const currentSession = useSessionStore((s) => s.currentSession);
  const remainingMs = useSessionStore((s) => s.remainingMs);
  const active = currentSession != null;

  useEffect(() => {
    window.ipcRenderer?.send("tray-set-focus-session-active", active);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const sendRemaining = () => {
      window.ipcRenderer?.send("tray-set-session-elapsed-ms", remainingMs);
    };
    sendRemaining();
    const interval = setInterval(sendRemaining, 1000);
    return () => clearInterval(interval);
  }, [active, remainingMs]);

  return null;
}

function App() {
  const [setupComplete, setSetupComplete] = useState(isSetupDone);

  useEffect(() => {
    if (isSetupDone()) setSetupComplete(true);
  }, []);

  if (!setupComplete) {
    return (
      <FirstTimeSetup onDone={() => setSetupComplete(true)} />
    );
  }

  return (
    <HashRouter>
      <TrayImOverwhelmedHandler />
      <TrayStartFocusHandler />
      <TrayEndFocusHandler />
      <TrayFocusSessionSync />
      <Routes>
        {/* Screens with sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/journal" element={<Journal />} />
        </Route>

        {/* Full-screen screens (no sidebar) */}
        <Route path="/focus" element={<FocusMode />} />
        <Route path="/intervention" element={<Intervention />} />
        <Route path="/summary" element={<SessionSummary />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
