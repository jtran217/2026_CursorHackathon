import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeartRateStore } from '../store/heartRateStore';
import { useSessionStore } from '../store/sessionStore';
import { HRDisplay } from '../components/HRDisplay';
import { PulseDot } from '../components/PulseDot';
import { Sparkline } from '../components/Sparkline';
import { StateBadge } from '../components/StateBadge';

export function Home() {
  const { currentHR, hrHistory, cognitiveState, strainScore, startMockHR } =
    useHeartRateStore();
  const { startSession, triggerIntervention } = useSessionStore();
  const navigate = useNavigate();

  useEffect(() => {
    const cleanup = startMockHR();
    return cleanup;
  }, [startMockHR]);

  const strainLevel =
    strainScore < 25
      ? 'low'
      : strainScore < 50
        ? 'moderate'
        : strainScore < 75
          ? 'high'
          : 'critical';

  const handleStartSession = () => {
    startSession();
    navigate('/focus');
  };

  return (
    <div
      className="grid gap-8 items-start"
      style={{ gridTemplateColumns: '1.4fr 1fr' }}
    >
      {/* Left column — HR + Sparkline + State */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <HRDisplay value={currentHR} />
          <div className="flex items-center gap-2 mt-2">
            <PulseDot state={cognitiveState} />
            <StateBadge state={cognitiveState} />
          </div>
        </div>

        <div
          className="bg-bg-secondary border border-border overflow-hidden"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-lg)',
          }}
        >
          <p
            className="text-text-tertiary mb-3"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
            }}
          >
            Heart rate — last 30 min
          </p>
          <Sparkline data={hrHistory} />
        </div>
      </div>

      {/* Right column — Session card */}
      <div
        className="card"
        style={{ borderRadius: 'var(--radius-lg)' }}
      >
        <p
          className="text-text-tertiary mb-2"
          style={{
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
          }}
        >
          Focus strain
        </p>

        <div className="flex items-baseline gap-2 mb-6">
          <span className={`strain-score strain-score--${strainLevel}`}>
            {strainScore}
          </span>
          <span
            className="text-text-tertiary"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-wide)',
            }}
          >
            / 100
          </span>
        </div>

        <div
          className="pt-5 space-y-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <p
            className="text-text-tertiary mb-3"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
            }}
          >
            Session
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={handleStartSession}
          >
            Start session
          </button>
          <button
            type="button"
            className="btn-signal w-full"
            onClick={() => {
              startSession();
              triggerIntervention();
              navigate('/focus');
            }}
          >
            I'm overwhelmed
          </button>
        </div>
      </div>
    </div>
  );
}
