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

function computeStrainScore(history: HRDataPoint[]): number {
  if (history.length === 0) return 0;
  const recent = history.slice(-30);
  const avg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
  // Strain maps roughly: 60bpm→0, 120bpm→100
  return Math.min(100, Math.max(0, Math.round(((avg - 60) / 60) * 100)));
}

const MAX_HISTORY = 180; // ~30 min at 10s intervals

export const useHeartRateStore = create<HeartRateStore>((set, get) => ({
  currentHR: 72,
  hrHistory: [],
  cognitiveState: 'normal',
  strainScore: 0,
  isConnected: false,

  updateHR: (value: number) => {
    const point: HRDataPoint = { value, timestamp: Date.now() };
    const history = [...get().hrHistory, point].slice(-MAX_HISTORY);
    set({
      currentHR: value,
      hrHistory: history,
      cognitiveState: computeCognitiveState(value),
      strainScore: computeStrainScore(history),
    });
  },

  startMockHR: () => {
    let baseHR = 68;
    let trend = 0;

    set({ isConnected: true });

    const interval = setInterval(() => {
      // Slow random walk with occasional spikes
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
