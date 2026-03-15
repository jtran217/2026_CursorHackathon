import { useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Home } from "./screens/Home";
import { FocusMode } from "./screens/FocusMode";
import { Intervention } from './screens/Intervention';
import { SessionSummary } from "./screens/SessionSummary";
import { Journal } from "./screens/Journal";
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
      navigate("/focus");
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
          ? Math.round(hrHistory.reduce((s, p) => s + p.value, 0) / hrHistory.length)
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
  const active = currentSession != null;

  useEffect(() => {
    window.ipcRenderer?.send("tray-set-focus-session-active", active);
  }, [active]);

  useEffect(() => {
    if (!active || !currentSession) return;
    const sendElapsed = () => {
      window.ipcRenderer?.send(
        "tray-set-session-elapsed-ms",
        Date.now() - currentSession.startTime
      );
    };
    sendElapsed();
    const interval = setInterval(sendElapsed, 1000);
    return () => clearInterval(interval);
  }, [active, currentSession]);

  return null;
}

function App() {
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
