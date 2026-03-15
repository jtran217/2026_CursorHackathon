import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeartRateStore, computeFocusStrain } from '../store/heartRateStore';
import { useSessionStore } from '../store/sessionStore';
import { useActivityStore } from '../store/activityStore';
import { PulseDot } from '../components/PulseDot';
import { HRDisplay } from '../components/HRDisplay';
import { MascotNotification } from '../components/MascotNotification';
import { postHeartRate } from '../lib/api';
import { sendOSNotification } from '../lib/notifications';

const WORK_MS = 25 * 60 * 1000;
const BREAK_MS = 5 * 60 * 1000;

// How long HR must stay elevated/overload before showing the worried-Briosh prompt
const HR_WARN_DELAY_MS = 10_000;
// How long to wait before re-showing the HR prompt after the user says "No"
const HR_COOLDOWN_MS = 5 * 60 * 1000;

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
  const {
    contextSwitchScore,
    distinctApps,
    avgDwellTime,
    sedentaryStrain,
    isExtendedIdle,
    isYouTubeActive,
    startTracking,
    distinctDomains,
    tabSwitchesPerMinute,
  } = useActivityStore();

  const [remaining, setRemaining] = useState(WORK_MS);
  const [phaseEnded, setPhaseEnded] = useState(false);

  // ── Notification visibility state ─────────────────────────────────────────
  const [showHRWarn, setShowHRWarn] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [dismissedIdleCheck, setDismissedIdleCheck] = useState(false);

  // ── HR warning refs ────────────────────────────────────────────────────────
  // Timestamp when cognitiveState first entered elevated/overload
  const hrElevatedSinceRef = useRef<number | null>(null);
  // Timestamp until which the HR warning is silenced after user dismisses
  const hrCooldownUntilRef = useRef<number>(0);

  // ── YouTube notification dedup ─────────────────────────────────────────────
  // True once we've shown the notification for the current YouTube visit;
  // reset to false when isYouTubeActive goes false (user navigates away).
  const ytNotifShownRef = useRef(false);

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

  // Reset idle dismissal when the user returns from extended idle
  useEffect(() => {
    if (!isExtendedIdle) setDismissedIdleCheck(false);
  }, [isExtendedIdle]);

  // ── HR warning trigger ─────────────────────────────────────────────────────
  useEffect(() => {
    const isElevated = cognitiveState === 'elevated' || cognitiveState === 'overload';

    if (!isElevated) {
      hrElevatedSinceRef.current = null;
      return;
    }

    // Start the clock if we haven't yet
    if (hrElevatedSinceRef.current === null) {
      hrElevatedSinceRef.current = Date.now();
    }

    // Poll every 5s to check if 30s threshold has been crossed
    const interval = setInterval(() => {
      const since = hrElevatedSinceRef.current;
      if (since === null) return;
      const elapsed = Date.now() - since;
      const inCooldown = Date.now() < hrCooldownUntilRef.current;

      if (elapsed >= HR_WARN_DELAY_MS && !inCooldown && !showHRWarn && sessionState !== 'intervention') {
        setShowHRWarn(true);
        sendOSNotification(
          'Restore — Heads up',
          'Your heart rate has been climbing. Are you feeling overwhelmed?',
          'worried_bri.png'
        );
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [cognitiveState, showHRWarn, sessionState]);

  // ── YouTube trigger ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isYouTubeActive && !ytNotifShownRef.current) {
      const timer = setTimeout(() => {
        ytNotifShownRef.current = true;
        setShowYouTube(true);
        sendOSNotification(
          'Restore — Hey there',
          'Looks like you wandered to YouTube. Ready to come back?',
          'astro_side.png'
        );
      }, 15_000);
      return () => clearTimeout(timer);
    }
    if (!isYouTubeActive) {
      ytNotifShownRef.current = false;
      setShowYouTube(false);
    }
  }, [isYouTubeActive]);

  // ── Phase-end OS notification ──────────────────────────────────────────────
  useEffect(() => {
    if (phaseEnded && pomodoroPhase === 'work') {
      sendOSNotification('Restore — Nice work!', "Time for a 5-minute break. You earned it.", 'astro.png');
    }
    if (phaseEnded && pomodoroPhase === 'break') {
      sendOSNotification('Restore — Break over', 'Ready for another round?', 'astro.png');
    }
  }, [phaseEnded, pomodoroPhase]);

  // ── Idle OS notification ───────────────────────────────────────────────────
  useEffect(() => {
    if (isExtendedIdle && !dismissedIdleCheck && sessionState !== 'intervention') {
      sendOSNotification('Restore — Still there?', "You've been away for a while.", 'astro_side.png');
    }
  }, [isExtendedIdle, dismissedIdleCheck, sessionState]);

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  const handleHRYes = () => {
    setShowHRWarn(false);
    handleOverwhelmed();
  };

  const handleHRNo = () => {
    setShowHRWarn(false);
    hrElevatedSinceRef.current = Date.now(); // reset clock so it won't fire again immediately
    hrCooldownUntilRef.current = Date.now() + HR_COOLDOWN_MS;
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

  // Priority for the secondary (non-timer) mascot card: HR > YouTube > Idle
  const showIdleCard = isExtendedIdle && !dismissedIdleCheck && sessionState !== 'intervention';
  const activeSecondaryCard = showHRWarn ? 'hr' : showYouTube ? 'youtube' : showIdleCard ? 'idle' : null;

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

      {/* Current HR */}
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

      {/* ── Phase-end mascot card (happy Astro) ── */}
      {phaseEnded && (
        <MascotNotification
          mascot="astro"
          title={pomodoroPhase === 'work' ? 'Nice work!' : "Break's over."}
          message={
            pomodoroPhase === 'work'
              ? 'Time for a 5-minute break. You earned it.'
              : 'Ready for another round?'
          }
          actions={
            pomodoroPhase === 'work'
              ? [{ label: 'Start Break', variant: 'primary', onClick: handleStartBreak }]
              : [
                  { label: 'End Session', variant: 'ghost', onClick: handleEndSession },
                  {
                    label: `Start Round ${pomodoroRound + 1}`,
                    variant: 'primary',
                    onClick: handleStartNextRound,
                  },
                ]
          }
        />
      )}

      {/* ── Secondary mascot cards (HR > YouTube > Idle) — only one at a time ── */}

      {activeSecondaryCard === 'hr' && (
        <MascotNotification
          mascot="worried_bri"
          title="Your heart rate is climbing."
          message="You've been in high-strain territory for a while. Are you feeling overwhelmed?"
          actions={[
            { label: "No, I'm good", variant: 'ghost', onClick: handleHRNo },
            { label: 'Yes, help me', variant: 'primary', onClick: handleHRYes },
          ]}
          onDismiss={handleHRNo}
        />
      )}

      {activeSecondaryCard === 'youtube' && (
        <MascotNotification
          mascot="astro_side"
          title="Looks like you wandered to YouTube."
          message="No judgment — but your focus session is still running."
          actions={[
            { label: 'Got it', variant: 'ghost', onClick: () => setShowYouTube(false) },
            { label: 'Back to it', variant: 'primary', onClick: () => setShowYouTube(false) },
          ]}
          onDismiss={() => setShowYouTube(false)}
        />
      )}

      {activeSecondaryCard === 'idle' && (
        <MascotNotification
          mascot="astro_side"
          title="Still there?"
          message="You've been away for a while. Want to keep the session going or end it?"
          actions={[
            { label: 'End session', variant: 'ghost', onClick: handleEndSession },
            { label: 'Keep going', variant: 'primary', onClick: () => setDismissedIdleCheck(true) },
          ]}
        />
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
    </div>
  );
}
