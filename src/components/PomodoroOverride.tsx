import { useState } from 'react';
import {
  FOCUS_DURATION_MINUTES,
  BREAK_DURATION_MINUTES,
} from '../config/timerConfig';

type PomodoroOverrideProps = {
  onApply: (focusMinutes: number, breakMinutes: number) => void;
};

export function PomodoroOverride({ onApply }: PomodoroOverrideProps) {
  const [focusMinutes, setFocusMinutes] = useState(FOCUS_DURATION_MINUTES);
  const [breakMinutes, setBreakMinutes] = useState(BREAK_DURATION_MINUTES);
  const applyIfValid = (focus: number, breakMins: number) => {
    if (focus <= 0 || breakMins <= 0) return;
    onApply(focus, breakMins);
  };

  return (
    <div
      className="bg-bg-secondary border border-border"
      style={{
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-md)',
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
        Pomodoro settings
      </p>

      <div className="flex gap-3 mb-3">
        <label
          className="flex-1 text-text-secondary"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Focus (minutes)
          <input
            type="number"
            min={1}
            value={focusMinutes}
            onChange={(e) => {
              const next = Number(e.target.value) || 0;
              setFocusMinutes(next);
              applyIfValid(next, breakMinutes);
            }}
            className="w-full bg-bg-primary text-text-primary border border-border"
            style={{
              marginTop: 4,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 'var(--text-sm)',
            }}
          />
        </label>

        <label
          className="flex-1 text-text-secondary"
          style={{ fontSize: 'var(--text-xs)' }}
        >
          Break (minutes)
          <input
            type="number"
            min={1}
            value={breakMinutes}
            onChange={(e) => {
              const next = Number(e.target.value) || 0;
              setBreakMinutes(next);
              applyIfValid(focusMinutes, next);
            }}
            className="w-full bg-bg-primary text-text-primary border border-border"
            style={{
              marginTop: 4,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 'var(--text-sm)',
            }}
          />
        </label>
      </div>

    </div>
  );
}

