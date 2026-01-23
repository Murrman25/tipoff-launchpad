import type { DemoEvent, DemoLiveOdds } from "../contracts";
import {
  cloneEvent,
  demoBooks,
  getDemoEvents,
  getLiveMeta,
  setLiveMeta
} from "./demoData";

type DemoRealtimeEvent = "odds:update" | "score:update";

export type DemoRealtimePayload = {
  eventId: string;
  event: DemoEvent;
};

type Handler = (payload: DemoRealtimePayload) => void;

const listeners: Record<DemoRealtimeEvent, Set<Handler>> = {
  "odds:update": new Set(),
  "score:update": new Set()
};

let timer: ReturnType<typeof setTimeout> | null = null;
let started = false;

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const formatClock = (seconds: number) => {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const emit = (event: DemoRealtimeEvent, payload: DemoRealtimePayload) => {
  listeners[event].forEach((handler) => handler(payload));
};

const updateSpreadOdds = (event: DemoEvent) => {
  const delta = pick([-1, -0.5, 0.5, 1]);
  const updatedAt = new Date().toISOString();
  const awayLine = event.liveOdds.spread.away.line + delta;
  const bookKey = pick(demoBooks).key;
  const awayPrice = clamp(
    event.liveOdds.spread.away.price + randomBetween(-8, 8),
    -140,
    -90
  );
  const homePrice = clamp(
    event.liveOdds.spread.home.price + randomBetween(-8, 8),
    -140,
    -90
  );

  event.liveOdds.spread = {
    away: { line: awayLine, price: awayPrice, bookKey, updatedAt },
    home: { line: -awayLine, price: homePrice, bookKey, updatedAt }
  } satisfies DemoLiveOdds["spread"];

  event.lastUpdated = updatedAt;
};

const updateMoneylineOdds = (event: DemoEvent) => {
  const updatedAt = new Date().toISOString();
  const delta = randomBetween(10, 50) * (Math.random() > 0.5 ? 1 : -1);
  const bookKey = pick(demoBooks).key;
  const awayPrice = clamp(
    event.liveOdds.moneyline.away.price + delta,
    -450,
    450
  );
  const homePrice = clamp(
    event.liveOdds.moneyline.home.price - delta,
    -450,
    450
  );

  event.liveOdds.moneyline = {
    away: { price: awayPrice, bookKey, updatedAt },
    home: { price: homePrice, bookKey, updatedAt }
  } satisfies DemoLiveOdds["moneyline"];

  event.lastUpdated = updatedAt;
};

const updateScore = (event: DemoEvent) => {
  if (!event.inPlayState) {
    return;
  }
  const awayDelta = randomBetween(0, 3);
  const homeDelta = randomBetween(0, 3);
  event.inPlayState.score = {
    away: event.inPlayState.score.away + awayDelta,
    home: event.inPlayState.score.home + homeDelta
  };
  event.inPlayState.updatedAt = new Date().toISOString();
  event.lastUpdated = event.inPlayState.updatedAt;
};

const advanceClock = (event: DemoEvent) => {
  if (!event.inPlayState) {
    return;
  }
  const meta = getLiveMeta(event.id);
  if (!meta) {
    return;
  }
  meta.clockSeconds = Math.max(0, meta.clockSeconds - randomBetween(20, 75));

  if (meta.clockSeconds === 0) {
    if (meta.periodIndex < meta.periods.length - 1) {
      meta.periodIndex += 1;
      meta.clockSeconds = meta.periodLength;
    } else {
      meta.clockSeconds = randomBetween(30, 120);
    }
  }

  const clock = formatClock(meta.clockSeconds);
  const period = meta.periods[meta.periodIndex];
  const statusText = `LIVE ${period} ${clock}`;
  const updatedAt = new Date().toISOString();

  event.inPlayState = {
    ...event.inPlayState,
    period,
    clock,
    statusText,
    updatedAt
  };
  event.statusText = statusText;
  event.lastUpdated = updatedAt;

  setLiveMeta(event.id, meta);
};

const tick = () => {
  const liveEvents = getDemoEvents().filter((event) => event.isLive);
  if (!liveEvents.length) {
    return;
  }
  const event = pick(liveEvents);
  let scoreUpdated = false;
  let oddsUpdated = false;

  advanceClock(event);
  if (Math.random() > 0.45) {
    updateScore(event);
    scoreUpdated = true;
  } else {
    scoreUpdated = true;
  }

  if (Math.random() > 0.35) {
    updateSpreadOdds(event);
    oddsUpdated = true;
  }

  if (Math.random() > 0.45) {
    updateMoneylineOdds(event);
    oddsUpdated = true;
  }

  if (scoreUpdated) {
    emit("score:update", { eventId: event.id, event: cloneEvent(event) });
  }
  if (oddsUpdated) {
    emit("odds:update", { eventId: event.id, event: cloneEvent(event) });
  }
};

const schedule = () => {
  timer = setTimeout(() => {
    tick();
    schedule();
  }, randomBetween(5000, 15000));
};

export const startRealtimeSim = () => {
  if (started) {
    return;
  }
  started = true;
  schedule();
};

export const subscribe = (event: DemoRealtimeEvent, handler: Handler) => {
  listeners[event].add(handler);
  startRealtimeSim();
};

export const unsubscribe = (event: DemoRealtimeEvent, handler: Handler) => {
  listeners[event].delete(handler);
};

export const stopRealtimeSim = () => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  started = false;
};
