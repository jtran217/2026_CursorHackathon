import { create } from 'zustand';

interface ActivityEvent {
  app: string;
  idleSeconds: number;
  timestamp: number;
}

interface TabEvent {
  url: string;
  title: string;
  domain: string;
  timestamp: number;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface ActivityStore {
  events: ActivityEvent[];
  tabEvents: TabEvent[];
  distinctApps: number;
  avgDwellTime: number;
  switchesPerMinute: number;
  contextSwitchScore: number;
  totalIdlePercent: number;
  distinctDomains: number;
  tabSwitchesPerMinute: number;
  /** Minutes since the last 2-minute idle break */
  minutesSinceBreak: number;
  /** 0-100 strain from grinding without breaks — ramps 0→100 from 30→90 min no break */
  sedentaryStrain: number;
  /** True when idle ≥ 5 continuous minutes (triggers "Still there?" check-in) */
  isExtendedIdle: boolean;
  /** True when the most recent browser tab event is youtube.com and was within the last 30s */
  isYouTubeActive: boolean;
  isTracking: boolean;
  trackingStartTime: number | null;

  addEvent: (event: ActivityEvent) => void;
  addTabEvent: (data: { url: string; title: string; timestamp: number }) => void;
  startTracking: () => () => void;
  stopTracking: () => void;
  reset: () => void;
}

const WINDOW_MS = 5 * 60 * 1000; // 5-minute rolling window for switch metrics
const BREAK_THRESHOLD_S = 120;    // 2 min idle = meaningful break
const EXTENDED_IDLE_S = 10;       // 10s idle for testing (restore to 300 for production)
const YOUTUBE_STALE_MS = 30_000;  // tab event older than 30s is no longer "active"

function computeMetrics(
  events: ActivityEvent[],
  tabEvents: TabEvent[],
  trackingStartTime: number | null
) {
  const baseMetrics = {
    distinctApps: events.length > 0 ? 1 : 0,
    avgDwellTime: 0,
    switchesPerMinute: 0,
    contextSwitchScore: 0,
    totalIdlePercent: 0,
    distinctDomains: 0,
    tabSwitchesPerMinute: 0,
    minutesSinceBreak: trackingStartTime
      ? (Date.now() - trackingStartTime) / 60000
      : 0,
    sedentaryStrain: 0,
    isExtendedIdle: false,
    isYouTubeActive: false,
  };

  if (events.length < 2) return baseMetrics;

  // --- App switching metrics (5-min rolling window) ---
  const distinctApps = new Set(events.map((e) => e.app)).size;

  let switches = 0;
  for (let i = 1; i < events.length; i++) {
    if (events[i].app !== events[i - 1].app) switches++;
  }

  const windowSeconds = (events[events.length - 1].timestamp - events[0].timestamp) / 1000;
  const windowMinutes = Math.max(windowSeconds / 60, 0.1);
  const switchesPerMinute = switches / windowMinutes;

  const stints: number[] = [];
  let stintStart = events[0].timestamp;
  for (let i = 1; i < events.length; i++) {
    if (events[i].app !== events[i - 1].app) {
      stints.push((events[i].timestamp - stintStart) / 1000);
      stintStart = events[i].timestamp;
    }
  }
  stints.push((events[events.length - 1].timestamp - stintStart) / 1000);
  const avgDwellTime =
    stints.length > 0
      ? stints.reduce((sum, s) => sum + s, 0) / stints.length
      : 0;

  const idleEvents = events.filter((e) => e.idleSeconds > 30).length;
  const totalIdlePercent = Math.round((idleEvents / events.length) * 100);

  // --- Browser tab metrics (5-min rolling window) ---
  let distinctDomains = 0;
  let tabSwitchesPerMinute = 0;
  if (tabEvents.length >= 2) {
    distinctDomains = new Set(tabEvents.map((e) => e.domain)).size;
    let tabSwitches = 0;
    for (let i = 1; i < tabEvents.length; i++) {
      if (tabEvents[i].domain !== tabEvents[i - 1].domain) tabSwitches++;
    }
    const tabWindowSecs = (tabEvents[tabEvents.length - 1].timestamp - tabEvents[0].timestamp) / 1000;
    const tabWindowMins = Math.max(tabWindowSecs / 60, 0.1);
    tabSwitchesPerMinute = tabSwitches / tabWindowMins;
  }

  const contextSwitchScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (distinctApps - 2) * 15 +
          Math.max(0, (15 - avgDwellTime)) * 2 +
          Math.max(0, (switchesPerMinute - 2)) * 10 +
          Math.max(0, (distinctDomains - 3)) * 10 +
          Math.max(0, (tabSwitchesPerMinute - 3)) * 8
      )
    )
  );

  // --- Idle / sedentary metrics (all events since tracking started) ---
  const latest = events[events.length - 1];

  // Extended idle: is the most recent poll 5+ min idle?
  const isExtendedIdle = latest.idleSeconds >= EXTENDED_IDLE_S;

  // Find the last event that was a "meaningful break" (2+ min idle)
  // Walk backwards through all events to find the most recent break
  let lastBreakTime: number | null = null;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].idleSeconds >= BREAK_THRESHOLD_S) {
      lastBreakTime = events[i].timestamp;
      break;
    }
  }

  const minutesSinceBreak = lastBreakTime
    ? (Date.now() - lastBreakTime) / 60000
    : trackingStartTime
      ? (Date.now() - trackingStartTime) / 60000
      : 0;

  // Sedentary strain: 0 at 0-30 min without break, ramps linearly to 100 at 90+ min
  const sedentaryStrain = Math.min(
    100,
    Math.max(0, Math.round(((minutesSinceBreak - 30) / 60) * 100))
  );

  // YouTube active: most recent tab event is youtube.com and received within 30s
  const latestTab = tabEvents.length > 0 ? tabEvents[tabEvents.length - 1] : null;
  const isYouTubeActive =
    latestTab !== null &&
    latestTab.domain === 'youtube.com' &&
    Date.now() - latestTab.timestamp < YOUTUBE_STALE_MS;

  return {
    distinctApps,
    avgDwellTime: Math.round(avgDwellTime),
    switchesPerMinute: Math.round(switchesPerMinute * 10) / 10,
    contextSwitchScore,
    totalIdlePercent,
    distinctDomains,
    tabSwitchesPerMinute: Math.round(tabSwitchesPerMinute * 10) / 10,
    minutesSinceBreak: Math.round(minutesSinceBreak),
    sedentaryStrain,
    isExtendedIdle,
    isYouTubeActive,
  };
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
  events: [],
  tabEvents: [],
  distinctApps: 0,
  avgDwellTime: 0,
  switchesPerMinute: 0,
  contextSwitchScore: 0,
  totalIdlePercent: 0,
  distinctDomains: 0,
  tabSwitchesPerMinute: 0,
  minutesSinceBreak: 0,
  sedentaryStrain: 0,
  isExtendedIdle: false,
  isYouTubeActive: false,
  isTracking: false,
  trackingStartTime: null,

  addEvent: (event: ActivityEvent) => {
    const now = Date.now();
    const events = [...get().events, event].filter(
      (e) => now - e.timestamp < WINDOW_MS
    );
    const metrics = computeMetrics(events, get().tabEvents, get().trackingStartTime);
    set({ events, ...metrics });
  },

  addTabEvent: (data: { url: string; title: string; timestamp: number }) => {
    const now = Date.now();
    const newEvent: TabEvent = {
      ...data,
      domain: extractDomain(data.url),
    };
    const tabEvents = [...get().tabEvents, newEvent].filter(
      (e) => now - e.timestamp < WINDOW_MS
    );
    const metrics = computeMetrics(get().events, tabEvents, get().trackingStartTime);
    set({ tabEvents, ...metrics });
  },

  startTracking: () => {
    const trackingStartTime = Date.now();
    set({ isTracking: true, events: [], tabEvents: [], trackingStartTime });

    if (window.activityBridge) {
      window.activityBridge.startTracking();
      const unsubscribeActivity = window.activityBridge.onUpdate((data) => {
        get().addEvent(data);
      });
      const unsubscribeTabs = window.activityBridge.onTabUpdate((data) => {
        get().addTabEvent(data);
      });
      return () => {
        window.activityBridge.stopTracking();
        unsubscribeActivity();
        unsubscribeTabs();
        set({ isTracking: false });
      };
    }

    // Fallback mock for browser dev (no Electron)
    const interval = setInterval(() => {
      const apps = ['Code', 'Google Chrome', 'Terminal', 'Finder', 'Slack'];
      const mockApp = apps[Math.floor(Math.random() * 3)];
      get().addEvent({
        app: mockApp,
        idleSeconds: Math.random() > 0.9 ? 45 : Math.floor(Math.random() * 10),
        timestamp: Date.now(),
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      set({ isTracking: false });
    };
  },

  stopTracking: () => {
    if (window.activityBridge) {
      window.activityBridge.stopTracking();
    }
    set({ isTracking: false });
  },

  reset: () => {
    set({
      events: [],
      tabEvents: [],
      distinctApps: 0,
      avgDwellTime: 0,
      switchesPerMinute: 0,
      contextSwitchScore: 0,
      totalIdlePercent: 0,
      distinctDomains: 0,
      tabSwitchesPerMinute: 0,
      minutesSinceBreak: 0,
      sedentaryStrain: 0,
      isExtendedIdle: false,
      isTracking: false,
      trackingStartTime: null,
    });
  },
}));
