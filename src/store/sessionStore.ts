import { create } from 'zustand';
import { postJournal, postSessionSummary, postActiveSession, clearActiveSession } from '../lib/api';

export type SessionState = 'idle' | 'focus' | 'intervention' | 'summary';

interface SessionData {
  sessionId?: string;
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
  isPaused: boolean;

  startSession: () => void;
  endSession: (data?: Partial<SessionData>) => void;
  triggerIntervention: () => void;
  resumeFocus: () => void;
  saveToJournal: (reflectionText?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionState: 'idle',
  currentSession: null,
  pastSessions: JSON.parse(localStorage.getItem('flow-sessions') || '[]'),
  isPaused: false,

  startSession: () => {
    const sessionId = `flow-session-${Date.now()}`;
    postActiveSession(sessionId);
    set({
      sessionState: 'focus',
      currentSession: {
        sessionId,
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

  pauseSession: () => {
    set({ isPaused: true });
  },

  resumeSession: () => {
    set({ isPaused: false });
  },

  saveToJournal: (reflectionText?: string) => {
    const current = get().currentSession;
    if (!current) return;
    const text = reflectionText?.trim() || 'Session ended.';
    if (current.sessionId) {
      postJournal(current.sessionId, 'session_ended', text);
      postSessionSummary(current.sessionId);
      clearActiveSession();
    }
    const sessions = [...get().pastSessions, current];
    localStorage.setItem('flow-sessions', JSON.stringify(sessions));
    set({
      pastSessions: sessions,
      currentSession: null,
      sessionState: 'idle',
    });
  },
}));
