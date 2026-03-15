import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeartRateStore, computeFocusStrain } from '../store/heartRateStore';
import { useSessionStore } from '../store/sessionStore';
import { useActivityStore } from '../store/activityStore';
import { PulseDot } from '../components/PulseDot';
import { HRDisplay } from '../components/HRDisplay';
import { postHeartRate } from '../lib/api';

const WORK_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function FocusMode() {
  const navigate = useNavigate();
  const { cognitiveState, currentHR, hrHistory, hrStrain, startMockHR, startLivePoll } =
    useHeartRateStore();
  const {
    currentSession,
    endSession,
    sessionState,
    triggerIntervention,
    isPaused,
    pauseSession,
    resumeSession,
    pomodoroPhase,
    pomodoroRound,
    setPomodoroPhase,
    incrementPomodoroRound,
    setRemainingMs,
  } = useSessionStore();
  const { contextSwitchScore, distinctApps, avgDwellTime, sedentaryStrain, isExtendedIdle, startTracking, distinctDomains, tabSwitchesPerMinute } =
    useActivityStore();
  const [remaining, setRemaining] = useState(WORK_MS);
  const [phaseEnded, setPhaseEnded] = useState(false);
  const [dismissedIdleCheck, setDismissedIdleCheck] = useState(false);

  // Track accumulated pause time so the timer stays accurate across pause/resume cycles
  const pauseOffsetRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef(Date.now());

  const focusStrain = computeFocusStrain(
    hrStrain,
    contextSwitchScore,
    currentSession?.startTime,
    sedentaryStrain
  );

  const sessionId = currentSession?.sessionId;

  useEffect(() => {
    const onHRUpdate = sessionId
      ? (bpm: number) => postHeartRate(sessionId, bpm)
      : undefined;
    const cleanup = startMockHR(onHRUpdate);
    return cleanup;
  }, [startMockHR, sessionId]);

  useEffect(() => {
    const cleanup = startLivePoll();
    return cleanup;
  }, [startLivePoll]);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  // Reset phase timer whenever pomodoroPhase changes
  useEffect(() => {
    const initial = pomodoroPhase === 'work' ? WORK_MS : BREAK_MS;
    phaseStartTimeRef.current = Date.now();
    pauseOffsetRef.current = 0;
    pausedAtRef.current = null;
    setPhaseEnded(false);
    setRemaining(initial);
    setRemainingMs(initial);
  }, [pomodoroPhase, setRemainingMs]);

  // Countdown timer — pauses and resumes based on isPaused
  useEffect(() => {
    if (!currentSession || phaseEnded) return;
    if (isPaused) {
      pausedAtRef.current = Date.now();
      return;
    }
    if (pausedAtRef.current !== null) {
      pauseOffsetRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    const duration = pomodoroPhase === 'work' ? WORK_MS : BREAK_MS;
    const interval = setInterval(() => {
      const r = Math.max(0, duration - (Date.now() - phaseStartTimeRef.current - pauseOffsetRef.current));
      setRemaining(r);
      setRemainingMs(r);
      if (r === 0) {
        setPhaseEnded(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentSession, isPaused, pomodoroPhase, phaseEnded]);

  // Reset dismissal when user comes back from extended idle
  useEffect(() => {
    if (!isExtendedIdle) setDismissedIdleCheck(false);
  }, [isExtendedIdle]);

  const handleBreak = () => {
    if (isPaused) {
      resumeSession();
    } else {
      pauseSession();
    }
  };

  const handleOverwhelmed = () => {
    triggerIntervention();
    navigate('/intervention');
  };

  const handleStartBreak = () => {
    setPomodoroPhase('break');
  };

  const handleStartNextRound = () => {
    incrementPomodoroRound();
    setPomodoroPhase('work');
  };

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
    >
      {/* Pulse dot — top right */}
      <div className="absolute top-6 right-6">
        <PulseDot state={cognitiveState} />
      </div>

      {/* Action buttons — always visible */}
      <div className="absolute top-6 left-6 flex gap-2">
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
          onClick={handleBreak}
        >
          {isPaused ? 'Resume' : 'Take a break'}
        </button>
        <button
          type="button"
          className="btn-signal"
          style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
          onClick={handleOverwhelmed}
        >
          I'm Overwhelmed
        </button>
      </div>

      {/* Current HR — matches controller when connected */}
      <div className="mb-8">
        <HRDisplay value={currentHR} />
      </div>

      {/* Timer */}
      <div className="text-center">
        <p
          className="timer-tick text-text-secondary tabular-nums"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
            opacity: isPaused ? 0.45 : 1,
            transition: 'opacity 300ms var(--ease-flow)',
          }}
        >
          {formatTime(remaining)}
        </p>
        <p
          className="text-text-tertiary mt-2"
          style={{
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
          }}
        >
          {isPaused
            ? 'Paused'
            : pomodoroPhase === 'work'
              ? `Focus \u2022 Round ${pomodoroRound}`
              : 'Break'}
        </p>
      </div>

      {/* Phase-end banner */}
      {phaseEnded && (
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
            {pomodoroPhase === 'work' ? 'Nice work!' : "Break's over."}
          </p>
          <p
            className="text-text-secondary mb-4"
            style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 'var(--leading-relaxed)',
            }}
          >
            {pomodoroPhase === 'work'
              ? 'Time for a 5-minute break.'
              : 'Ready for another round?'}
          </p>
          <div className="flex gap-2 justify-end">
            {pomodoroPhase === 'work' ? (
              <button
                type="button"
                className="btn-primary"
                style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
                onClick={handleStartBreak}
              >
                Start Break
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
                  onClick={handleEndSession}
                >
                  End Session
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}
                  onClick={handleStartNextRound}
                >
                  Start Round {pomodoroRound + 1}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}
