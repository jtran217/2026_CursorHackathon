import { create } from 'zustand';
import { postJournal, postSessionSummary, postActiveSession, clearActiveSession } from '../lib/api';

export type SessionState = 'idle' | 'focus' | 'intervention' | 'summary';
export type PomodoroPhase = 'work' | 'break';

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

const WORK_MS = 25 * 60 * 1000;

interface SessionStore {
  sessionState: SessionState;
  currentSession: SessionData | null;
  pastSessions: SessionData[];
  isPaused: boolean;
  pomodoroPhase: PomodoroPhase;
  pomodoroRound: number;
  remainingMs: number;

  startSession: () => void;
  endSession: (data?: Partial<SessionData>) => void;
  triggerIntervention: () => void;
  resumeFocus: () => void;
  saveToJournal: (reflectionText?: string) => void | Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  setPomodoroPhase: (phase: PomodoroPhase) => void;
  incrementPomodoroRound: () => void;
  setRemainingMs: (ms: number) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionState: 'idle',
  currentSession: null,
  pastSessions: JSON.parse(localStorage.getItem('flow-sessions') || '[]'),
  isPaused: false,
  pomodoroPhase: 'work',
  pomodoroRound: 1,
  remainingMs: WORK_MS,

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
      pomodoroPhase: 'work',
      pomodoroRound: 1,
      remainingMs: WORK_MS,
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

  setPomodoroPhase: (phase: PomodoroPhase) => {
    set({ pomodoroPhase: phase });
  },

  incrementPomodoroRound: () => {
    set((state) => ({ pomodoroRound: state.pomodoroRound + 1 }));
  },

  setRemainingMs: (ms: number) => {
    set({ remainingMs: ms });
  },

  saveToJournal: async (reflectionText?: string) => {
    const current = get().currentSession;
    if (!current) return;
    const text = reflectionText?.trim() || 'Session ended.';
    if (current.sessionId) {
      postJournal(current.sessionId, 'session_ended', text);
      await postSessionSummary(current.sessionId);
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
