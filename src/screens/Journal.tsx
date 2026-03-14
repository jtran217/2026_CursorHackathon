import { useState } from 'react';
import { useSessionStore } from '../store/sessionStore';

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getDateGroup(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 7) return 'This Week';
  if (diffDays < 14) return 'Last Week';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function Journal() {
  const { pastSessions } = useSessionStore();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (pastSessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p
          className="text-text-tertiary"
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'var(--text-xl)',
          }}
        >
          Your first session will appear here.
        </p>
      </div>
    );
  }

  const sorted = [...pastSessions].reverse();

  let lastGroup = '';

  return (
    <div>
      <h1
        className="text-text-primary mb-8"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-xl)',
          fontWeight: 500,
        }}
      >
        Journal
      </h1>

      <div className="journal-timeline">
        {sorted.map((session, i) => {
          const group = getDateGroup(session.startTime);
          const showGroup = group !== lastGroup;
          lastGroup = group;
          const duration = (session.endTime || session.startTime) - session.startTime;
          const isExpanded = expandedIndex === i;

          return (
            <div key={i}>
              {showGroup && (
                <p
                  className="journal-date-group text-text-tertiary mb-3 -ml-6"
                  style={{
                    fontSize: 'var(--text-xs)',
                    letterSpacing: 'var(--tracking-widest)',
                    textTransform: 'uppercase',
                  }}
                >
                  {group}
                </p>
              )}
              <div
                className="journal-entry mb-4 cursor-pointer"
                onClick={() =>
                  setExpandedIndex(isExpanded ? null : i)
                }
              >
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className="text-text-tertiary"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    {formatDate(session.startTime)}
                  </span>
                  <span
                    className="badge"
                    style={{
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    {formatDuration(duration)}
                  </span>
                  <span
                    className={`strain-score strain-score--${
                      session.focusQuality >= 70
                        ? 'low'
                        : session.focusQuality >= 40
                          ? 'moderate'
                          : 'high'
                    }`}
                    style={{ fontSize: 'var(--text-sm)' }}
                  >
                    {session.focusQuality}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    className="mt-3 p-4 bg-bg-secondary border border-border"
                    style={{
                      borderRadius: 'var(--radius-lg)',
                      animation: 'stagger-in 300ms var(--ease-emerge) both',
                    }}
                  >
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p
                          className="text-text-tertiary mb-0.5"
                          style={{
                            fontSize: 'var(--text-xs)',
                            letterSpacing: 'var(--tracking-widest)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Avg HR
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-base)',
                          }}
                        >
                          {session.avgHR}{' '}
                          <span className="text-text-tertiary" style={{ fontSize: 'var(--text-xs)' }}>
                            bpm
                          </span>
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-text-tertiary mb-0.5"
                          style={{
                            fontSize: 'var(--text-xs)',
                            letterSpacing: 'var(--tracking-widest)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Peak strain
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-base)',
                          }}
                        >
                          {session.peakStrain}
                        </p>
                      </div>
                      <div>
                        <p
                          className="text-text-tertiary mb-0.5"
                          style={{
                            fontSize: 'var(--text-xs)',
                            letterSpacing: 'var(--tracking-widest)',
                            textTransform: 'uppercase',
                          }}
                        >
                          Interventions
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-base)',
                          }}
                        >
                          {session.interventionCount}
                        </p>
                      </div>
                    </div>
                    <p
                      className="text-text-tertiary"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      Started {formatTime(session.startTime)}
                      {session.endTime &&
                        ` · Ended ${formatTime(session.endTime)}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
