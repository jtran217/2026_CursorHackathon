import { create } from 'zustand';

export type CognitiveState = 'calm' | 'normal' | 'elevated' | 'overload';

interface HRDataPoint {
  value: number;
  timestamp: number;
}

interface HeartRateStore {
  currentHR: number;
  hrHistory: HRDataPoint[];
  cognitiveState: CognitiveState;
  hrStrain: number;
  /** Backwards-compatible alias — returns the blended focusStrain */
  strainScore: number;
  isConnected: boolean;

  updateHR: (value: number) => void;
  startMockHR: () => () => void;
}

function computeCognitiveState(hr: number): CognitiveState {
  if (hr < 65) return 'calm';
  if (hr < 80) return 'normal';
  if (hr < 100) return 'elevated';
  return 'overload';
}

function computeHRStrain(history: HRDataPoint[]): number {
  if (history.length === 0) return 0;
  const recent = history.slice(-30);
  const avg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
  return Math.min(100, Math.max(0, Math.round(((avg - 60) / 60) * 100)));
}

const MAX_HISTORY = 180;

export const useHeartRateStore = create<HeartRateStore>((set, get) => ({
  currentHR: 72,
  hrHistory: [],
  cognitiveState: 'normal',
  hrStrain: 0,
  strainScore: 0,
  isConnected: false,

  updateHR: (value: number) => {
    const point: HRDataPoint = { value, timestamp: Date.now() };
    const history = [...get().hrHistory, point].slice(-MAX_HISTORY);
    const hrStrain = computeHRStrain(history);
    set({
      currentHR: value,
      hrHistory: history,
      cognitiveState: computeCognitiveState(value),
      hrStrain,
      strainScore: hrStrain,
    });
  },

  startMockHR: () => {
    let baseHR = 68;
    let trend = 0;

    set({ isConnected: true });

    const interval = setInterval(() => {
      trend += (Math.random() - 0.5) * 2;
      trend = Math.max(-5, Math.min(5, trend));
      const noise = (Math.random() - 0.5) * 4;
      baseHR += trend * 0.3 + noise * 0.2;
      baseHR = Math.max(55, Math.min(115, baseHR));

      get().updateHR(Math.round(baseHR));
    }, 2000);

    return () => {
      clearInterval(interval);
      set({ isConnected: false });
    };
  },
}));

/**
 * Blends HR strain, context switch score, session duration, and sedentary
 * (no-break) strain into a single Focus Strain value (0-100).
 *
 * Weights: HR 40% · context switching 25% · session duration 15% · sedentary 20%
 */
export function computeFocusStrain(
  hrStrain: number,
  contextSwitchScore: number,
  sessionStartTime?: number,
  sedentaryStrain = 0
): number {
  // Session duration strain: ramps after 60 min, caps at 90+ min
  let durationStrain = 0;
  if (sessionStartTime) {
    const minutes = (Date.now() - sessionStartTime) / 60000;
    if (minutes > 60) {
      durationStrain = Math.min(100, Math.round(((minutes - 60) / 30) * 100));
    }
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        hrStrain * 0.4 +
          contextSwitchScore * 0.25 +
          durationStrain * 0.15 +
          sedentaryStrain * 0.2
      )
    )
  );
}
