/**
 * Backend API client. Swallows errors; does not block UI.
 */
const API_BASE = 'http://127.0.0.1:5001';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn('[api]', path, e);
    return null;
  }
}

export async function postHeartRate(
  sessionId: string,
  bpm: number
): Promise<boolean> {
  const result = await request<{ bpm: number }>('/api/heart-rate', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, bpm }),
  });
  return result !== null;
}

export async function getHeartRateLatest(
  sessionId: string
): Promise<{ bpm: number } | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/heart-rate/latest?session_id=${encodeURIComponent(sessionId)}`
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as { bpm: number };
  } catch (e) {
    console.warn('[api] getHeartRateLatest', e);
    return null;
  }
}

export async function getHeartRateActive(): Promise<{ bpm: number; timestamp?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/heart-rate/active`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as { bpm: number; timestamp?: string };
  } catch (e) {
    console.warn('[api] getHeartRateActive', e);
    return null;
  }
}

export async function getHeartRateLive(): Promise<{ bpm: number; timestamp?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/heart-rate/live`);
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as { bpm: number; timestamp?: string };
  } catch (e) {
    console.warn('[api] getHeartRateLive', e);
    return null;
  }
}

export interface JournalOptions {
  activity?: string;
  intensity?: number;
  coping_notes?: string;
  reminder_requested?: boolean;
  reminder_at?: string;
}

export async function postJournal(
  sessionId: string,
  source: 'overwhelming_trigger' | 'session_ended',
  text: string,
  options?: JournalOptions
): Promise<boolean> {
  const result = await request<unknown>('/api/journal', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, source, text, ...options }),
  });
  return result !== null;
}

export async function postSessionSummary(
  sessionId: string
): Promise<boolean> {
  const result = await request<unknown>('/api/session-summary', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
  return result !== null;
}

export async function postActiveSession(sessionId: string): Promise<boolean> {
  const result = await request<{ session_id: string }>('/api/active-session', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
  return result !== null;
}

export async function clearActiveSession(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/active-session`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[api] clearActiveSession', e);
  }
}

export async function getActiveSession(): Promise<{ session_id: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/active-session`);
    if (res.status === 404 || !res.ok) return null;
    return (await res.json()) as { session_id: string };
  } catch (e) {
    console.warn('[api] getActiveSession', e);
    return null;
  }
}
