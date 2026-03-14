import { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';

type Phase = 'acknowledge' | 'decompress' | 'refocus';

const PHASES: Phase[] = ['acknowledge', 'decompress', 'refocus'];

function StepperDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {PHASES.map((_, i) => (
        <span
          key={i}
          className={`stepper-dot ${
            i === current
              ? 'stepper-dot--active'
              : i < current
                ? 'stepper-dot--done'
                : ''
          }`}
        />
      ))}
    </div>
  );
}

export function Intervention() {
  const { resumeFocus } = useSessionStore();
  const [phase, setPhase] = useState<Phase>('acknowledge');
  const [userTask, setUserTask] = useState('');

  const phaseIndex = PHASES.indexOf(phase);

  const advance = () => {
    if (phase === 'acknowledge') setPhase('decompress');
    else if (phase === 'decompress') setPhase('refocus');
    else resumeFocus();
  };

  return (
    <div className="intervention-backdrop">
      <div className="intervention-panel modal-shadow">
        <StepperDots current={phaseIndex} />

        {phase === 'acknowledge' && (
          <div>
            <p
              className="text-focus mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'var(--text-xl)',
                lineHeight: 'var(--leading-snug)',
              }}
            >
              Let's take a moment.
            </p>
            <p
              className="text-text-secondary mb-8"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Your body is telling you something. That's okay — this is what
              Flow is here for.
            </p>
            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={advance}>
                I'm ready
              </button>
            </div>
          </div>
        )}

        {phase === 'decompress' && (
          <div>
            <p
              className="text-focus mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'var(--text-xl)',
                lineHeight: 'var(--leading-snug)',
              }}
            >
              Breathe with me.
            </p>
            <p
              className="text-text-secondary mb-6"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Inhale for 4 seconds... exhale for 4 seconds.
            </p>

            <div className="flex justify-center mb-8">
              <div className="breathing-circle" />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-text-tertiary hover:text-text-secondary"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                }}
                onClick={advance}
              >
                Skip
              </button>
              <button type="button" className="btn-primary" onClick={advance}>
                That helped
              </button>
            </div>
          </div>
        )}

        {phase === 'refocus' && (
          <div>
            <p
              className="text-focus mb-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'var(--text-xl)',
                lineHeight: 'var(--leading-snug)',
              }}
            >
              What are you working on?
            </p>
            <p
              className="text-text-secondary mb-4"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
              }}
            >
              Write down the one thing you'd like to focus on next. Just one.
            </p>

            <textarea
              value={userTask}
              onChange={(e) => setUserTask(e.target.value)}
              placeholder="e.g. Finish the header component..."
              className="w-full mb-6 bg-bg-secondary text-text-primary border border-border"
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

            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={advance}>
                Let's go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
