import type { DemoEvent, DemoLiveOdds } from "../lib/contracts";

const now = () => new Date().toISOString();

export const mockLiveEvent: DemoEvent = {
  id: "demo-live-1",
  awayTeam: "Lakers",
  homeTeam: "Celtics",
  sport: "NBA",
  startTime: new Date(Date.now() - 3600000).toISOString(),
  isLive: true,
  statusText: "Q3 4:32",
  lastUpdated: now(),
  inPlayState: {
    live: true,
    period: "Q3",
    clock: "4:32",
    score: { away: 78, home: 82 },
    updatedAt: now(),
  },
  liveOdds: {
    spread: {
      away: { line: 2.5, price: -110, bookKey: "consensus", updatedAt: now() },
      home: { line: -2.5, price: -110, bookKey: "consensus", updatedAt: now() },
    },
    moneyline: {
      away: { price: 125, bookKey: "consensus", updatedAt: now() },
      home: { price: -145, bookKey: "consensus", updatedAt: now() },
    },
  },
};

export const mockPregameEvent: DemoEvent = {
  id: "demo-pregame-1",
  awayTeam: "Chiefs",
  homeTeam: "Ravens",
  sport: "NFL",
  startTime: new Date(Date.now() + 7200000).toISOString(),
  isLive: false,
  statusText: "Pregame",
  lastUpdated: now(),
  liveOdds: {
    spread: {
      away: { line: -3, price: -105, bookKey: "consensus", updatedAt: now() },
      home: { line: 3, price: -115, bookKey: "consensus", updatedAt: now() },
    },
    moneyline: {
      away: { price: -150, bookKey: "consensus", updatedAt: now() },
      home: { price: 130, bookKey: "consensus", updatedAt: now() },
    },
  },
};

export const mockFinalEvent: DemoEvent = {
  id: "demo-final-1",
  awayTeam: "Duke",
  homeTeam: "UNC",
  sport: "NCAAB",
  startTime: new Date(Date.now() - 10800000).toISOString(),
  isLive: false,
  statusText: "Final",
  lastUpdated: now(),
  inPlayState: {
    live: false,
    period: "Final",
    score: { away: 72, home: 68 },
    updatedAt: now(),
  },
  liveOdds: {
    spread: {
      away: { line: -4, price: -110, bookKey: "consensus", updatedAt: now() },
      home: { line: 4, price: -110, bookKey: "consensus", updatedAt: now() },
    },
    moneyline: {
      away: { price: -180, bookKey: "consensus", updatedAt: now() },
      home: { price: 155, bookKey: "consensus", updatedAt: now() },
    },
  },
};

export const mockOdds: DemoLiveOdds = {
  spread: {
    away: { line: -3.5, price: -110, bookKey: "consensus", updatedAt: now() },
    home: { line: 3.5, price: -110, bookKey: "consensus", updatedAt: now() },
  },
  moneyline: {
    away: { price: -165, bookKey: "consensus", updatedAt: now() },
    home: { price: 145, bookKey: "consensus", updatedAt: now() },
  },
};

export const mockHeatmapData = [
  { label: "Spread", delta: 1.5, direction: "up" as const },
  { label: "Total", delta: -2, direction: "down" as const },
  { label: "ML Away", delta: 15, direction: "up" as const },
  { label: "ML Home", delta: -10, direction: "down" as const },
];
