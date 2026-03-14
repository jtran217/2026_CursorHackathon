import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeartRateStore } from '../store/heartRateStore';
import { useSessionStore } from '../store/sessionStore';
import { PulseDot } from '../components/PulseDot';
import { Intervention } from './Intervention';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function FocusMode() {
  const navigate = useNavigate();
  const { cognitiveState, currentHR, hrHistory, strainScore, startMockHR } =
    useHeartRateStore();
  const { currentSession, endSession, sessionState, triggerIntervention } =
    useSessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTimer, setMenuTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cleanup = startMockHR();
    return cleanup;
  }, [startMockHR]);

  useEffect(() => {
    if (!currentSession) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - currentSession.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  const handleMouseMove = useCallback(() => {
    setShowMenu(true);
    if (menuTimer) clearTimeout(menuTimer);
    const timer = setTimeout(() => setShowMenu(false), 3000);
    setMenuTimer(timer);
  }, [menuTimer]);

  const handleEndSession = () => {
    const avgHR =
      hrHistory.length > 0
        ? Math.round(hrHistory.reduce((s, p) => s + p.value, 0) / hrHistory.length)
        : currentHR;
    const focusQuality = Math.max(0, Math.min(100, 100 - strainScore));
    endSession({ avgHR, peakStrain: strainScore, focusQuality });
    navigate('/summary');
  };

  // Subtle background tint when cognitive state is elevated/overload
  const bgStyle: React.CSSProperties = {
    backgroundColor:
      cognitiveState === 'overload'
        ? 'rgba(216, 90, 48, 0.04)'
        : cognitiveState === 'elevated'
          ? 'rgba(216, 90, 48, 0.02)'
          : 'var(--color-bg)',
  };

  return (
    <div
      className="focus-screen fixed inset-0 flex flex-col items-center justify-center"
      style={bgStyle}
      onMouseMove={handleMouseMove}
    >
      {/* Pulse dot — top right */}
      <div className="absolute top-6 right-6">
        <PulseDot state={cognitiveState} />
      </div>

      {/* Overflow menu — appears on mouse movement */}
      {showMenu && (
        <div
          className="absolute top-6 left-6 flex gap-2"
          style={{
            animation: 'stagger-in 200ms var(--ease-emerge) both',
          }}
        >
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
            onClick={() => triggerIntervention()}
          >
            Take a break
          </button>
        </div>
      )}

      {/* Timer */}
      <div className="text-center">
        <p
          className="timer-tick text-text-secondary tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
          }}
        >
          {formatTime(elapsed)}
        </p>
        <p
          className="text-text-tertiary mt-2"
          style={{
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
          }}
        >
          Session time
        </p>
      </div>

      {/* End session */}
      <button
        type="button"
        className="absolute bottom-8 text-text-tertiary hover:text-text-secondary transition-colors"
        style={{
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-wide)',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={handleEndSession}
      >
        End session
      </button>

      {/* Intervention overlay */}
      {sessionState === 'intervention' && <Intervention />}
    </div>
  );
}
