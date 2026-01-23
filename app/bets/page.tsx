"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DemoBanner from "@/components/DemoBanner";
import FeatureLock from "@/components/FeatureLock";
import PlanBadge from "@/components/PlanBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { usePlan } from "@/lib/plan";
import BetLogModal, { type BetLogPrefill } from "@/src/components/BetLogModal";
import BetRow from "@/src/components/BetRow";
import {
  fetchEvents,
  fetchOddsSnapshots,
  getApiMode
} from "@/src/lib/api";
import {
  loadBets,
  setClosingLine,
  subscribeBets,
  type BetEntry
} from "@/src/lib/betsStore";
import type { Event, MarketType, OddsSnapshot } from "@/src/lib/contracts";

type DateFilter = "all" | "today" | "7d" | "30d";

const dateOptions: { id: DateFilter; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" }
];

const formatSigned = (value: number, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
};

const average = (values: number[]) => {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export default function BetsPage() {
  const { currentPlan } = usePlan();
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [activePrefill, setActivePrefill] = useState<BetLogPrefill | null>(null);

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
        setError(err instanceof Error ? err.message : "Unable to load events.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const sportOptions = useMemo(() => {
    const unique = Array.from(new Set(events.map((event) => event.sport)));
    return ["All", ...unique];
  }, [events]);

  const latestByEventMarket = useMemo(() => {
    return snapshots.reduce<Record<string, Partial<Record<MarketType, OddsSnapshot>>>>(
      (acc, snapshot) => {
        if (!acc[snapshot.eventId]) {
          acc[snapshot.eventId] = {};
        }
        const existing = acc[snapshot.eventId][snapshot.market];
        if (
          !existing ||
          new Date(snapshot.timestamp).getTime() >
            new Date(existing.timestamp).getTime()
        ) {
          acc[snapshot.eventId][snapshot.market] = snapshot;
        }
        return acc;
      },
      {}
    );
  }, [snapshots]);

  const filteredBets = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000;
    return bets
      .filter((bet) => {
        if (sportFilter !== "All") {
          const betSport = bet.sport ?? (bet.eventId ? eventMap[bet.eventId]?.sport : undefined);
          if (betSport !== sportFilter) {
            return false;
          }
        }
        if (!bet.placedAt) {
          return false;
        }
        const placedAtTime = new Date(bet.placedAt).getTime();
        if (dateFilter === "today") {
          return placedAtTime >= todayStart;
        }
        if (dateFilter === "7d") {
          return placedAtTime >= Date.now() - daysToMs(7);
        }
        if (dateFilter === "30d") {
          return placedAtTime >= Date.now() - daysToMs(30);
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = a.placedAt ? new Date(a.placedAt).getTime() : 0;
        const bTime = b.placedAt ? new Date(b.placedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [bets, dateFilter, eventMap, sportFilter]);

  const calculateClv = (bet: BetEntry) => {
    if (bet.market === "moneyline") {
      if (bet.closingOdds === undefined) {
        return null;
      }
      return bet.odds - bet.closingOdds;
    }
    if (bet.line === undefined || bet.closingLine === undefined) {
      return null;
    }
    if (bet.market === "total") {
      if (bet.side === "over") {
        return bet.closingLine - bet.line;
      }
      if (bet.side === "under") {
        return bet.line - bet.closingLine;
      }
    }
    return bet.line - bet.closingLine;
  };

  const resolveClosingLabel = (bet: BetEntry) => {
    if (bet.market === "moneyline") {
      return bet.closingOdds === undefined ? undefined : formatOdds(bet.closingOdds);
    }
    return bet.closingLine === undefined ? undefined : formatSigned(bet.closingLine, 1);
  };

  const betMetrics = useMemo(() => {
    return filteredBets.map((bet) => {
      const clvValue = calculateClv(bet);
      const closingLabel = resolveClosingLabel(bet);
      const showSetClose =
        isMock &&
        (bet.market === "moneyline"
          ? bet.closingOdds === undefined
          : bet.closingLine === undefined);
      return { bet, clvValue, closingLabel, showSetClose };
    });
  }, [filteredBets, isMock]);

  const clvSummary = useMemo(() => {
    const pointValues: number[] = [];
    const moneyValues: number[] = [];
    betMetrics.forEach(({ bet, clvValue }) => {
      if (clvValue === null || clvValue === undefined) {
        return;
      }
      if (bet.market === "moneyline") {
        moneyValues.push(clvValue);
      } else {
        pointValues.push(clvValue);
      }
    });
    return {
      avgPoints: average(pointValues),
      avgCents: average(moneyValues),
      closedCount: pointValues.length + moneyValues.length
    };
  }, [betMetrics]);

  const handleSetClose = (bet: BetEntry) => {
    if (!isMock || !bet.eventId) {
      return;
    }
    const snapshot = latestByEventMarket[bet.eventId]?.[bet.market];
    if (!snapshot) {
      return;
    }
    const side = bet.side ?? (bet.market === "total" ? "over" : "home");
    let closingLine: number | undefined;
    let closingOdds: number | undefined;

    if (bet.market === "moneyline") {
      closingOdds = side === "home" ? snapshot.homeOdds : snapshot.awayOdds;
    } else if (bet.market === "spread") {
      closingLine = side === "away" ? -snapshot.line : snapshot.line;
      closingOdds = side === "home" ? snapshot.homeOdds : snapshot.awayOdds;
    } else {
      closingLine = snapshot.line;
      closingOdds = side === "under" ? snapshot.awayOdds : snapshot.homeOdds;
    }

    setClosingLine(bet.id, closingLine, closingOdds);
  };

  const handleNewBet = () => {
    setActivePrefill(null);
    setModalOpen(true);
  };

  const summaryClvLabel = useMemo(() => {
    const parts: string[] = [];
    if (clvSummary.avgPoints !== null) {
      parts.push(`${formatSigned(clvSummary.avgPoints, 1)} pts`);
    }
    if (clvSummary.avgCents !== null) {
      parts.push(`${formatSigned(clvSummary.avgCents, 0)}c`);
    }
    return parts.length ? parts.join(" / ") : "--";
  }, [clvSummary.avgCents, clvSummary.avgPoints]);

  const hasMissingClose = useMemo(
    () =>
      filteredBets.some((bet) =>
        bet.market === "moneyline"
          ? bet.closingOdds === undefined
          : bet.closingLine === undefined
      ),
    [filteredBets]
  );

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Bets</h2>
          <p className="page-subtitle">Log bets, track CLV, and review results.</p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Edge tools</h3>
          <span className="meta">Hedge calculators and middle alerts.</span>
        </div>
        <FeatureLock requiredPlan="PRO">
          <div className="tool-links">
            <Link className="btn btn-primary" href="/tools?tab=hedge">
              Open Hedge Calculator
            </Link>
            <Link className="btn btn-ghost" href="/tools?tab=middle">
              Open Middle Finder
            </Link>
          </div>
        </FeatureLock>
        <UpgradeCTA requiredPlan="PRO" featureName="Edge tools" />
      </section>

      <FeatureLock requiredPlan="PRO">
        <section className="panel">
          {isMock ? (
            <DemoBanner message="Bet logs are stored locally while mock mode is active." />
          ) : null}
          <div className="panel-header">
            <h3 className="panel-title">Bet Log</h3>
            <button className="btn btn-primary" type="button" onClick={handleNewBet}>
              New Bet
            </button>
          </div>

          <div className="bets-summary">
            <div className="summary-card">
              <div className="label">Bets logged</div>
              <div className="summary-value">{filteredBets.length}</div>
              <div className="meta">{bets.length} total entries</div>
            </div>
            <div className="summary-card">
              <div className="label">Avg CLV</div>
              <div className="summary-value">{summaryClvLabel}</div>
              <div className="meta">{clvSummary.closedCount} with close</div>
            </div>
            <div className="summary-card">
              <div className="label">Win rate</div>
              <div className="summary-value">--</div>
              <div className="meta">Placeholder until results sync</div>
            </div>
            <FeatureLock requiredPlan="ELITE">
              <div className="summary-card">
                <div className="label">Advanced CLV analytics</div>
                <div className="summary-value">Elite</div>
                <div className="meta">Market splits, book performance, streaks.</div>
              </div>
            </FeatureLock>
          </div>

          <div className="bets-filters">
            <div className="filter-block">
              <label className="label" htmlFor="sport-filter">
                Sport
              </label>
              <select
                id="sport-filter"
                className="select"
                value={sportFilter}
                onChange={(event) => setSportFilter(event.target.value)}
              >
                {sportOptions.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="date-filter">
                Date range
              </label>
              <select
                id="date-filter"
                className="select"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              >
                {dateOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-block">
              <div className="label">Data status</div>
              <div className="meta">
                {loading ? "Syncing events..." : error ? "Offline" : "Live"}
              </div>
            </div>
          </div>

          {error ? <div className="notice error">{error}</div> : null}

          {betMetrics.length === 0 ? (
            <div className="notice">No bets logged yet.</div>
          ) : (
            <div className="table">
              {betMetrics.map(({ bet, clvValue, closingLabel, showSetClose }) => (
                <BetRow
                  key={bet.id}
                  bet={bet}
                  event={bet.eventId ? eventMap[bet.eventId] : undefined}
                  clvValue={clvValue}
                  closingLineLabel={closingLabel}
                  showSetClose={showSetClose}
                  onSetClose={handleSetClose}
                />
              ))}
            </div>
          )}

          {isMock && hasMissingClose ? (
            <div className="notice info">
              Use "Set closing line now" to simulate closes for CLV testing.
            </div>
          ) : null}
        </section>
      </FeatureLock>
      <UpgradeCTA requiredPlan="PRO" featureName="Post-bet tracking + CLV" />

      <BetLogModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActivePrefill(null);
        }}
        events={events}
        prefill={activePrefill ?? undefined}
      />
    </>
  );
}
