import type {
  AlertRule,
  AlertRuleType,
  BetLog,
  CLV,
  ConsensusLine,
  Event,
  MarketType,
  Notification,
  OddsSnapshot,
  Sport,
  Sportsbook,
  TargetTracker
} from "./contracts";
import { isWithinAllowedHours, loadAlertPreferences } from "./preferences";

export type ApiMode = "mock" | "real";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const RESOLVED_MODE: ApiMode =
  process.env.NEXT_PUBLIC_API_MODE === "real" ? "real" : "mock";
const ODDS_MODE: ApiMode =
  process.env.NEXT_PUBLIC_LIVE_ODDS === "real" ? "real" : RESOLVED_MODE;

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const apiFetch = async <T>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const mockDelay = () => sleep(150 + Math.random() * 350);

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const now = Date.now();
const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) =>
  new Date(now + hours * 60 * 60 * 1000).toISOString();
const hoursAgo = (hours: number) =>
  new Date(now - hours * 60 * 60 * 1000).toISOString();

const mockSportsbooks: Sportsbook[] = [
  { id: "dk", name: "DraftKings", shortName: "DK", region: "US" },
  { id: "fd", name: "FanDuel", shortName: "FD", region: "US" },
  { id: "mgm", name: "BetMGM", shortName: "MGM", region: "US" },
  { id: "caesars", name: "Caesars", shortName: "CZR", region: "US" }
];

const consensusLine = (
  eventId: string,
  market: MarketType,
  line: number,
  homeOdds: number,
  awayOdds: number
): ConsensusLine => ({
  eventId,
  market,
  line,
  homeOdds,
  awayOdds,
  timestamp: minutesAgo(2),
  sources: mockSportsbooks.map((book) => book.id)
});

const mockEvents: Event[] = [
  {
    id: "v2-nba-042",
    awayTeam: "Los Angeles Lakers",
    homeTeam: "Golden State Warriors",
    sport: "NBA",
    startTime: hoursAgo(2),
    isLive: true,
    inPlayState: { period: "Q3", clock: "7:42", statusText: "LIVE Q3 7:42" },
    score: { away: 78, home: 83 },
    lastUpdated: minutesAgo(1),
    consensus: [
      consensusLine("v2-nba-042", "spread", -4.5, -108, -112),
      consensusLine("v2-nba-042", "total", 221.5, -110, -110),
      consensusLine("v2-nba-042", "moneyline", 0, -185, 160)
    ]
  },
  {
    id: "v2-ncaab-110",
    awayTeam: "Duke",
    homeTeam: "North Carolina",
    sport: "NCAAB",
    startTime: hoursAgo(1),
    isLive: true,
    inPlayState: { period: "2H", clock: "12:18", statusText: "LIVE 2H 12:18" },
    score: { away: 61, home: 65 },
    lastUpdated: minutesAgo(2),
    consensus: [
      consensusLine("v2-ncaab-110", "spread", 2.5, -112, -108),
      consensusLine("v2-ncaab-110", "total", 148.5, -110, -110),
      consensusLine("v2-ncaab-110", "moneyline", 0, 125, -145)
    ]
  },
  {
    id: "v2-nfl-001",
    awayTeam: "Buffalo Bills",
    homeTeam: "Kansas City Chiefs",
    sport: "NFL",
    startTime: hoursFromNow(3),
    isLive: false,
    statusText: "PREGAME",
    consensus: [
      consensusLine("v2-nfl-001", "spread", 3.0, -110, -110),
      consensusLine("v2-nfl-001", "total", 47.5, -110, -110),
      consensusLine("v2-nfl-001", "moneyline", 0, -145, 125)
    ]
  },
  {
    id: "v2-ncaaf-222",
    awayTeam: "Alabama",
    homeTeam: "Georgia",
    sport: "NCAAF",
    startTime: hoursFromNow(26),
    isLive: false,
    statusText: "PREGAME",
    consensus: [
      consensusLine("v2-ncaaf-222", "spread", -1.5, -110, -110),
      consensusLine("v2-ncaaf-222", "total", 52.0, -110, -110),
      consensusLine("v2-ncaaf-222", "moneyline", 0, 115, -135)
    ]
  },
  {
    id: "v2-nba-100",
    awayTeam: "Boston Celtics",
    homeTeam: "Miami Heat",
    sport: "NBA",
    startTime: hoursFromNow(6),
    isLive: false,
    statusText: "PREGAME",
    consensus: [
      consensusLine("v2-nba-100", "spread", -2.0, -110, -110),
      consensusLine("v2-nba-100", "total", 219.5, -110, -110),
      consensusLine("v2-nba-100", "moneyline", 0, -125, 105)
    ]
  }
];

const mockOddsSnapshots: OddsSnapshot[] = [
  {
    id: "odds-100",
    eventId: "v2-nba-042",
    market: "spread",
    line: -4.5,
    homeOdds: -108,
    awayOdds: -112,
    timestamp: minutesAgo(3),
    sportsbookId: "dk",
    isLive: true,
    tags: ["opening"]
  },
  {
    id: "odds-101",
    eventId: "v2-nba-042",
    market: "total",
    line: 221.5,
    homeOdds: -110,
    awayOdds: -110,
    timestamp: minutesAgo(3),
    sportsbookId: "dk",
    isLive: true,
    tags: ["opening"]
  },
  {
    id: "odds-102",
    eventId: "v2-nba-042",
    market: "moneyline",
    line: 0,
    homeOdds: -185,
    awayOdds: 160,
    timestamp: minutesAgo(3),
    sportsbookId: "dk",
    isLive: true,
    tags: ["opening"]
  },
  {
    id: "odds-200",
    eventId: "v2-ncaab-110",
    market: "spread",
    line: 2.5,
    homeOdds: -112,
    awayOdds: -108,
    timestamp: minutesAgo(5),
    sportsbookId: "fd",
    isLive: true
  },
  {
    id: "odds-201",
    eventId: "v2-ncaab-110",
    market: "total",
    line: 148.5,
    homeOdds: -110,
    awayOdds: -110,
    timestamp: minutesAgo(5),
    sportsbookId: "fd",
    isLive: true
  },
  {
    id: "odds-202",
    eventId: "v2-ncaab-110",
    market: "moneyline",
    line: 0,
    homeOdds: 125,
    awayOdds: -145,
    timestamp: minutesAgo(5),
    sportsbookId: "fd",
    isLive: true
  },
  {
    id: "odds-300",
    eventId: "v2-nfl-001",
    market: "spread",
    line: 3.0,
    homeOdds: -110,
    awayOdds: -110,
    timestamp: minutesAgo(20),
    sportsbookId: "mgm",
    isLive: false
  },
  {
    id: "odds-301",
    eventId: "v2-nfl-001",
    market: "total",
    line: 47.5,
    homeOdds: -110,
    awayOdds: -110,
    timestamp: minutesAgo(20),
    sportsbookId: "mgm",
    isLive: false
  },
  {
    id: "odds-302",
    eventId: "v2-nfl-001",
    market: "moneyline",
    line: 0,
    homeOdds: -145,
    awayOdds: 125,
    timestamp: minutesAgo(20),
    sportsbookId: "mgm",
    isLive: false
  }
];

const mockAlerts: AlertRule[] = [
  {
    id: "rule-1",
    name: "Warriors live spread +8.5",
    type: "THRESHOLD_AT",
    enabled: true,
    isLive: true,
    createdAt: minutesAgo(40),
    eventId: "v2-nba-042",
    sport: "NBA",
    market: "spread",
    team: "away",
    cooldownSeconds: 120,
    threshold: 8.5,
    direction: "gte"
  },
  {
    id: "rule-2",
    name: "Chiefs key number watch",
    type: "KEY_NUMBER_PROXIMITY",
    enabled: true,
    isLive: false,
    createdAt: minutesAgo(90),
    sport: "NFL",
    market: "spread",
    keyNumber: 3,
    distance: 0.5,
    leagues: ["NFL"]
  },
  {
    id: "rule-3",
    name: "Steam move global",
    type: "STEAM",
    enabled: true,
    isLive: false,
    createdAt: minutesAgo(25),
    minBooks: 4,
    minMove: 1.0,
    windowSeconds: 120,
    scope: "global"
  },
  {
    id: "rule-4",
    name: "Heat live momentum",
    type: "LIVE_MOMENTUM",
    enabled: false,
    isLive: true,
    createdAt: minutesAgo(70),
    eventId: "v2-nba-100",
    sport: "NBA",
    market: "spread",
    team: "home",
    runPoints: 8,
    runSeconds: 90,
    minLineMove: 1.5
  },
  {
    id: "rule-5",
    name: "Duke buyback window",
    type: "BUYBACK",
    enabled: true,
    isLive: true,
    createdAt: minutesAgo(55),
    eventId: "v2-ncaab-110",
    sport: "NCAAB",
    market: "spread",
    team: "away",
    originalLine: 3.5,
    returnLine: 2.0,
    windowMinutes: 12
  },
  {
    id: "rule-6",
    name: "Reverse line move",
    type: "RLM",
    enabled: true,
    isLive: false,
    createdAt: minutesAgo(120),
    sport: "NFL",
    market: "spread",
    lineMove: 1.5,
    ticketPercent: 72,
    handlePercent: 48
  }
];

const mockTargets: TargetTracker[] = [
  {
    id: "target-1",
    eventId: "v2-nba-042",
    sport: "NBA",
    market: "spread",
    side: "away",
    target: 8.5,
    isLive: true,
    notifyOnHit: true,
    alertRuleId: "rule-1",
    autoRearm: true,
    cooldownSeconds: 90,
    createdAt: minutesAgo(35),
    lastHitAt: minutesAgo(6),
    nextRearmAt: new Date(Date.now() + 45 * 1000).toISOString(),
    armed: false
  },
  {
    id: "target-2",
    eventId: "v2-nfl-001",
    sport: "NFL",
    market: "moneyline",
    side: "home",
    target: -120,
    isLive: false,
    notifyOnHit: false,
    autoRearm: false,
    cooldownSeconds: 120,
    createdAt: minutesAgo(80),
    armed: true
  }
];

const ALERTS_STORAGE_KEY = "tipoff.v2.alerts";
const TARGETS_STORAGE_KEY = "tipoff.v2.targets";
let alertsInitialized = false;
let targetsInitialized = false;

const readStoredAlerts = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as AlertRule[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredAlerts = (alerts: AlertRule[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
};

const ensureMockAlerts = () => {
  if (alertsInitialized) {
    return mockState.alerts;
  }
  const stored = readStoredAlerts();
  if (stored) {
    mockState.alerts = stored;
  } else {
    writeStoredAlerts(mockState.alerts);
  }
  alertsInitialized = true;
  return mockState.alerts;
};

const readStoredTargets = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as TargetTracker[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredTargets = (targets: TargetTracker[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(targets));
};

const ensureMockTargets = () => {
  if (targetsInitialized) {
    return mockState.targets;
  }
  const stored = readStoredTargets();
  if (stored) {
    mockState.targets = stored;
  } else {
    writeStoredTargets(mockState.targets);
  }
  targetsInitialized = true;
  return mockState.targets;
};

const mockNotifications: Notification[] = [
  {
    id: "note-1",
    eventId: "v2-nba-042",
    alertRuleId: "rule-1",
    ruleType: "THRESHOLD_AT",
    firedAt: minutesAgo(4),
    message: "Warriors live spread reached +8.5",
    tags: ["threshold"],
    attribution: { signal: "threshold", confidence: 0.8 },
    isRead: false
  },
  {
    id: "note-2",
    eventId: "v2-nfl-001",
    alertRuleId: "rule-2",
    ruleType: "KEY_NUMBER_PROXIMITY",
    firedAt: minutesAgo(18),
    message: "Chiefs spread hovering near key number 3",
    tags: ["key-number"],
    attribution: { signal: "key-number", confidence: 0.72 },
    isRead: true
  }
];

const mockBetLogs: BetLog[] = [
  {
    id: "bet-1",
    eventId: "v2-nba-042",
    alertRuleId: "rule-1",
    market: "spread",
    team: "away",
    stake: 100,
    odds: -110,
    line: 8.5,
    placedAt: minutesAgo(30),
    result: "open"
  }
];

const mockCLV: CLV[] = [
  {
    id: "clv-1",
    eventId: "v2-nfl-001",
    alertRuleId: "rule-2",
    market: "spread",
    team: "home",
    betLine: -3,
    closeLine: -2.5,
    betOdds: -110,
    closeOdds: -108,
    delta: 0.5,
    calculatedAt: minutesAgo(10)
  }
];

const mockState = {
  events: mockEvents,
  oddsSnapshots: mockOddsSnapshots,
  alerts: mockAlerts,
  targets: mockTargets,
  notifications: mockNotifications,
  betLogs: mockBetLogs,
  clv: mockCLV,
  sportsbooks: mockSportsbooks
};

const clampOdds = (value: number) => Math.max(-300, Math.min(300, value));
const roundToHalf = (value: number) => Math.round(value * 2) / 2;

const getLatestSnapshot = (eventId: string, market: MarketType) => {
  const snapshots = mockState.oddsSnapshots.filter(
    (snapshot) => snapshot.eventId === eventId && snapshot.market === market
  );
  return snapshots[snapshots.length - 1];
};

const updateConsensus = (
  event: Event,
  market: MarketType,
  line: number,
  homeOdds: number,
  awayOdds: number
) => {
  const timestamp = new Date().toISOString();
  if (!event.consensus) {
    event.consensus = [];
  }
  const existing = event.consensus.find((entry) => entry.market === market);
  if (existing) {
    existing.line = line;
    existing.homeOdds = homeOdds;
    existing.awayOdds = awayOdds;
    existing.timestamp = timestamp;
    return;
  }
  event.consensus.push({
    eventId: event.id,
    market,
    line,
    homeOdds,
    awayOdds,
    timestamp,
    sources: mockState.sportsbooks.map((book) => book.id)
  });
};

const updateMockOdds = () => {
  const event = pick(mockState.events);
  const market = pick<MarketType>(["spread", "total", "moneyline"]);
  const last = getLatestSnapshot(event.id, market);
  if (!last) {
    return;
  }

  const timestamp = new Date().toISOString();
  let line = last.line;
  let homeOdds = last.homeOdds;
  let awayOdds = last.awayOdds;

  if (market === "moneyline") {
    homeOdds = clampOdds(homeOdds + randomBetween(-15, 15));
    awayOdds = clampOdds(awayOdds + randomBetween(-15, 15));
  } else {
    line = roundToHalf(line + (Math.random() > 0.5 ? 0.5 : -0.5));
    homeOdds = clampOdds(homeOdds + randomBetween(-6, 6));
    awayOdds = clampOdds(awayOdds + randomBetween(-6, 6));
  }

  const next: OddsSnapshot = {
    ...last,
    id: `odds-${Date.now()}`,
    line,
    homeOdds,
    awayOdds,
    timestamp,
    tags: ["mock", "movement"]
  };

  mockState.oddsSnapshots.push(next);
  event.lastUpdated = timestamp;
  updateConsensus(event, market, line, homeOdds, awayOdds);
};

const buildNotificationMessage = (ruleType: AlertRuleType) => {
  switch (ruleType) {
    case "THRESHOLD_MOVE":
      return "Threshold move alert triggered";
    case "STEAM":
      return "Steam move detected across books";
    case "KEY_NUMBER_PROXIMITY":
      return "Line approaching key number";
    case "BUYBACK":
      return "Buyback window detected";
    case "LIVE_MOMENTUM":
      return "Live momentum swing detected";
    case "RLM":
      return "Reverse line move detected";
    default:
      return "Threshold alert triggered";
  }
};

const shouldSuppressMockNotifications = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const preferences = loadAlertPreferences();
  return !isWithinAllowedHours(preferences);
};

const resolveSide = (team?: string) => {
  if (!team) {
    return undefined;
  }
  const normalized = team.toLowerCase();
  if (normalized === "away" || normalized === "home") {
    return normalized as "away" | "home";
  }
  if (normalized === "over" || normalized === "under") {
    return normalized as "over" | "under";
  }
  return undefined;
};

const createMockNotification = () => {
  if (shouldSuppressMockNotifications()) {
    return;
  }
  const alerts = ensureMockAlerts();
  if (!alerts.length) {
    return;
  }
  const rule = pick(alerts);
  const market = rule.market ?? "spread";
  const side = resolveSide(rule.team);
  const snapshot = rule.eventId ? getLatestSnapshot(rule.eventId, market) : undefined;
  const event = rule.eventId
    ? mockState.events.find((item) => item.id === rule.eventId)
    : undefined;
  const line =
    snapshot && market !== "moneyline"
      ? market === "spread"
        ? side === "away"
          ? -snapshot.line
          : snapshot.line
        : snapshot.line
      : undefined;
  const price = snapshot
    ? market === "moneyline"
      ? side === "home"
        ? snapshot.homeOdds
        : snapshot.awayOdds
      : side === "home" || side === "over"
      ? snapshot.homeOdds
      : snapshot.awayOdds
    : undefined;
  const signal = pick([
    "steam",
    "key-number",
    "rlm",
    "momentum",
    "threshold"
  ]);

  const notification: Notification = {
    id: `note-${Date.now()}`,
    eventId: rule.eventId,
    alertRuleId: rule.id,
    ruleType: rule.type,
    firedAt: new Date().toISOString(),
    message: buildNotificationMessage(rule.type),
    market,
    side,
    team: rule.team,
    line,
    price,
    sportsbookId: snapshot?.sportsbookId,
    event: event
      ? { awayTeam: event.awayTeam, homeTeam: event.homeTeam, sport: event.sport }
      : undefined,
    tags: [signal],
    attribution: { signal, confidence: 0.7 + Math.random() * 0.25 },
    isRead: false
  };

  mockState.notifications = [notification, ...mockState.notifications];
};

let mockStarted = false;
let oddsTimeout: ReturnType<typeof setTimeout> | null = null;
let alertTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleOddsUpdate = () => {
  oddsTimeout = setTimeout(() => {
    updateMockOdds();
    scheduleOddsUpdate();
  }, randomBetween(10000, 20000));
};

const scheduleAlertTrigger = () => {
  alertTimeout = setTimeout(() => {
    createMockNotification();
    scheduleAlertTrigger();
  }, randomBetween(25000, 60000));
};

const startMockTimers = () => {
  if (mockStarted || typeof window === "undefined") {
    return;
  }
  mockStarted = true;
  scheduleOddsUpdate();
  scheduleAlertTrigger();
};

export const getApiMode = (): ApiMode => RESOLVED_MODE;

export type CreateAlertRulePayload = Omit<
  AlertRule,
  "id" | "createdAt" | "enabled" | "name"
> & {
  name?: string;
  enabled?: boolean;
};

export type CreateTargetTrackerPayload = Omit<
  TargetTracker,
  "id" | "createdAt" | "lastHitAt" | "nextRearmAt"
> & {
  lastHitAt?: string;
  nextRearmAt?: string;
};

export const fetchSportsbooks = async () => {
  if (ODDS_MODE === "real") {
    return apiFetch<Sportsbook[]>("/sportsbooks");
  }
  startMockTimers();
  await mockDelay();
  return mockState.sportsbooks;
};

export const fetchEvents = async () => {
  if (ODDS_MODE === "real") {
    return apiFetch<Event[]>("/events");
  }
  startMockTimers();
  await mockDelay();
  return mockState.events;
};

export const fetchEvent = async (id: string) => {
  if (ODDS_MODE === "real") {
    return apiFetch<Event>(`/events/${id}`);
  }
  startMockTimers();
  await mockDelay();
  const event = mockState.events.find((item) => item.id === id);
  if (!event) {
    throw new Error("Event not found");
  }
  return event;
};

export const fetchOddsSnapshots = async (eventId?: string) => {
  if (ODDS_MODE === "real") {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    return apiFetch<OddsSnapshot[]>(`/odds${query}`);
  }
  startMockTimers();
  await mockDelay();
  if (!eventId) {
    return mockState.oddsSnapshots;
  }
  return mockState.oddsSnapshots.filter((snapshot) => snapshot.eventId === eventId);
};

export const fetchAlerts = async () => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<AlertRule[]>("/alerts");
  }
  startMockTimers();
  await mockDelay();
  return ensureMockAlerts();
};

export const createAlertRule = async (payload: CreateAlertRulePayload) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<AlertRule>("/alerts", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockAlerts();
  const rule: AlertRule = {
    ...payload,
    id: `rule-${Date.now()}`,
    name: payload.name ?? `${payload.type} alert`,
    createdAt: new Date().toISOString(),
    enabled: payload.enabled ?? true
  } as AlertRule;
  mockState.alerts = [rule, ...existing];
  writeStoredAlerts(mockState.alerts);
  return rule;
};

export const updateAlertRule = async (id: string, updates: Partial<AlertRule>) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<AlertRule>(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockAlerts();
  const index = existing.findIndex((rule) => rule.id === id);
  if (index === -1) {
    throw new Error("Alert rule not found");
  }
  mockState.alerts[index] = { ...existing[index], ...updates };
  writeStoredAlerts(mockState.alerts);
  return mockState.alerts[index];
};

export const deleteAlertRule = async (id: string) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<void>(`/alerts/${id}`, { method: "DELETE" });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockAlerts();
  mockState.alerts = existing.filter((rule) => rule.id !== id);
  writeStoredAlerts(mockState.alerts);
};

export const fetchTargetTrackers = async () => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<TargetTracker[]>("/targets");
  }
  startMockTimers();
  await mockDelay();
  return ensureMockTargets();
};

export const createTargetTracker = async (payload: CreateTargetTrackerPayload) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<TargetTracker>("/targets", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockTargets();
  const tracker: TargetTracker = {
    ...payload,
    id: `target-${Date.now()}`,
    createdAt: new Date().toISOString(),
    lastHitAt: payload.lastHitAt,
    nextRearmAt: payload.nextRearmAt
  };
  mockState.targets = [tracker, ...existing];
  writeStoredTargets(mockState.targets);
  return tracker;
};

export const updateTargetTracker = async (
  id: string,
  updates: Partial<TargetTracker>
) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<TargetTracker>(`/targets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockTargets();
  const index = existing.findIndex((tracker) => tracker.id === id);
  if (index === -1) {
    throw new Error("Target tracker not found");
  }
  mockState.targets[index] = { ...existing[index], ...updates };
  writeStoredTargets(mockState.targets);
  return mockState.targets[index];
};

export const deleteTargetTracker = async (id: string) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<void>(`/targets/${id}`, { method: "DELETE" });
  }
  startMockTimers();
  await mockDelay();
  const existing = ensureMockTargets();
  mockState.targets = existing.filter((tracker) => tracker.id !== id);
  writeStoredTargets(mockState.targets);
};

export const fetchNotifications = async () => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<Notification[]>("/notifications");
  }
  startMockTimers();
  await mockDelay();
  return mockState.notifications;
};

export const updateNotification = async (
  id: string,
  updates: Partial<Notification>
) => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<Notification>(`/notifications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates)
    });
  }
  startMockTimers();
  await mockDelay();
  const index = mockState.notifications.findIndex(
    (notification) => notification.id === id
  );
  if (index === -1) {
    throw new Error("Notification not found");
  }
  mockState.notifications[index] = {
    ...mockState.notifications[index],
    ...updates
  };
  return mockState.notifications[index];
};

export const fetchBetLogs = async () => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<BetLog[]>("/bets");
  }
  startMockTimers();
  await mockDelay();
  return mockState.betLogs;
};

export const fetchCLV = async () => {
  if (RESOLVED_MODE === "real") {
    return apiFetch<CLV[]>("/clv");
  }
  startMockTimers();
  await mockDelay();
  return mockState.clv;
};

export const fetchConsensusLines = async (eventId?: string) => {
  if (ODDS_MODE === "real") {
    const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : "";
    return apiFetch<ConsensusLine[]>(`/consensus${query}`);
  }
  startMockTimers();
  await mockDelay();
  const lines = mockState.events.flatMap((event) => event.consensus ?? []);
  if (!eventId) {
    return lines;
  }
  return lines.filter((line) => line.eventId === eventId);
};

export const fetchSports = async () => {
  if (ODDS_MODE === "real") {
    return apiFetch<Sport[]>("/sports");
  }
  startMockTimers();
  await mockDelay();
  return ["NFL", "NBA", "NCAAB", "NCAAF"];
};

export const getOddsMode = (): ApiMode => ODDS_MODE;
