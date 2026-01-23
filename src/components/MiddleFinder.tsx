"use client";

import { useEffect, useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import { formatLocalTime } from "@/lib/format";
import { fetchEvents, fetchOddsSnapshots, getApiMode } from "@/src/lib/api";
import {
  loadBets,
  subscribeBets,
  type BetEntry
} from "@/src/lib/betsStore";
import type { BetSide, Event, MarketType, OddsSnapshot } from "@/src/lib/contracts";

type MiddleFinderProps = {
  defaultEventId?: string;
};

type MiddleAlertState = Set<string>;

const ALERT_STORAGE_KEY = "tipoff.middle.alerts";

const formatSigned = (value: number, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatNumber = (value: number, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
};

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
};

const resolveSideFromBet = (bet: BetEntry, event?: Event): BetSide | undefined => {
  if (bet.side) {
    return bet.side as BetSide;
  }
  if (bet.market === "total" && bet.team) {
    const normalized = bet.team.toLowerCase();
    if (normalized === "over" || normalized === "under") {
      return normalized as BetSide;
    }
  }
  if (event && bet.team) {
    if (bet.team === event.awayTeam) {
      return "away";
    }
    if (bet.team === event.homeTeam) {
      return "home";
    }
  }
  return undefined;
};

const resolveSideLabel = (side: BetSide, event?: Event, market?: MarketType) => {
  if (market === "total") {
    return side === "under" ? "Under" : "Over";
  }
  if (!event) {
    return side === "away" ? "Away" : "Home";
  }
  return side === "away" ? event.awayTeam : event.homeTeam;
};

const getOppositeSide = (side: BetSide, market: MarketType): BetSide => {
  if (market === "total") {
    return side === "under" ? "over" : "under";
  }
  return side === "home" ? "away" : "home";
};

const getSideOdds = (snapshot: OddsSnapshot, market: MarketType, side: BetSide) => {
  if (market === "total") {
    return side === "over" ? snapshot.homeOdds : snapshot.awayOdds;
  }
  return side === "home" ? snapshot.homeOdds : snapshot.awayOdds;
};

const getLineForSide = (snapshot: OddsSnapshot, market: MarketType, side: BetSide) => {
  if (market === "total") {
    return snapshot.line;
  }
  if (market === "spread") {
    return side === "home" ? snapshot.line : -snapshot.line;
  }
  return 0;
};

const loadAlerts = (): MiddleAlertState => {
  if (typeof window === "undefined") {
    return new Set();
  }
  try {
    const stored = window.localStorage.getItem(ALERT_STORAGE_KEY);
    if (!stored) {
      return new Set();
    }
    const parsed = JSON.parse(stored) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
};

const saveAlerts = (alerts: MiddleAlertState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify(Array.from(alerts)));
};

const isPregameBet = (bet: BetEntry, event: Event) => {
  if (!bet.placedAt || !event.startTime) {
    return true;
  }
  return new Date(bet.placedAt).getTime() < new Date(event.startTime).getTime();
};

export default function MiddleFinder({ defaultEventId }: MiddleFinderProps) {
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>(defaultEventId ?? "all");
  const [alertIds, setAlertIds] = useState<MiddleAlertState>(new Set());

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  useEffect(() => {
    setBets(loadBets());
    return subscribeBets(setBets);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventData, snapshotData] = await Promise.all([
          fetchEvents(),
          fetchOddsSnapshots()
        ]);
        setEvents(eventData);
        setSnapshots(snapshotData);
      } catch (err) {
        setEvents([]);
        setSnapshots([]);
        setError(err instanceof Error ? err.message : "Unable to load odds.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setAlertIds(loadAlerts());
  }, []);

  useEffect(() => {
    if (defaultEventId) {
      setEventFilter(defaultEventId);
    }
  }, [defaultEventId]);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, eventItem) => {
      acc[eventItem.id] = eventItem;
      return acc;
    }, {});
  }, [events]);

  const latestByEventMarket = useMemo(() => {
    return snapshots.reduce<Record<string, Partial<Record<MarketType, OddsSnapshot>>>>(
      (acc, snapshot) => {
        if (!acc[snapshot.eventId]) {
          acc[snapshot.eventId] = {};
        }
        const existing = acc[snapshot.eventId][snapshot.market];
        if (!existing) {
          acc[snapshot.eventId][snapshot.market] = snapshot;
          return acc;
        }
        const existingLive = existing.isLive;
        if (snapshot.isLive && !existingLive) {
          acc[snapshot.eventId][snapshot.market] = snapshot;
          return acc;
        }
        if (snapshot.isLive === existingLive) {
          if (
            new Date(snapshot.timestamp).getTime() >
            new Date(existing.timestamp).getTime()
          ) {
            acc[snapshot.eventId][snapshot.market] = snapshot;
          }
        }
        return acc;
      },
      {}
    );
  }, [snapshots]);

  const eventOptions = useMemo(() => {
    return [
      { id: "all", label: "All events" },
      ...events.map((eventItem) => ({
        id: eventItem.id,
        label: `${eventItem.awayTeam} @ ${eventItem.homeTeam}`
      }))
    ];
  }, [events]);

  const middleCandidates = useMemo(() => {
    return bets
      .map((bet) => {
        if (!bet.eventId) {
          return null;
        }
        const event = eventMap[bet.eventId];
        if (!event) {
          return null;
        }
        if (!event.isLive) {
          return null;
        }
        if (!isPregameBet(bet, event)) {
          return null;
        }
        if (eventFilter !== "all" && event.id !== eventFilter) {
          return null;
        }
        if (bet.market !== "spread" && bet.market !== "total") {
          return null;
        }
        return { bet, event };
      })
      .filter((item): item is { bet: BetEntry; event: Event } => Boolean(item));
  }, [bets, eventFilter, eventMap]);

  const toggleAlert = (betId: string) => {
    setAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(betId)) {
        next.delete(betId);
      } else {
        next.add(betId);
      }
      saveAlerts(next);
      return next;
    });
  };

  if (loading && !middleCandidates.length) {
    return <div className="notice">Loading middle data...</div>;
  }

  if (error) {
    return <div className="notice error">{error}</div>;
  }

  return (
    <div className="tool-stack">
      {isMock ? (
        <DemoBanner message="Middle Finder uses mock live lines until the backend is connected." />
      ) : null}

      <div className="tool-row">
        <div className="filter-block">
          <label className="label" htmlFor="middle-event-filter">
            Event filter
          </label>
          <select
            id="middle-event-filter"
            className="select"
            value={eventFilter}
            onChange={(eventItem) => setEventFilter(eventItem.target.value)}
          >
            {eventOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="tool-card">
          <div className="label">Scope</div>
          <div className="tool-value">Pregame bets on live events</div>
          <div className="meta">Spread and total markets only.</div>
        </div>
      </div>

      {middleCandidates.length === 0 ? (
        <div className="notice">No live middle opportunities yet.</div>
      ) : (
        <div className="middle-list">
          {middleCandidates.map(({ bet, event }) => {
            const snapshot = latestByEventMarket[event.id]?.[bet.market];
            const betSide = resolveSideFromBet(bet, event);
            const isAlerted = alertIds.has(bet.id);

            if (!snapshot || !betSide || bet.line === undefined) {
              return (
                <div key={bet.id} className="middle-card">
                  <div className="middle-header">
                    <div>
                      <strong>
                        {event.awayTeam} @ {event.homeTeam}
                      </strong>
                      <div className="meta">{bet.market.toUpperCase()}</div>
                    </div>
                    <span className="middle-status pending">Waiting on live line</span>
                  </div>
                  <div className="meta">
                    Missing live line or bet detail to calculate a middle window.
                  </div>
                </div>
              );
            }

            const oppositeSide = getOppositeSide(betSide, bet.market);
            const oppositeLine = getLineForSide(snapshot, bet.market, oppositeSide);
            const oppositeOdds = getSideOdds(snapshot, bet.market, oppositeSide);

            let middleOpen = false;
            let rangeLow = 0;
            let rangeHigh = 0;
            let targetLine: number | null = null;

            if (bet.market === "total") {
              if (betSide === "over") {
                middleOpen = oppositeLine - bet.line > 0.25;
                rangeLow = bet.line;
                rangeHigh = oppositeLine;
                if (!middleOpen) {
                  targetLine = bet.line + 0.5;
                }
              } else if (betSide === "under") {
                middleOpen = bet.line - oppositeLine > 0.25;
                rangeLow = oppositeLine;
                rangeHigh = bet.line;
                if (!middleOpen) {
                  targetLine = bet.line - 0.5;
                }
              }
            } else if (bet.market === "spread") {
              const betLineAbs = Math.abs(bet.line);
              const oppositeLineAbs = Math.abs(oppositeLine);
              if (betSide === "home") {
                middleOpen = oppositeLineAbs - betLineAbs > 0.25;
                rangeLow = betLineAbs;
                rangeHigh = oppositeLineAbs;
                if (!middleOpen) {
                  targetLine = betLineAbs + 0.5;
                }
              } else if (betSide === "away") {
                middleOpen = betLineAbs - oppositeLineAbs > 0.25;
                rangeLow = oppositeLineAbs;
                rangeHigh = betLineAbs;
                if (!middleOpen) {
                  targetLine = betLineAbs - 0.5;
                }
              }
            }

            const betSideLabel = resolveSideLabel(betSide, event, bet.market);
            const hedgeSideLabel = resolveSideLabel(oppositeSide, event, bet.market);
            const betLineLabel =
              bet.market === "total" ? formatNumber(bet.line, 1) : formatSigned(bet.line, 1);
            const hedgeLineLabel =
              bet.market === "total"
                ? formatNumber(oppositeLine, 1)
                : formatSigned(oppositeLine, 1);

            const rangeLabel =
              bet.market === "total"
                ? `${formatNumber(rangeLow, 1)} to ${formatNumber(rangeHigh, 1)}`
                : `${formatSigned(rangeLow, 1)} to ${formatSigned(rangeHigh, 1)}`;

            const targetLabel =
              targetLine === null
                ? "--"
                : bet.market === "total"
                ? formatNumber(targetLine, 1)
                : betSide === "home"
                ? formatSigned(targetLine, 1)
                : formatSigned(-targetLine, 1);

            return (
              <div key={bet.id} className="middle-card">
                <div className="middle-header">
                  <div>
                    <strong>
                      {event.awayTeam} @ {event.homeTeam}
                    </strong>
                    <div className="meta">{bet.market.toUpperCase()} middle scan</div>
                  </div>
                  <span className={`middle-status ${middleOpen ? "open" : "pending"}`}>
                    {middleOpen ? "Middle open" : "No middle yet"}
                  </span>
                </div>

                <div className="middle-grid">
                  <div>
                    <div className="label">Pregame bet</div>
                    <div className="tool-value">
                      {betSideLabel} {betLineLabel} ({formatOdds(bet.odds)})
                    </div>
                    <div className="meta">Logged before kickoff.</div>
                  </div>
                  <div>
                    <div className="label">Current hedge line</div>
                    <div className="tool-value">
                      {hedgeSideLabel} {hedgeLineLabel} ({formatOdds(oppositeOdds)})
                    </div>
                    <div className="meta">
                      Updated {formatLocalTime(snapshot.timestamp)}
                    </div>
                  </div>
                </div>

                {middleOpen ? (
                  <div className="middle-range">
                    Middle range: {rangeLabel}
                    {bet.market === "total" ? " total" : " points"}
                  </div>
                ) : (
                  <div className="meta">
                    Need {hedgeSideLabel} to reach {targetLabel} to open a middle.
                  </div>
                )}

                <div className="middle-actions">
                  <button
                    className={`btn ${isAlerted ? "btn-primary" : "btn-ghost"}`}
                    type="button"
                    onClick={() => toggleAlert(bet.id)}
                  >
                    {isAlerted ? "Middle alert set" : "Notify me if middle appears"}
                  </button>
                  <span className="meta">
                    {middleOpen
                      ? "Consider hedging now to capture the window."
                      : "We will watch this line in mock mode."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



