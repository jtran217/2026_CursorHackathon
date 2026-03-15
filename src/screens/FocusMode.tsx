import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeartRateStore, computeFocusStrain } from '../store/heartRateStore';
import { useSessionStore } from '../store/sessionStore';
import { useActivityStore } from '../store/activityStore';
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
  const { cognitiveState, currentHR, hrHistory, hrStrain, startMockHR } =
    useHeartRateStore();
  const { currentSession, endSession, sessionState, triggerIntervention } =
    useSessionStore();
  const { contextSwitchScore, distinctApps, avgDwellTime, sedentaryStrain, isExtendedIdle, startTracking, distinctDomains, tabSwitchesPerMinute } =
    useActivityStore();
  const [elapsed, setElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTimer, setMenuTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [dismissedIdleCheck, setDismissedIdleCheck] = useState(false);

  const focusStrain = computeFocusStrain(
    hrStrain,
    contextSwitchScore,
    currentSession?.startTime,
    sedentaryStrain
  );

  useEffect(() => {
    const cleanup = startMockHR();
    return cleanup;
  }, [startMockHR]);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  useEffect(() => {
    if (!currentSession) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - currentSession.startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession]);

  // Reset dismissal when user comes back from extended idle
  useEffect(() => {
    if (!isExtendedIdle) setDismissedIdleCheck(false);
  }, [isExtendedIdle]);

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
    const focusQuality = Math.max(0, Math.min(100, 100 - focusStrain));
    endSession({
      avgHR,
      peakStrain: focusStrain,
      focusQuality,
      distinctApps,
      avgDwellTime,
      distinctDomains,
      tabSwitchesPerMinute,
    });
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

      {/* Extended idle check-in — gentle, non-blocking */}
      {isExtendedIdle && !dismissedIdleCheck && sessionState !== 'intervention' && (
        <div
          className="absolute bottom-20 left-1/2 -translate-x-1/2 card"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg) var(--space-xl)',
            maxWidth: 360,
            width: '90%',
            animation: 'panel-slide-in 400ms var(--ease-emerge) both',
          }}
        >
          <p
            className="text-text-primary mb-1"
            style={{ fontSize: 'var(--text-base)', fontWeight: 500 }}
          >
            Still there?
          </p>
          <p
            className="text-text-secondary mb-4"
            style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            You've been away for a while. Want to end the session or keep going?
          </p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
              onClick={handleEndSession}
            >
              End session
            </button>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
              onClick={() => setDismissedIdleCheck(true)}
            >
              Keep going
            </button>
          </div>
        </div>
      )}

      {/* Intervention overlay */}
      {sessionState === 'intervention' && <Intervention />}
    </div>
  );
}
