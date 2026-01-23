import type { Alert, Event, Notification } from "@/lib/types";

const now = new Date();

const hoursFromNow = (hours: number) =>
  new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) =>
  new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const minutesAgo = (minutes: number) =>
  new Date(now.getTime() - minutes * 60 * 1000).toISOString();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const demoEvents: Event[] = [
  {
    id: "demo-nba-042",
    awayTeam: "Los Angeles Lakers",
    homeTeam: "Golden State Warriors",
    sport: "NBA",
    startTime: hoursAgo(2),
    isLive: true,
    inPlayState: { period: "Q3", clock: "7:42" },
    score: { away: 78, home: 83 }
  },
  {
    id: "demo-ncaab-110",
    awayTeam: "Duke",
    homeTeam: "North Carolina",
    sport: "NCAAB",
    startTime: hoursAgo(1),
    isLive: true,
    inPlayState: { period: "2H", clock: "12:18" },
    score: { away: 61, home: 65 }
  },
  {
    id: "demo-nfl-001",
    awayTeam: "Buffalo Bills",
    homeTeam: "Kansas City Chiefs",
    sport: "NFL",
    startTime: hoursFromNow(3),
    isLive: false
  },
  {
    id: "demo-ncaaf-222",
    awayTeam: "Alabama",
    homeTeam: "Georgia",
    sport: "NCAAF",
    startTime: hoursFromNow(26),
    isLive: false
  },
  {
    id: "demo-nfl-final",
    awayTeam: "Dallas Cowboys",
    homeTeam: "Philadelphia Eagles",
    sport: "NFL",
    startTime: daysAgo(1),
    isLive: false,
    statusText: "Final",
    score: { away: 24, home: 27 }
  }
];

const demoAlerts: Alert[] = [
  {
    id: "demo-alert-1",
    sport: "NBA",
    team: "Golden State Warriors",
    market: "spread",
    threshold: 6.5,
    isLive: true,
    enabled: true,
    lastTriggeredAt: minutesAgo(12),
    eventId: "demo-nba-042"
  },
  {
    id: "demo-alert-2",
    sport: "NFL",
    team: "Kansas City Chiefs",
    market: "moneyline",
    threshold: 225,
    isLive: false,
    enabled: true,
    eventId: "demo-nfl-001"
  },
  {
    id: "demo-alert-3",
    sport: "NCAAB",
    team: "Duke",
    market: "spread",
    threshold: 4.5,
    isLive: true,
    enabled: false,
    lastTriggeredAt: minutesAgo(38),
    eventId: "demo-ncaab-110"
  },
  {
    id: "demo-alert-4",
    sport: "NCAAF",
    team: "Georgia",
    market: "moneyline",
    threshold: 175,
    isLive: false,
    enabled: true,
    eventId: "demo-ncaaf-222"
  }
];

const demoNotifications: Notification[] = [
  {
    id: "demo-note-1",
    eventId: "demo-nba-042",
    condition: "Lakers live spread hits +8.5",
    firedAt: minutesAgo(3),
    isRead: false,
    awayTeam: "Los Angeles Lakers",
    homeTeam: "Golden State Warriors"
  },
  {
    id: "demo-note-2",
    eventId: "demo-ncaab-110",
    condition: "Duke moneyline reaches +140 live",
    firedAt: minutesAgo(41),
    isRead: true,
    awayTeam: "Duke",
    homeTeam: "North Carolina"
  },
  {
    id: "demo-note-3",
    eventId: "demo-nfl-001",
    condition: "Bills pregame spread hits +7.5",
    firedAt: hoursAgo(6),
    isRead: true,
    awayTeam: "Buffalo Bills",
    homeTeam: "Kansas City Chiefs"
  }
];

const ALERTS_KEY = "tipoff.demo.alerts";
const NOTIFICATIONS_KEY = "tipoff.demo.notifications";

const readStorage = <T>(key: string, fallback: T) => {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
    window.localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const getDemoEvents = () => demoEvents;

export const getDemoEventById = (id: string) =>
  demoEvents.find((event) => event.id === id) ?? demoEvents[0] ?? null;

export const getDemoAlerts = () => readStorage(ALERTS_KEY, demoAlerts);

export const saveDemoAlerts = (alerts: Alert[]) => {
  writeStorage(ALERTS_KEY, alerts);
};

export const createDemoAlert = (payload: {
  eventId: string;
  team: string;
  market: string;
  threshold: number;
  isLive: boolean;
}) => {
  const event = getDemoEventById(payload.eventId);
  const alert: Alert = {
    id: `demo-alert-${Date.now()}`,
    sport: event?.sport,
    team: payload.team,
    market: payload.market,
    threshold: payload.threshold,
    isLive: payload.isLive,
    enabled: true,
    eventId: payload.eventId
  };
  const next = [alert, ...getDemoAlerts()];
  saveDemoAlerts(next);
  return alert;
};

export const updateDemoAlert = (id: string, updates: Partial<Alert>) => {
  const alerts = getDemoAlerts();
  const next = alerts.map((alert) =>
    alert.id === id ? { ...alert, ...updates } : alert
  );
  saveDemoAlerts(next);
  return next.find((alert) => alert.id === id) ?? null;
};

export const deleteDemoAlert = (id: string) => {
  const next = getDemoAlerts().filter((alert) => alert.id !== id);
  saveDemoAlerts(next);
  return next;
};

export const getDemoNotifications = () =>
  readStorage(NOTIFICATIONS_KEY, demoNotifications);

export const saveDemoNotifications = (notifications: Notification[]) => {
  writeStorage(NOTIFICATIONS_KEY, notifications);
};

export const updateDemoNotification = (
  id: string,
  updates: Partial<Notification>
) => {
  const notifications = getDemoNotifications();
  const next = notifications.map((notification) =>
    notification.id === id ? { ...notification, ...updates } : notification
  );
  saveDemoNotifications(next);
  return next.find((notification) => notification.id === id) ?? null;
};
