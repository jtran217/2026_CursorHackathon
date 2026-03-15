import { create } from 'zustand';
import { getHeartRateActive, getHeartRateLive } from '../lib/api';

export type CognitiveState = 'calm' | 'normal' | 'elevated' | 'overload';

interface HRDataPoint {
  value: number;
  timestamp: number;
}

const BACKEND_FRESH_MS = 2500;
const STALE_MS = 3000;

/** Parse ISO timestamp; backend sends UTC — treat missing 'Z' as UTC for legacy responses */
function parseTimestamp(ts: string | undefined): number {
  if (!ts) return NaN;
  const hasTz = ts.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(ts);
  const normalized = hasTz ? ts : `${ts.replace(/Z$/, '')}Z`;
  const parsed = Date.parse(normalized);
  return isNaN(parsed) ? NaN : parsed;
}

interface HeartRateStore {
  currentHR: number;
  hrHistory: HRDataPoint[];
  cognitiveState: CognitiveState;
  hrStrain: number;
  /** Backwards-compatible alias — returns the blended focusStrain */
  strainScore: number;
  isConnected: boolean;
  lastBackendUpdate: number;

  updateHR: (value: number) => void;
  startMockHR: (onHRUpdate?: (bpm: number) => void) => () => void;
  startBackendPoll: (sessionId: string) => () => void;
  /** When onlyActiveSession is true, skip getHeartRateLive fallback — use only active-session API (404 when no session → show 0). */
  startLivePoll: (onlyActiveSession?: boolean) => () => void;
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
  currentHR: 0,
  hrHistory: [],
  cognitiveState: 'calm',
  hrStrain: 0,
  strainScore: 0,
  isConnected: false,
  lastBackendUpdate: Date.now(),

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

  startMockHR: (onHRUpdate?: (bpm: number) => void) => {
    let baseHR = 68;
    let trend = 0;

    set({ isConnected: true });

    const interval = setInterval(() => {
      const now = Date.now();
      const backendFresh = now - get().lastBackendUpdate < BACKEND_FRESH_MS;
      if (backendFresh) return;

      trend += (Math.random() - 0.5) * 2;
      trend = Math.max(-5, Math.min(5, trend));
      const noise = (Math.random() - 0.5) * 4;
      baseHR += trend * 0.3 + noise * 0.2;
      baseHR = Math.max(55, Math.min(115, baseHR));

      const bpm = Math.round(baseHR);
      get().updateHR(bpm);
      onHRUpdate?.(bpm);
    }, 2000);

    return () => {
      clearInterval(interval);
      set({ isConnected: false });
    };
  },

  startBackendPoll: (_sessionId: string) => {
    const poll = async () => {
      const data = await getHeartRateActive();
      if (!data) {
        get().updateHR(0);
        set({ lastBackendUpdate: Date.now() });
        return;
      }
      const ts = parseTimestamp(data.timestamp);
      const isStale = isNaN(ts) || Date.now() - ts > STALE_MS;
      if (isStale) {
        get().updateHR(0);
        set({ lastBackendUpdate: Date.now() });
      } else if (data.bpm != null) {
        get().updateHR(data.bpm);
        set({ lastBackendUpdate: Date.now() });
      }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
  },

  startLivePoll: (onlyActiveSession = false) => {
    const poll = async () => {
      let data = await getHeartRateActive();
      if (!data && !onlyActiveSession) data = await getHeartRateLive();
      if (!data) {
        if (onlyActiveSession) {
          get().updateHR(0);
        } else {
          // Home: no active session, no live data — use mock so the number still changes
          const mockBpm = Math.round(
            65 + Math.sin(Date.now() / 4000) * 8 + (Math.random() - 0.5) * 4
          );
          get().updateHR(Math.max(50, Math.min(95, mockBpm)));
        }
        set({ lastBackendUpdate: Date.now() });
        return;
      }
      const ts = parseTimestamp(data.timestamp);
      const isStale = isNaN(ts) || Date.now() - ts > STALE_MS;
      if (isStale) {
        if (onlyActiveSession) {
          get().updateHR(0);
        } else {
          const mockBpm = Math.round(
            65 + Math.sin(Date.now() / 4000) * 8 + (Math.random() - 0.5) * 4
          );
          get().updateHR(Math.max(50, Math.min(95, mockBpm)));
        }
        set({ lastBackendUpdate: Date.now() });
      } else if (data.bpm != null) {
        get().updateHR(data.bpm);
        set({ lastBackendUpdate: Date.now() });
      }
    };
    poll();
    const interval = setInterval(poll, 1000);
    return () => clearInterval(interval);
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
