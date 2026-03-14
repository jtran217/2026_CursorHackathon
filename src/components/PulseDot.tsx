import type { CognitiveState } from '../store/heartRateStore';

const stateClassMap: Record<CognitiveState, string> = {
  calm: 'pulse-dot--calm',
  normal: 'pulse-dot--normal',
  elevated: 'pulse-dot--elevated',
  overload: 'pulse-dot--overload',
};

interface PulseDotProps {
  state: CognitiveState;
}

export function PulseDot({ state }: PulseDotProps) {
  return <span className={`pulse-dot ${stateClassMap[state]}`} />;
}
