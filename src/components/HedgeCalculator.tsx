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

type HedgeCalculatorProps = {
  defaultEventId?: string;
  defaultBetId?: string;
};

type HedgeOutcome = "lock" | "reduce";

const marketOptions: MarketType[] = ["spread", "moneyline", "total"];
const outcomeOptions: { id: HedgeOutcome; label: string; note: string }[] = [
  {
    id: "lock",
    label: "Lock profit",
    note: "Balances both outcomes for the tightest result."
  },
  {
    id: "reduce",
    label: "Reduce variance",
    note: "Half hedge size to soften swings."
  }
];

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

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return `$${value.toFixed(2)}`;
};

const payoutFactor = (odds: number) => {
  if (odds === 0) {
    return 0;
  }
  return odds > 0 ? odds / 100 : 100 / Math.abs(odds);
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

export default function HedgeCalculator({
  defaultEventId,
  defaultBetId
}: HedgeCalculatorProps) {
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBetId, setSelectedBetId] = useState<string>(defaultBetId ?? "");
  const [eventId, setEventId] = useState<string>(defaultEventId ?? "");
  const [market, setMarket] = useState<MarketType>("spread");
  const [side, setSide] = useState<BetSide>("away");
  const [line, setLine] = useState<number>(0);
  const [odds, setOdds] = useState<number>(-110);
  const [stake, setStake] = useState<number>(100);
  const [hedgeOdds, setHedgeOdds] = useState<number>(-110);
  const [hedgeOddsTouched, setHedgeOddsTouched] = useState(false);
  const [outcome, setOutcome] = useState<HedgeOutcome>("lock");

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
    if (defaultBetId) {
      setSelectedBetId(defaultBetId);
    }
  }, [defaultBetId]);

  useEffect(() => {
    if (defaultEventId && !selectedBetId) {
      setEventId(defaultEventId);
    }
  }, [defaultEventId, selectedBetId]);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, eventItem) => {
      acc[eventItem.id] = eventItem;
      return acc;
    }, {});
  }, [events]);

  const selectedEvent = eventId ? eventMap[eventId] : undefined;

  useEffect(() => {
    if (!selectedBetId) {
      return;
    }
    const bet = bets.find((entry) => entry.id === selectedBetId);
    if (!bet) {
      return;
    }
    const event = bet.eventId ? eventMap[bet.eventId] : undefined;
    const resolvedSide = resolveSideFromBet(bet, event) ?? side;

    setEventId(bet.eventId ?? "");
    setMarket(bet.market);
    setSide(resolvedSide);
    setLine(bet.line ?? 0);
    setOdds(bet.odds);
    setStake(bet.stake);
    setHedgeOddsTouched(false);
  }, [bets, eventMap, selectedBetId, side]);

  useEffect(() => {
    if (market === "total") {
      setSide((prev) => (prev === "under" ? "under" : "over"));
    } else {
      setSide((prev) => (prev === "home" ? "home" : "away"));
    }
  }, [market]);

  useEffect(() => {
    setHedgeOddsTouched(false);
  }, [eventId, market, side, selectedBetId]);

  const hedgeSide = useMemo(() => getOppositeSide(side, market), [market, side]);

  const bestHedgeSnapshot = useMemo(() => {
    if (!eventId) {
      return null;
    }
    const candidates = snapshots.filter(
      (snapshot) => snapshot.eventId === eventId && snapshot.market === market
    );
    const scopedCandidates =
      selectedEvent?.isLive && candidates.some((item) => item.isLive)
        ? candidates.filter((item) => item.isLive)
        : candidates;
    if (!scopedCandidates.length) {
      return null;
    }
    return scopedCandidates.reduce((best, snapshot) => {
      const bestOdds = getSideOdds(best, market, hedgeSide);
      const nextOdds = getSideOdds(snapshot, market, hedgeSide);
      if (nextOdds > bestOdds) {
        return snapshot;
      }
      if (nextOdds === bestOdds) {
        return new Date(snapshot.timestamp).getTime() >
          new Date(best.timestamp).getTime()
          ? snapshot
          : best;
      }
      return best;
    });
  }, [eventId, hedgeSide, market, snapshots, selectedEvent]);

  const bestHedgeOdds = bestHedgeSnapshot
    ? getSideOdds(bestHedgeSnapshot, market, hedgeSide)
    : null;
  const bestHedgeLine = bestHedgeSnapshot
    ? getLineForSide(bestHedgeSnapshot, market, hedgeSide)
    : null;

  useEffect(() => {
    if (!hedgeOddsTouched && bestHedgeOdds !== null) {
      setHedgeOdds(bestHedgeOdds);
    }
  }, [bestHedgeOdds, hedgeOddsTouched]);

  const validationError = useMemo(() => {
    if (!Number.isFinite(stake) || stake <= 0) {
      return "Stake must be greater than 0.";
    }
    if (!Number.isFinite(odds) || odds === 0) {
      return "Enter valid original odds.";
    }
    if (!Number.isFinite(hedgeOdds) || hedgeOdds === 0) {
      return "Enter valid hedge odds.";
    }
    return null;
  }, [hedgeOdds, odds, stake]);

  const calculation = useMemo(() => {
    if (validationError) {
      return null;
    }
    const originalProfit = stake * payoutFactor(odds);
    const hedgeFactor = payoutFactor(hedgeOdds);
    const lockStake = (originalProfit + stake) / (hedgeFactor + 1);
    const suggestedStake = outcome === "lock" ? lockStake : lockStake * 0.5;
    const netIfOriginalWins = originalProfit - suggestedStake;
    const netIfHedgeWins = suggestedStake * hedgeFactor - stake;
    const lockResultLabel = netIfOriginalWins >= 0 ? "Locks profit" : "Locks loss";

    return {
      suggestedStake,
      netIfOriginalWins,
      netIfHedgeWins,
      lockResultLabel,
      lockStake
    };
  }, [hedgeOdds, odds, outcome, stake, validationError]);

  const hedgeSideLabel = resolveSideLabel(hedgeSide, selectedEvent, market);
  const originalSideLabel = resolveSideLabel(side, selectedEvent, market);

  const betLabel = (bet: BetEntry) => {
    const event = bet.eventId ? eventMap[bet.eventId] : undefined;
    const sideLabel = resolveSideLabel(
      resolveSideFromBet(bet, event) ?? side,
      event,
      bet.market
    );
    const lineLabel =
      bet.market === "moneyline"
        ? ""
        : bet.line === undefined
        ? "--"
        : bet.market === "total"
        ? formatNumber(bet.line, 1)
        : formatSigned(bet.line, 1);
    const oddsLabel = formatOdds(bet.odds);
    const eventLabel = event
      ? `${event.awayTeam} @ ${event.homeTeam}`
      : bet.eventId ?? "Event";
    const marketLabel = bet.market === "moneyline" ? "ML" : bet.market.toUpperCase();
    return `${eventLabel} • ${marketLabel} ${sideLabel} ${lineLabel} (${oddsLabel})`;
  };

  return (
    <div className="tool-stack">
      {isMock ? (
        <DemoBanner message="Hedge calculations use mock odds until the backend is connected." />
      ) : null}
      {error ? <div className="notice error">{error}</div> : null}

      <div className="tool-row">
        <div className="filter-block">
          <label className="label" htmlFor="hedge-bet-select">
            Use logged bet
          </label>
          <select
            id="hedge-bet-select"
            className="select"
            value={selectedBetId}
            onChange={(eventItem) => setSelectedBetId(eventItem.target.value)}
          >
            <option value="">Manual entry</option>
            {bets.map((bet) => (
              <option key={bet.id} value={bet.id}>
                {betLabel(bet)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="hedge-event">
            Event
          </label>
          <select
            id="hedge-event"
            className="select"
            value={eventId}
            onChange={(eventItem) => setEventId(eventItem.target.value)}
            disabled={Boolean(selectedBetId)}
          >
            <option value="">Select event</option>
            {events.map((eventItem) => (
              <option key={eventItem.id} value={eventItem.id}>
                {eventItem.awayTeam} @ {eventItem.homeTeam}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tool-grid">
        <div className="filter-block">
          <label className="label" htmlFor="hedge-market">
            Market
          </label>
          <select
            id="hedge-market"
            className="select"
            value={market}
            onChange={(eventItem) => setMarket(eventItem.target.value as MarketType)}
            disabled={Boolean(selectedBetId)}
          >
            {marketOptions.map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="hedge-side">
            Original side
          </label>
          <select
            id="hedge-side"
            className="select"
            value={side}
            onChange={(eventItem) => setSide(eventItem.target.value as BetSide)}
            disabled={Boolean(selectedBetId)}
          >
            {market === "total" ? (
              <>
                <option value="over">Over</option>
                <option value="under">Under</option>
              </>
            ) : (
              <>
                <option value="away">Away</option>
                <option value="home">Home</option>
              </>
            )}
          </select>
        </div>
        {market === "moneyline" ? null : (
          <div className="filter-block">
            <label className="label" htmlFor="hedge-line">
              Original line
            </label>
            <input
              id="hedge-line"
              className="input"
              type="number"
              step={0.5}
              value={Number.isNaN(line) ? "" : line}
              onChange={(eventItem) => setLine(Number(eventItem.target.value))}
              disabled={Boolean(selectedBetId)}
            />
          </div>
        )}
        <div className="filter-block">
          <label className="label" htmlFor="hedge-odds">
            Original odds
          </label>
          <input
            id="hedge-odds"
            className="input"
            type="number"
            value={Number.isNaN(odds) ? "" : odds}
            onChange={(eventItem) => setOdds(Number(eventItem.target.value))}
            disabled={Boolean(selectedBetId)}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="hedge-stake">
            Stake
          </label>
          <input
            id="hedge-stake"
            className="input"
            type="number"
            value={Number.isNaN(stake) ? "" : stake}
            onChange={(eventItem) => setStake(Number(eventItem.target.value))}
            disabled={Boolean(selectedBetId)}
          />
        </div>
      </div>

      <div className="tool-row">
        <div className="tool-card">
          <div className="label">Best live hedge</div>
          <div className="tool-value">
            {bestHedgeSnapshot ? (
              <>
                {hedgeSideLabel}
                {market === "moneyline"
                  ? ""
                  : ` ${
                      market === "total"
                        ? formatNumber(bestHedgeLine ?? 0, 1)
                        : formatSigned(bestHedgeLine ?? 0, 1)
                    }`}
                {bestHedgeOdds !== null ? ` (${formatOdds(bestHedgeOdds)})` : ""}
              </>
            ) : (
              "No live line"
            )}
          </div>
          <div className="meta">
            {bestHedgeSnapshot
              ? `Updated ${formatLocalTime(bestHedgeSnapshot.timestamp)}`
              : loading
              ? "Loading odds..."
              : "Enter hedge odds manually."}
          </div>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="hedge-current-odds">
            Hedge odds ({hedgeSideLabel})
          </label>
          <input
            id="hedge-current-odds"
            className="input"
            type="number"
            value={Number.isNaN(hedgeOdds) ? "" : hedgeOdds}
            onChange={(eventItem) => {
              setHedgeOdds(Number(eventItem.target.value));
              setHedgeOddsTouched(true);
            }}
          />
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              if (bestHedgeOdds !== null) {
                setHedgeOdds(bestHedgeOdds);
                setHedgeOddsTouched(false);
              }
            }}
            disabled={bestHedgeOdds === null}
          >
            Use best odds
          </button>
        </div>
      </div>

      <div className="tool-card">
        <div className="label">Desired outcome</div>
        <div className="toggle-row">
          {outcomeOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`pill${outcome === option.id ? " active" : ""}`}
              onClick={() => setOutcome(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="meta">
          {outcomeOptions.find((option) => option.id === outcome)?.note}
        </div>
      </div>

      {validationError ? <div className="notice info">{validationError}</div> : null}

      <div className="tool-output">
        <div className="summary-card">
          <div className="label">Suggested hedge stake</div>
          <div className="summary-value">
            {calculation ? formatCurrency(calculation.suggestedStake) : "--"}
          </div>
          {calculation ? (
            <div className="meta">
              {calculation.lockResultLabel} at {formatCurrency(calculation.lockStake)}
            </div>
          ) : null}
        </div>
        <div className="summary-card">
          <div className="label">If {originalSideLabel} wins</div>
          <div className="summary-value">
            {calculation ? formatCurrency(calculation.netIfOriginalWins) : "--"}
          </div>
          <div className="meta">Original bet minus hedge stake.</div>
        </div>
        <div className="summary-card">
          <div className="label">If {hedgeSideLabel} wins</div>
          <div className="summary-value">
            {calculation ? formatCurrency(calculation.netIfHedgeWins) : "--"}
          </div>
          <div className="meta">Hedge payout minus original stake.</div>
        </div>
      </div>

      <div className="tool-example">
        Example: $100 at -110 hedged with +120 locks about $4.55.
      </div>
      <div className="meta">
        Estimates ignore limits, pushes, and correlated outcomes. Always verify live odds.
      </div>
    </div>
  );
}



