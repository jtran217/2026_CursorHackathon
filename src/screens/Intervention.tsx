import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { postJournal } from '../lib/api';
import {
  type EmotionKey,
  type GroundingResponse,
  type RefocusResponse,
  getGroundingSuggestions,
  getRefocusSuggestions,
} from '../lib/interventionAI';

// ─── Phase definitions ────────────────────────────────────────────────────────

type Phase =
  | 'acknowledge'
  | 'decompress'
  | 'ground_question'
  | 'grounding'
  | 'refocus_suggestions'
  | 'reflection';

const PHASES: Phase[] = [
  'acknowledge',
  'decompress',
  'ground_question',
  'grounding',
  'refocus_suggestions',
  'reflection',
];

// ─── Emotion chip config ──────────────────────────────────────────────────────

const EMOTION_CHIPS: { key: EmotionKey; label: string }[] = [
  { key: 'anxious',     label: 'Anxious'     },
  { key: 'distracted',  label: 'Distracted'  },
  { key: 'overwhelmed', label: 'Overwhelmed' },
  { key: 'frustrated',  label: 'Frustrated'  },
  { key: 'exhausted',   label: 'Exhausted'   },
  { key: 'other',       label: 'Something else' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function PhaseHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-focus mb-2"
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 'var(--text-xl)',
        lineHeight: 'var(--leading-snug)',
      }}
    >
      {children}
    </p>
  );
}

function PhaseBody({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-text-secondary mb-6"
      style={{
        fontSize: 'var(--text-base)',
        lineHeight: 'var(--leading-relaxed)',
      }}
    >
      {children}
    </p>
  );
}

function SuggestionList({ items }: { items: string[] }) {
  return (
    <ul className="mb-8" style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 'var(--space-xl)' }}>
      {items.map((item, i) => (
        <li
          key={i}
          className="stagger-reveal"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)',
            padding: 'var(--space-md) 0',
            borderBottom: i < items.length - 1 ? '1px solid var(--color-border)' : 'none',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-relaxed)',
            color: 'var(--color-text-primary)',
            opacity: 0,
            transform: 'translateY(8px)',
            animation: `stagger-in 350ms var(--ease-emerge) ${i * 80}ms both`,
          }}
        >
          <span
            style={{
              marginTop: 4,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--color-focus)',
              flexShrink: 0,
            }}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Intervention() {
  const navigate = useNavigate();
  const { resumeFocus, currentSession } = useSessionStore();

  const [phase, setPhase] = useState<Phase>('acknowledge');
  const [isLoading, setIsLoading] = useState(false);

  // ground_question state
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey | null>(null);
  const [emotionFreeText, setEmotionFreeText] = useState('');

  // AI response state
  const [groundingSuggestions, setGroundingSuggestions] = useState<GroundingResponse | null>(null);
  const [refocusSuggestions, setRefocusSuggestions] = useState<RefocusResponse | null>(null);

  // reflection state
  const [reflectionText, setReflectionText] = useState('');

  useEffect(() => {
    if (!currentSession) {
      navigate('/');
    }
  }, [currentSession, navigate]);

  const phaseIndex = PHASES.indexOf(phase);

  const advance = async () => {
    if (phase === 'acknowledge') {
      setPhase('decompress');

    } else if (phase === 'decompress') {
      setPhase('ground_question');

    } else if (phase === 'ground_question') {
      const emotion: EmotionKey = selectedEmotion ?? 'other';
      setIsLoading(true);
      const [grounding, refocus] = await Promise.all([
        getGroundingSuggestions(emotion, emotionFreeText || undefined),
        getRefocusSuggestions(emotion, emotionFreeText || undefined),
      ]);
      setGroundingSuggestions(grounding);
      setRefocusSuggestions(refocus);
      setIsLoading(false);
      setPhase('grounding');

    } else if (phase === 'grounding') {
      setPhase('refocus_suggestions');

    } else if (phase === 'refocus_suggestions') {
      setPhase('reflection');

    } else if (phase === 'reflection') {
      if (currentSession?.sessionId) {
        const journalContent = [
          selectedEmotion ? `Feeling: ${selectedEmotion}` : '',
          emotionFreeText ? `Note: ${emotionFreeText}` : '',
          reflectionText ? `Reflection: ${reflectionText}` : '',
        ]
          .filter(Boolean)
          .join('\n') || 'Completed intervention.';

        postJournal(currentSession.sessionId, 'overwhelming_trigger', journalContent);
      }
      resumeFocus();
      navigate('/focus');
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        backgroundColor: 'var(--color-focus-surface)',
        animation: 'panel-slide-in 600ms var(--ease-emerge) both',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          padding: 'var(--space-2xl)',
        }}
      >
        <StepperDots current={phaseIndex} />

        {/* ── Phase 1: Acknowledge ── */}
        {phase === 'acknowledge' && (
          <div>
            <PhaseHeading>Let's take a moment.</PhaseHeading>
            <PhaseBody>
              Your body is telling you something. That's okay — this is what Flow is here for.
            </PhaseBody>
            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={advance}>
                I'm ready
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 2: Decompress (breathing) ── */}
        {phase === 'decompress' && (
          <div>
            <PhaseHeading>Breathe with me.</PhaseHeading>
            <PhaseBody>Inhale for 4 seconds... exhale for 4 seconds.</PhaseBody>

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

        {/* ── Phase 3: Grounding question ── */}
        {phase === 'ground_question' && (
          <div>
            <PhaseHeading>How are you feeling right now?</PhaseHeading>
            <PhaseBody>
              Pick the closest match — this helps Flow suggest the right kind of support.
            </PhaseBody>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              {EMOTION_CHIPS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedEmotion(key)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid',
                    borderColor: selectedEmotion === key ? 'var(--color-focus)' : 'var(--color-border)',
                    background: selectedEmotion === key ? 'var(--color-focus)' : 'transparent',
                    color: selectedEmotion === key ? '#fff' : 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-ui)',
                    cursor: 'pointer',
                    transition: 'all 180ms var(--ease-flow)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={emotionFreeText}
              onChange={(e) => setEmotionFreeText(e.target.value)}
              placeholder="Anything else you want to add? (optional)"
              className="w-full bg-bg-secondary text-text-primary border border-border"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-relaxed)',
                fontFamily: 'var(--font-ui)',
                resize: 'none',
                minHeight: 72,
                marginBottom: 'var(--space-lg)',
              }}
            />

            <div className="flex justify-end">
              <button
                type="button"
                className="btn-primary"
                onClick={advance}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                {isLoading ? 'A moment...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 4: Grounding suggestions ── */}
        {phase === 'grounding' && groundingSuggestions && (
          <div>
            <PhaseHeading>Here's something to try.</PhaseHeading>
            <p
              className="text-text-secondary"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              {groundingSuggestions.message}
            </p>

            <SuggestionList items={groundingSuggestions.suggestions} />

            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={advance}>
                I've tried this
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 5: Refocus suggestions ── */}
        {phase === 'refocus_suggestions' && refocusSuggestions && (
          <div>
            <PhaseHeading>When you're ready to come back...</PhaseHeading>
            <p
              className="text-text-secondary"
              style={{
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              {refocusSuggestions.message}
            </p>

            <SuggestionList items={refocusSuggestions.tips} />

            <div className="flex justify-end">
              <button type="button" className="btn-primary" onClick={advance}>
                Ready to refocus
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 6: Reflection ── */}
        {phase === 'reflection' && (
          <div>
            <PhaseHeading>One last thing.</PhaseHeading>
            <PhaseBody>
              What's one thing you want to carry forward from this pause?
            </PhaseBody>

            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="e.g. I'll tackle just one thing at a time..."
              className="w-full bg-bg-secondary text-text-primary border border-border"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
                fontSize: 'var(--text-base)',
                lineHeight: 'var(--leading-relaxed)',
                fontFamily: 'var(--font-ui)',
                resize: 'none',
                minHeight: 100,
                marginBottom: 'var(--space-lg)',
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
