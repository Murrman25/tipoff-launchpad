import type {
  DemoBookKey,
  DemoEvent,
  DemoInPlayState,
  DemoLiveOdds,
  DemoLiveScore,
  Sport
} from "../contracts";

type SportKey = "NFL" | "NBA" | "NCAAB" | "NCAAF";

type DemoBook = {
  key: DemoBookKey;
  name: string;
  shortName: string;
};

type LiveMeta = {
  periodIndex: number;
  clockSeconds: number;
  periodLength: number;
  periods: string[];
};

const sports: SportKey[] = ["NFL", "NBA", "NCAAB", "NCAAF"];

export const demoBooks: DemoBook[] = [
  { key: "draftkings", name: "DraftKings", shortName: "DK" },
  { key: "fanduel", name: "FanDuel", shortName: "FD" },
  { key: "circa", name: "Circa", shortName: "CIR" },
  { key: "pinnacle", name: "Pinnacle", shortName: "PIN" }
];

const teamPools: Record<SportKey, string[]> = {
  NFL: [
    "Buffalo Bills",
    "Kansas City Chiefs",
    "San Francisco 49ers",
    "Dallas Cowboys",
    "Philadelphia Eagles",
    "Cincinnati Bengals"
  ],
  NBA: [
    "Los Angeles Lakers",
    "Golden State Warriors",
    "Boston Celtics",
    "Miami Heat",
    "Denver Nuggets",
    "Phoenix Suns"
  ],
  NCAAB: [
    "Duke",
    "North Carolina",
    "Kansas",
    "Kentucky",
    "UCLA",
    "Gonzaga"
  ],
  NCAAF: [
    "Alabama",
    "Georgia",
    "Ohio State",
    "Michigan",
    "Oregon",
    "Texas"
  ]
};

const randomBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomHalf = (min: number, max: number) => {
  const steps = Math.floor((max - min) * 2);
  return min + randomBetween(0, steps) * 0.5;
};

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const now = Date.now();
const minutesFromNow = (minutes: number) =>
  new Date(now + minutes * 60 * 1000).toISOString();
const minutesAgo = (minutes: number) =>
  new Date(now - minutes * 60 * 1000).toISOString();

const formatClock = (seconds: number) => {
  const mins = Math.max(0, Math.floor(seconds / 60));
  const secs = Math.max(0, seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const initialScore = (sport: SportKey): DemoLiveScore => {
  switch (sport) {
    case "NFL":
      return {
        away: randomBetween(3, 24),
        home: randomBetween(7, 28)
      };
    case "NBA":
      return {
        away: randomBetween(60, 98),
        home: randomBetween(58, 95)
      };
    case "NCAAB":
      return {
        away: randomBetween(42, 72),
        home: randomBetween(40, 70)
      };
    case "NCAAF":
      return {
        away: randomBetween(10, 31),
        home: randomBetween(14, 35)
      };
    default:
      return { away: randomBetween(40, 80), home: randomBetween(40, 80) };
  }
};

const buildInPlayState = (sport: SportKey, updatedAt: string) => {
  const periods = sport === "NCAAB" ? ["1H", "2H"] : ["Q1", "Q2", "Q3", "Q4"];
  const periodLength =
    sport === "NBA" ? 12 * 60 : sport === "NCAAB" ? 20 * 60 : 15 * 60;
  const periodIndex = randomBetween(0, periods.length - 1);
  const clockSeconds = randomBetween(Math.floor(periodLength * 0.3), periodLength);
  const clock = formatClock(clockSeconds);
  const period = periods[periodIndex];
  const statusText = `LIVE ${period} ${clock}`;

  const inPlayState: DemoInPlayState = {
    live: true,
    period,
    clock,
    statusText,
    score: initialScore(sport),
    updatedAt
  };

  const meta: LiveMeta = { periodIndex, clockSeconds, periodLength, periods };

  return { inPlayState, meta };
};

const buildSpreadOdds = (awayLine: number, updatedAt: string): DemoLiveOdds["spread"] => {
  const bookKey = pick(demoBooks).key;
  const awayPrice = -110 + randomBetween(-10, 10);
  const homePrice = -110 + randomBetween(-10, 10);

  return {
    away: {
      line: awayLine,
      price: clamp(awayPrice, -140, -90),
      bookKey,
      updatedAt
    },
    home: {
      line: -awayLine,
      price: clamp(homePrice, -140, -90),
      bookKey,
      updatedAt
    }
  };
};

const buildMoneylineOdds = (
  awayLine: number,
  updatedAt: string
): DemoLiveOdds["moneyline"] => {
  const bookKey = pick(demoBooks).key;
  let awayPrice = 120;
  let homePrice = -140;

  if (awayLine > 0) {
    awayPrice = randomBetween(140, 260);
    homePrice = -randomBetween(160, 280);
  } else if (awayLine < 0) {
    awayPrice = -randomBetween(150, 260);
    homePrice = randomBetween(130, 240);
  } else {
    awayPrice = -randomBetween(120, 105);
    homePrice = -randomBetween(120, 105);
  }

  return {
    away: {
      price: clamp(awayPrice, -450, 450),
      bookKey,
      updatedAt
    },
    home: {
      price: clamp(homePrice, -450, 450),
      bookKey,
      updatedAt
    }
  };
};

const buildLiveOdds = (awayLine: number, updatedAt: string): DemoLiveOdds => ({
  spread: buildSpreadOdds(awayLine, updatedAt),
  moneyline: buildMoneylineOdds(awayLine, updatedAt)
});

const buildEvent = (
  sport: SportKey,
  awayTeam: string,
  homeTeam: string,
  isLive: boolean,
  sequence: number
): { event: DemoEvent; meta?: LiveMeta } => {
  const updatedAt = new Date().toISOString();
  const awayLine = randomHalf(-7, 7);
  const liveOdds = buildLiveOdds(awayLine, updatedAt);

  if (!isLive) {
    return {
      event: {
        id: `demo-${sport.toLowerCase()}-${sequence}`,
        sport,
        awayTeam,
        homeTeam,
        startTime: minutesFromNow(randomBetween(25, 300)),
        isLive: false,
        statusText: "PREGAME",
        lastUpdated: updatedAt,
        liveOdds
      }
    };
  }

  const { inPlayState, meta } = buildInPlayState(sport, updatedAt);

  return {
    event: {
      id: `demo-${sport.toLowerCase()}-${sequence}`,
      sport,
      awayTeam,
      homeTeam,
      startTime: minutesAgo(randomBetween(10, 120)),
      isLive: true,
      statusText: inPlayState.statusText,
      inPlayState,
      lastUpdated: updatedAt,
      liveOdds
    },
    meta
  };
};

const buildEvents = () => {
  const events: DemoEvent[] = [];
  const metaMap = new Map<string, LiveMeta>();
  let sequence = 1;

  sports.forEach((sport) => {
    const teams = [...teamPools[sport]];
    while (teams.length >= 2) {
      const awayTeam = teams.shift()!;
      const homeTeam = teams.pop()!;
      const isLive = events.length % 2 === 0;
      const { event, meta } = buildEvent(sport, awayTeam, homeTeam, isLive, sequence);
      events.push(event);
      if (meta) {
        metaMap.set(event.id, meta);
      }
      sequence += 1;
    }
  });

  return { events, metaMap };
};

const { events, metaMap } = buildEvents();

export const demoStore = {
  events
};

const liveMeta = metaMap;

export const getLiveMeta = (eventId: string) => liveMeta.get(eventId);

export const setLiveMeta = (eventId: string, meta: LiveMeta) => {
  liveMeta.set(eventId, meta);
};

export const cloneEvent = (event: DemoEvent) =>
  JSON.parse(JSON.stringify(event)) as DemoEvent;

export const cloneEvents = (items: DemoEvent[]) =>
  items.map((item) => cloneEvent(item));

export const getDemoEvents = () => demoStore.events;

export const getDemoEvent = (eventId: string) =>
  demoStore.events.find((event) => event.id === eventId) ?? null;
