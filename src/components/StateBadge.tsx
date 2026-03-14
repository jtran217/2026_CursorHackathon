import type { CognitiveState } from '../store/heartRateStore';

const stateConfig: Record<CognitiveState, { label: string; className: string }> = {
  calm: { label: 'Grounded', className: 'badge--calm' },
  normal: { label: 'Normal', className: 'badge--nudge' },
  elevated: { label: 'Elevated', className: 'badge--nudge' },
  overload: { label: 'Overload detected', className: 'badge--alert' },
};

interface StateBadgeProps {
  state: CognitiveState;
}

export function StateBadge({ state }: StateBadgeProps) {
  const { label, className } = stateConfig[state];
  return <span className={`badge ${className}`}>{label}</span>;
}
