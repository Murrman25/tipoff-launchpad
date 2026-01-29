import type { ConsensusLine, Event, OddsSnapshot, Sport, Sportsbook } from "./contracts";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const ODDS_API_KEY = process.env.ODDS_API_KEY;

const SPORTS: Array<{ key: string; label: Sport }> = [
  { key: "americanfootball_nfl", label: "NFL" },
  { key: "basketball_nba", label: "NBA" },
  { key: "basketball_ncaab", label: "NCAAB" },
  { key: "americanfootball_ncaaf", label: "NCAAF" }
];

type OddsApiOutcome = {
  name: string;
  price: number;
  point?: number | null;
};

type OddsApiMarket = {
  key: string;
  last_update?: string;
  outcomes: OddsApiOutcome[];
};

type OddsApiBookmaker = {
  key: string;
  title: string;
  last_update?: string;
  markets?: OddsApiMarket[];
};

type OddsApiEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsApiBookmaker[];
};

type ScoresApiScore = {
  name: string;
  score: string | number;
};

type ScoresApiEvent = {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  completed: boolean;
  scores?: ScoresApiScore[] | null;
  last_update?: string;
};

type OddsData = {
  events: Event[];
  snapshots: OddsSnapshot[];
  sportsbooks: Sportsbook[];
  consensus: ConsensusLine[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const STALE_TTL_MS = 30 * 60 * 1000;
const REQUEST_SPACING_MS = 600;
let cache: { fetchedAt: number; data: OddsData } | null = null;
let inflight: Promise<OddsData> | null = null;

const ensureApiKey = () => {
  if (!ODDS_API_KEY) {
    throw new Error("ODDS_API_KEY is not set.");
  }
  return ODDS_API_KEY;
};

const buildUrl = (path: string, params: Record<string, string>) => {
  const url = new URL(`${ODDS_API_BASE}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
};

const fetchJson = async <T>(url: URL): Promise<T> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Odds API request failed: ${response.status}`);
  }
  return (await response.json()) as T;
};

const fetchOddsForSport = async (sportKey: string) => {
  const apiKey = ensureApiKey();
  const url = buildUrl(`/sports/${sportKey}/odds`, {
    apiKey,
    regions: "us",
    markets: "h2h,spreads,totals",
    oddsFormat: "american",
    dateFormat: "iso"
  });
  return fetchJson<OddsApiEvent[]>(url);
};

const fetchScoresForSport = async (sportKey: string) => {
  const apiKey = ensureApiKey();
  const url = buildUrl(`/sports/${sportKey}/scores`, {
    apiKey,
    dateFormat: "iso",
    daysFrom: "1"
  });
  return fetchJson<ScoresApiEvent[]>(url);
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getScoreValue = (scores: ScoresApiScore[] | null | undefined, name: string) => {
  if (!scores) {
    return undefined;
  }
  const entry = scores.find((item) => item.name === name);
  return entry ? toNumber(entry.score) : undefined;
};

const latestTimestamp = (bookmakers: OddsApiBookmaker[] | undefined) => {
  if (!bookmakers?.length) {
    return undefined;
  }
  const timestamps: string[] = [];
  bookmakers.forEach((book) => {
    if (book.last_update) {
      timestamps.push(book.last_update);
    }
    book.markets?.forEach((market) => {
      if (market.last_update) {
        timestamps.push(market.last_update);
      }
    });
  });
  if (!timestamps.length) {
    return undefined;
  }
  return timestamps.sort().slice(-1)[0];
};

const marketToType = (key: string) => {
  if (key === "h2h") {
    return "moneyline";
  }
  if (key === "spreads") {
    return "spread";
  }
  if (key === "totals") {
    return "total";
  }
  return null;
};

export const getOddsData = async (): Promise<OddsData> => {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  if (inflight) {
    return inflight;
  }

  inflight = (async () => {
    try {
      const oddsResults: Array<{ sport: (typeof SPORTS)[number]; events: OddsApiEvent[] }> = [];
      for (let i = 0; i < SPORTS.length; i += 1) {
        const sport = SPORTS[i];
        const events = await fetchOddsForSport(sport.key);
        oddsResults.push({ sport, events });
        if (i < SPORTS.length - 1) {
          await sleep(REQUEST_SPACING_MS);
        }
      }

      const scoreResults: Array<{
        sport: (typeof SPORTS)[number];
        events: ScoresApiEvent[];
      }> = [];
      for (let i = 0; i < SPORTS.length; i += 1) {
        const sport = SPORTS[i];
        const events = await fetchScoresForSport(sport.key);
        scoreResults.push({ sport, events });
        if (i < SPORTS.length - 1) {
          await sleep(REQUEST_SPACING_MS);
        }
      }

      const scoresMap = new Map<string, ScoresApiEvent>();
      scoreResults.forEach(({ events }) => {
        events.forEach((event) => {
          scoresMap.set(event.id, event);
        });
      });

      const sportsbooksMap = new Map<string, Sportsbook>();
      const snapshots: OddsSnapshot[] = [];
      const consensusMap = new Map<
        string,
        { sumLine: number; sumHome: number; sumAway: number; count: number; sources: Set<string> }
      >();

      const addConsensus = (snapshot: OddsSnapshot) => {
        const key = `${snapshot.eventId}:${snapshot.market}`;
        const entry =
          consensusMap.get(key) ?? {
            sumLine: 0,
            sumHome: 0,
            sumAway: 0,
            count: 0,
            sources: new Set<string>()
          };
        entry.sumLine += snapshot.line;
        entry.sumHome += snapshot.homeOdds;
        entry.sumAway += snapshot.awayOdds;
        entry.count += 1;
        if (snapshot.sportsbookId) {
          entry.sources.add(snapshot.sportsbookId);
        }
        consensusMap.set(key, entry);
      };

      const events: Event[] = [];

      oddsResults.forEach(({ sport, events: oddsEvents }) => {
        oddsEvents.forEach((event) => {
          const scoreEntry = scoresMap.get(event.id);
          const isLive = Boolean(scoreEntry && !scoreEntry.completed);
          const statusText = scoreEntry
            ? scoreEntry.completed
              ? "FINAL"
              : "LIVE"
            : "PREGAME";
          const score = scoreEntry?.scores
            ? {
                away: getScoreValue(scoreEntry.scores, event.away_team) ?? 0,
                home: getScoreValue(scoreEntry.scores, event.home_team) ?? 0
              }
            : undefined;

          const updatedAt =
            scoreEntry?.last_update ??
            latestTimestamp(event.bookmakers) ??
            new Date().toISOString();

          events.push({
            id: event.id,
            sport: sport.label,
            awayTeam: event.away_team,
            homeTeam: event.home_team,
            startTime: event.commence_time,
            isLive,
            statusText,
            inPlayState: scoreEntry
              ? {
                  statusText,
                  lastUpdate: scoreEntry.last_update
                }
              : undefined,
            score,
            lastUpdated: updatedAt
          });

          event.bookmakers?.forEach((book) => {
            if (!sportsbooksMap.has(book.key)) {
              sportsbooksMap.set(book.key, {
                id: book.key,
                name: book.title,
                shortName: book.title.slice(0, 3).toUpperCase(),
                region: "US"
              });
            }

            book.markets?.forEach((market) => {
              const marketType = marketToType(market.key);
              if (!marketType) {
                return;
              }
              const timestamp =
                market.last_update ?? book.last_update ?? new Date().toISOString();

              if (market.key === "totals") {
                const over = market.outcomes.find((outcome) => outcome.name === "Over");
                const under = market.outcomes.find(
                  (outcome) => outcome.name === "Under"
                );
                if (!over || !under || over.point === undefined || over.point === null) {
                  return;
                }
                const snapshot: OddsSnapshot = {
                  id: `odds-${event.id}-${book.key}-${market.key}-${timestamp}`,
                  eventId: event.id,
                  market: marketType,
                  line: Number(over.point),
                  homeOdds: over.price,
                  awayOdds: under.price,
                  timestamp,
                  sportsbookId: book.key,
                  isLive
                };
                snapshots.push(snapshot);
                addConsensus(snapshot);
                return;
              }

              if (market.key === "h2h") {
                const home = market.outcomes.find(
                  (outcome) => outcome.name === event.home_team
                );
                const away = market.outcomes.find(
                  (outcome) => outcome.name === event.away_team
                );
                if (!home || !away) {
                  return;
                }
                const snapshot: OddsSnapshot = {
                  id: `odds-${event.id}-${book.key}-${market.key}-${timestamp}`,
                  eventId: event.id,
                  market: marketType,
                  line: 0,
                  homeOdds: home.price,
                  awayOdds: away.price,
                  timestamp,
                  sportsbookId: book.key,
                  isLive
                };
                snapshots.push(snapshot);
                addConsensus(snapshot);
                return;
              }

              if (market.key === "spreads") {
                const home = market.outcomes.find(
                  (outcome) => outcome.name === event.home_team
                );
                const away = market.outcomes.find(
                  (outcome) => outcome.name === event.away_team
                );
                if (
                  !home ||
                  !away ||
                  home.point === undefined ||
                  home.point === null
                ) {
                  return;
                }
                const snapshot: OddsSnapshot = {
                  id: `odds-${event.id}-${book.key}-${market.key}-${timestamp}`,
                  eventId: event.id,
                  market: marketType,
                  line: Number(home.point),
                  homeOdds: home.price,
                  awayOdds: away.price,
                  timestamp,
                  sportsbookId: book.key,
                  isLive
                };
                snapshots.push(snapshot);
                addConsensus(snapshot);
              }
            });
          });
        });
      });

      const consensus: ConsensusLine[] = [];
      consensusMap.forEach((entry, key) => {
        if (entry.count === 0) {
          return;
        }
        const [eventId, market] = key.split(":");
        consensus.push({
          eventId,
          market: market as ConsensusLine["market"],
          line: entry.sumLine / entry.count,
          homeOdds: entry.sumHome / entry.count,
          awayOdds: entry.sumAway / entry.count,
          timestamp: new Date().toISOString(),
          sources: Array.from(entry.sources)
        });
      });

      const data: OddsData = {
        events,
        snapshots,
        sportsbooks: Array.from(sportsbooksMap.values()),
        consensus
      };

      cache = { fetchedAt: Date.now(), data };
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const cacheAge = cache ? now - cache.fetchedAt : null;
      const canUseStale = cacheAge !== null && cacheAge < STALE_TTL_MS;
      if (canUseStale) {
        console.warn("Odds API error, serving cached data:", message);
        return cache!.data;
      }
      throw error;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};
