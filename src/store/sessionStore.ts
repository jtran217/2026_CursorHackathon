import { create } from 'zustand';

export type SessionState = 'idle' | 'focus' | 'intervention' | 'summary';

interface SessionData {
  startTime: number;
  endTime?: number;
  interventionCount: number;
  avgHR: number;
  peakStrain: number;
  focusQuality: number;
  distinctApps?: number;
  avgDwellTime?: number;
  distinctDomains?: number;
  tabSwitchesPerMinute?: number;
}

interface SessionStore {
  sessionState: SessionState;
  currentSession: SessionData | null;
  pastSessions: SessionData[];

  startSession: () => void;
  endSession: (data?: Partial<SessionData>) => void;
  triggerIntervention: () => void;
  resumeFocus: () => void;
  saveToJournal: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionState: 'idle',
  currentSession: null,
  pastSessions: JSON.parse(localStorage.getItem('flow-sessions') || '[]'),

  startSession: () => {
    set({
      sessionState: 'focus',
      currentSession: {
        startTime: Date.now(),
        interventionCount: 0,
        avgHR: 0,
        peakStrain: 0,
        focusQuality: 0,
      },
    });
  },

  endSession: (data) => {
    const current = get().currentSession;
    if (!current) return;
    set({
      sessionState: 'summary',
      currentSession: {
        ...current,
        endTime: Date.now(),
        ...data,
      },
    });
  },

  triggerIntervention: () => {
    const current = get().currentSession;
    if (current) {
      set({
        sessionState: 'intervention',
        currentSession: {
          ...current,
          interventionCount: current.interventionCount + 1,
        },
      });
    }
  },

  resumeFocus: () => {
    set({ sessionState: 'focus' });
  },

  saveToJournal: () => {
    const current = get().currentSession;
    if (!current) return;
    const sessions = [...get().pastSessions, current];
    localStorage.setItem('flow-sessions', JSON.stringify(sessions));
    set({
      pastSessions: sessions,
      currentSession: null,
      sessionState: 'idle',
    });
  },
}));
