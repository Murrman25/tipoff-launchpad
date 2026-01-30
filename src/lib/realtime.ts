import { io, type Socket } from "socket.io-client";
import type { Notification, OddsSnapshot } from "./contracts";
import { isWithinAllowedHours, loadAlertPreferences } from "./preferences";

export type RealtimeEventMap = {
  "odds:update": OddsSnapshot;
  "alert:triggered": Notification;
};

type EventKey = keyof RealtimeEventMap;
type Handler<K extends EventKey> = (payload: RealtimeEventMap[K]) => void;

export type RealtimeClient = {
  connect: () => void;
  disconnect: () => void;
  on: <K extends EventKey>(event: K, handler: Handler<K>) => void;
  off: <K extends EventKey>(event: K, handler: Handler<K>) => void;
};

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "";
const RESOLVED_MODE =
  process.env.NEXT_PUBLIC_API_MODE === "real" ? "real" : "mock";

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const eventIds = ["v2-nba-042", "v2-ncaab-110", "v2-nfl-001", "v2-ncaaf-222"];
const markets = ["spread", "total", "moneyline"] as const;
const sportsbookIds = ["dk", "fd", "mgm", "caesars"];

const attributionSignals = [
  "steam",
  "key-number",
  "rlm",
  "momentum",
  "threshold"
] as const;

const allowAlertEmit = () => {
  if (typeof window === "undefined") {
    return true;
  }
  const preferences = loadAlertPreferences();
  return isWithinAllowedHours(preferences);
};

const buildOddsUpdate = (): OddsSnapshot => {
  const market = pick([...markets]);
  const timestamp = new Date().toISOString();
  const baseLine = market === "total" ? 220.5 : market === "spread" ? -3.5 : 0;
  const lineDelta = market === "moneyline" ? 0 : Math.random() > 0.5 ? 0.5 : -0.5;
  const homeOdds = market === "moneyline" ? -160 + randomBetween(-15, 15) : -110;
  const awayOdds = market === "moneyline" ? 140 + randomBetween(-15, 15) : -110;
  const tags: string[] =
    Math.random() > 0.7 ? [pick([...attributionSignals])] : ["movement"];

  return {
    id: `odds-${Date.now()}`,
    eventId: pick(eventIds),
    market,
    line: baseLine + lineDelta,
    homeOdds,
    awayOdds,
    timestamp,
    isLive: true,
    tags
  };
};

const buildAlertTriggered = (): Notification => {
  const signal = pick([...attributionSignals]);
  const market = pick([...markets]);
  const side: "over" | "under" | "home" | "away" =
    market === "total"
      ? pick(["over", "under"] as const)
      : pick(["home", "away"] as const);
  const baseLine = market === "total" ? 220.5 : market === "spread" ? -3.5 : 0;
  const lineDelta = market === "moneyline" ? 0 : Math.random() > 0.5 ? 0.5 : -0.5;
  const line = market === "moneyline" ? undefined : baseLine + lineDelta;
  const price =
    market === "moneyline"
      ? side === "home"
        ? -160 + randomBetween(-20, 20)
        : 140 + randomBetween(-20, 20)
      : side === "home" || side === "over"
      ? -110
      : -110;
  return {
    id: `note-${Date.now()}`,
    eventId: pick(eventIds),
    alertRuleId: `rule-${randomBetween(1, 6)}`,
    ruleType: pick([
      "THRESHOLD_AT",
      "KEY_NUMBER_PROXIMITY",
      "BUYBACK",
      "LIVE_MOMENTUM",
      "RLM",
      "STEAM"
    ] as const),
    firedAt: new Date().toISOString(),
    message: `${signal} signal triggered`,
    market,
    side,
    line,
    price,
    sportsbookId: pick(sportsbookIds),
    tags: [signal],
    attribution: { signal: signal as "steam" | "key-number" | "rlm" | "momentum" | "threshold", confidence: 0.7 + Math.random() * 0.25 },
    isRead: false
  };
};

class MockRealtimeClient implements RealtimeClient {
  private handlers: Partial<{
    [K in EventKey]: Set<Handler<K>>;
  }> = {};
  private connected = false;
  private oddsTimeout: ReturnType<typeof setTimeout> | null = null;
  private alertTimeout: ReturnType<typeof setTimeout> | null = null;

  connect() {
    if (this.connected) {
      return;
    }
    this.connected = true;
    this.scheduleOdds();
    this.scheduleAlert();
  }

  disconnect() {
    this.connected = false;
    if (this.oddsTimeout) {
      clearTimeout(this.oddsTimeout);
      this.oddsTimeout = null;
    }
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
  }

  on<K extends EventKey>(event: K, handler: Handler<K>) {
    if (!this.handlers[event]) {
      (this.handlers as Record<K, Set<Handler<K>>>)[event] = new Set();
    }
    (this.handlers[event] as Set<Handler<K>>)?.add(handler);
  }

  off<K extends EventKey>(event: K, handler: Handler<K>) {
    (this.handlers[event] as Set<Handler<K>>)?.delete(handler);
  }

  private emit<K extends EventKey>(event: K, payload: RealtimeEventMap[K]) {
    (this.handlers[event] as Set<Handler<K>> | undefined)?.forEach((handler) => {
      handler(payload);
    });
  }

  private scheduleOdds() {
    this.oddsTimeout = setTimeout(() => {
      if (!this.connected) {
        return;
      }
      this.emit("odds:update", buildOddsUpdate());
      this.scheduleOdds();
    }, randomBetween(10000, 20000));
  }

  private scheduleAlert() {
    this.alertTimeout = setTimeout(() => {
      if (!this.connected) {
        return;
      }
      if (allowAlertEmit()) {
        this.emit("alert:triggered", buildAlertTriggered());
      }
      this.scheduleAlert();
    }, randomBetween(25000, 60000));
  }
}

const createRealClient = (): RealtimeClient => {
  let socket: Socket | null = null;

  const ensureSocket = () => {
    if (!socket) {
      socket = io(WS_BASE_URL, { autoConnect: false, transports: ["websocket"] });
    }
    return socket;
  };

  return {
    connect() {
      ensureSocket().connect();
    },
    disconnect() {
      socket?.disconnect();
    },
    on(event, handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ensureSocket().on(event, handler as any);
    },
    off(event, handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket?.off(event, handler as any);
    }
  };
};

export const getRealtimeMode = (): "real" | "mock" => RESOLVED_MODE;

export const createRealtimeClient = (): RealtimeClient =>
  RESOLVED_MODE === "real" ? createRealClient() : new MockRealtimeClient();
