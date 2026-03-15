import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useHeartRateStore } from '../store/heartRateStore';
import { Sparkline } from '../components/Sparkline';

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <>{value}</>;
}

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="card text-center" style={{ borderRadius: 'var(--radius-lg)' }}>
      <p
        className="text-text-tertiary mb-1"
        style={{
          fontSize: 'var(--text-xs)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p
        className="text-text-primary"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-lg)',
        }}
      >
        {value}
        {unit && (
          <span
            className="text-text-tertiary ml-1"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

export function SessionSummary() {
  const navigate = useNavigate();
  const { currentSession, saveToJournal, startSession } = useSessionStore();
  const { hrHistory } = useHeartRateStore();
  const [reflectionText, setReflectionText] = useState('');

  if (!currentSession) {
    navigate('/');
    return null;
  }

  const duration = (currentSession.endTime || Date.now()) - currentSession.startTime;
  const focusQuality = currentSession.focusQuality;

  const handleSaveAndHome = () => {
    saveToJournal(reflectionText);
    navigate('/');
  };

  const handleNewSession = () => {
    saveToJournal(reflectionText);
    startSession();
    navigate('/focus');
  };

  return (
    <div
      className="min-h-screen bg-bg flex items-start justify-center"
      style={{ padding: 'var(--space-2xl)' }}
    >
      <div className="stagger-reveal w-full" style={{ maxWidth: 640 }}>
        {/* Date + Duration */}
        <div className="mb-8">
          <p
            className="text-text-tertiary"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {formatDate(currentSession.startTime)} · {formatDuration(duration)}
          </p>
        </div>

        {/* Focus Quality — hero number */}
        <div className="mb-10">
          <p
            className="text-text-tertiary mb-1"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
            }}
          >
            Focus quality
          </p>
          <p
            className="text-text-primary"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-hero)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            <CountUp target={focusQuality} />
          </p>
        </div>

        {/* HR Sparkline */}
        <div
          className="bg-bg-secondary border border-border overflow-hidden mb-8"
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
            Heart rate — full session
          </p>
          <Sparkline data={hrHistory} width={600} height={100} />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatCard
            label="Avg HR"
            value={currentSession.avgHR}
            unit="bpm"
          />
          <StatCard
            label="Peak strain"
            value={currentSession.peakStrain}
            unit="/100"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <StatCard
            label="Interventions"
            value={currentSession.interventionCount}
          />
          <StatCard
            label="Apps used"
            value={currentSession.distinctApps ?? 0}
          />
          <StatCard
            label="Avg dwell"
            value={currentSession.avgDwellTime ?? 0}
            unit="sec"
          />
        </div>
        {(currentSession.distinctDomains ?? 0) > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <StatCard
              label="Sites visited"
              value={currentSession.distinctDomains ?? 0}
            />
            <StatCard
              label="Tab switches"
              value={currentSession.tabSwitchesPerMinute ?? 0}
              unit="/min"
            />
          </div>
        )}
        {(currentSession.distinctDomains ?? 0) === 0 && <div className="mb-8" />}

        {/* Reflection textarea */}
        <div className="mb-6">
          <label
            htmlFor="reflection"
            className="text-text-tertiary block mb-2"
            style={{
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
            }}
          >
            Reflection (optional)
          </label>
          <textarea
            id="reflection"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="How did it go? What would you do differently?"
            className="w-full bg-bg-secondary text-text-primary border border-border"
            style={{
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-lg)',
              fontSize: 'var(--text-base)',
              lineHeight: 'var(--leading-relaxed)',
              fontFamily: 'var(--font-ui)',
              resize: 'none',
              minHeight: 100,
            }}
          />
        </div>

        {/* Reflection summary */}
        <div
          className="mb-10"
          style={{
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p>
            {focusQuality >= 70
              ? 'A solid session. You stayed focused and your body stayed calm — that balance is the goal. Keep it up.'
              : focusQuality >= 40
                ? 'This session had its challenges, but you showed up and worked through it. The interventions helped bring you back to center.'
                : 'A tough session. Your body was under strain for much of it. Consider shorter sessions or more frequent breaks next time.'}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex gap-3">
          <button
            type="button"
            className="btn-ghost"
            onClick={handleSaveAndHome}
          >
            Save to journal
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleNewSession}
          >
            Start new session
          </button>
        </div>
      </div>
    </div>
  );
}
