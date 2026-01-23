"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DemoBanner from "@/components/DemoBanner";
import FeatureLock from "@/components/FeatureLock";
import LiveDetailHeader from "@/components/LiveDetailHeader";
import StatusBadge from "@/components/StatusBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { formatLocalDateTime } from "@/lib/format";
import {
  createAlertRule,
  fetchEvent,
  fetchOddsSnapshots,
  fetchSportsbooks,
  getApiMode
} from "@/src/lib/api";
import { createRealtimeClient } from "@/src/lib/realtime";
import type { Event, MarketType, OddsSnapshot, Sportsbook } from "@/src/lib/contracts";
import type { BetEntry } from "@/src/lib/betsStore";
import BetLogModal, { type BetLogPrefill } from "@/src/components/BetLogModal";
import BetRow from "@/src/components/BetRow";
import MovementAttributionPanel from "@/src/components/MovementAttributionPanel";
import QuickActions from "@/src/components/QuickActions";
import { loadBets, setClosingLine, subscribeBets } from "@/src/lib/betsStore";

type Notice = {
  type: "success" | "error";
  message: string;
};

const SNAPSHOT_RETENTION_MINUTES = 180;
const MOVEMENT_WINDOW_MINUTES = 30;

const trimSnapshots = (items: OddsSnapshot[]) => {
  const cutoff = Date.now() - SNAPSHOT_RETENTION_MINUTES * 60 * 1000;
  return items.filter(
    (snapshot) => new Date(snapshot.timestamp).getTime() >= cutoff
  );
};

const formatSigned = (value: number) => {
  const rounded = Math.round(value * 2) / 2;
  const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = useMemo(() => {
    if (!params?.id) {
      return "";
    }
    return Array.isArray(params.id) ? params.id[0] : params.id;
  }, [params]);

  const [event, setEvent] = useState<Event | null>(null);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Record<string, Sportsbook>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState("");
  const [spreadThreshold, setSpreadThreshold] = useState(10.5);
  const [moneylineThreshold, setMoneylineThreshold] = useState(250);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState<"spread" | "moneyline" | null>(
    null
  );
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [betPrefill, setBetPrefill] = useState<BetLogPrefill | null>(null);

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (!eventId) {
        return;
      }
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const results = await Promise.allSettled([
          fetchEvent(eventId),
          fetchOddsSnapshots(eventId),
          fetchSportsbooks()
        ]);

        const eventResult = results[0];
        if (eventResult.status === "rejected") {
          throw eventResult.reason;
        }

        setEvent(eventResult.value);

        const snapshotsResult = results[1];
        if (snapshotsResult.status === "fulfilled") {
          setSnapshots(trimSnapshots(snapshotsResult.value));
        } else {
          setSnapshots([]);
        }

        const booksResult = results[2];
        if (booksResult.status === "fulfilled") {
          const map = booksResult.value.reduce<Record<string, Sportsbook>>(
            (acc, book) => {
              acc[book.id] = book;
              return acc;
            },
            {}
          );
          setSportsbooks(map);
        } else {
          setSportsbooks({});
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load event.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setBets(loadBets());
    return subscribeBets(setBets);
  }, []);

  useEffect(() => {
    if (event && !team) {
      setTeam(event.awayTeam);
    }
  }, [event, team]);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    const client = createRealtimeClient();
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const handleUpdate = (payload: OddsSnapshot) => {
      if (payload.eventId !== eventId) {
        return;
      }
      setSnapshots((prev) => trimSnapshots([...prev, payload]));
      setRefreshing(true);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => setRefreshing(false), 900);
    };

    client.connect();
    client.on("odds:update", handleUpdate);

    return () => {
      client.off("odds:update", handleUpdate);
      client.disconnect();
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [eventId]);

  const recentSnapshots = useMemo(() => {
    const cutoff = Date.now() - MOVEMENT_WINDOW_MINUTES * 60 * 1000;
    return snapshots.filter(
      (snapshot) => new Date(snapshot.timestamp).getTime() >= cutoff
    );
  }, [snapshots]);

  const eventBets = useMemo(
    () => bets.filter((bet) => bet.eventId === eventId),
    [bets, eventId]
  );

  const hasMissingClose = useMemo(
    () =>
      eventBets.some((bet) =>
        bet.market === "moneyline"
          ? bet.closingOdds === undefined
          : bet.closingLine === undefined
      ),
    [eventBets]
  );

  const latestByMarket = useMemo(() => {
    return snapshots.reduce<Partial<Record<MarketType, OddsSnapshot>>>(
      (acc, snapshot) => {
        const existing = acc[snapshot.market];
        if (
          !existing ||
          new Date(snapshot.timestamp).getTime() >
            new Date(existing.timestamp).getTime()
        ) {
          acc[snapshot.market] = snapshot;
        }
        return acc;
      },
      {}
    );
  }, [snapshots]);

  const resolveClosingLabel = (bet: BetEntry) => {
    if (bet.market === "moneyline") {
      return bet.closingOdds === undefined ? undefined : formatOdds(bet.closingOdds);
    }
    return bet.closingLine === undefined ? undefined : formatSigned(bet.closingLine);
  };

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

  const handleSetClose = (bet: BetEntry) => {
    if (!isMock) {
      return;
    }
    const snapshot = latestByMarket[bet.market];
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

  const handleOpenBetModal = () => {
    if (!event) {
      return;
    }
    setBetPrefill({
      eventId: event.id,
      sport: event.sport,
      awayTeam: event.awayTeam,
      homeTeam: event.homeTeam
    });
    setBetModalOpen(true);
  };

  const handleCreate = async (market: "spread" | "moneyline") => {
    if (!eventId || !team) {
      return;
    }
    const threshold =
      market === "spread" ? Number(spreadThreshold) : Number(moneylineThreshold);
    if (Number.isNaN(threshold)) {
      setNotice({ type: "error", message: "Threshold must be a number." });
      return;
    }
    setSubmitting(market);
    setNotice(null);

    try {
      await createAlertRule({
        type: "THRESHOLD_AT",
        isLive: true,
        eventId,
        market,
        team,
        threshold,
        direction: "gte",
        name: `${team} ${market} ${formatSigned(threshold)}`
      });
      setNotice({
        type: "success",
        message: isMock ? "Mock alert created locally." : "Alert created."
      });
    } catch (err) {
      let message = err instanceof Error ? err.message : "Unable to create alert.";
      if (message.toLowerCase().includes("exist")) {
        message = "This alert already exists.";
      }
      setNotice({ type: "error", message });
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="notice">Loading event...</div>;
  }

  if (error || !event) {
    return <div className="notice error">{error ?? "Event not found."}</div>;
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">
            {event.awayTeam} @ {event.homeTeam}
          </h2>
          <p className="page-subtitle">
            {event.sport} | {formatLocalDateTime(event.startTime)}
          </p>
        </div>
        <div className="status-stack">
          <StatusBadge
            isLive={event.isLive}
            inPlayState={event.inPlayState}
            statusText={event.statusText}
          />
          {refreshing ? <span className="meta">Updating...</span> : null}
        </div>
      </section>

      <LiveDetailHeader
        isLive={event.isLive}
        inPlayState={event.inPlayState}
        statusText={event.statusText}
        score={event.score}
        awayTeam={event.awayTeam}
        homeTeam={event.homeTeam}
        startTime={formatLocalDateTime(event.startTime)}
      />

      <section className="panel">
        {isMock ? (
          <DemoBanner message="Mock attribution data is active for this event." />
        ) : null}
        <MovementAttributionPanel
          event={event}
          snapshots={recentSnapshots}
          sportsbooks={sportsbooks}
          mode={apiMode}
        />
      </section>

      <section className="panel">
        <QuickActions event={event} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Edge tools</h3>
          <span className="meta">Hedge and middle workflows for this matchup.</span>
        </div>
        <FeatureLock requiredPlan="PRO">
          <div className="tool-links">
            <Link className="btn btn-primary" href={`/tools?tab=hedge&eventId=${event.id}`}>
              Hedge Calculator
            </Link>
            <Link className="btn btn-ghost" href={`/tools?tab=middle&eventId=${event.id}`}>
              Middle Finder
            </Link>
          </div>
        </FeatureLock>
        <UpgradeCTA requiredPlan="PRO" featureName="Edge tools" />
      </section>

      <section className="panel">
        {isMock ? (
          <DemoBanner message="Alert actions are stored locally for demo purposes." />
        ) : null}
        <div className="panel-header">
          <h3 className="panel-title">Quick Alert Creator</h3>
          <span className="meta">Live-only | All books | Cooldown on</span>
        </div>
        <div className="alert-grid">
          <div className="alert-form">
            <div className="filter-block">
              <label className="label" htmlFor="team-select">
                Team
              </label>
              <select
                id="team-select"
                className="select"
                value={team}
                onChange={(eventItem) => setTeam(eventItem.target.value)}
              >
                {[event.awayTeam, event.homeTeam].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="spread-threshold">
                Spread threshold
              </label>
              <input
                id="spread-threshold"
                className="input"
                type="number"
                step={0.5}
                value={spreadThreshold}
                onChange={(eventItem) =>
                  setSpreadThreshold(Number(eventItem.target.value))
                }
                placeholder="+10.5"
              />
            </div>
            <div className="alert-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => handleCreate("spread")}
                disabled={submitting === "spread"}
              >
                Create LIVE spread alert
              </button>
            </div>
          </div>
          <FeatureLock requiredPlan="PRO">
            <div className="alert-form">
              <div className="filter-block">
                <label className="label" htmlFor="moneyline-threshold">
                  Moneyline threshold
                </label>
                <input
                  id="moneyline-threshold"
                  className="input"
                  type="number"
                  value={moneylineThreshold}
                  onChange={(eventItem) =>
                    setMoneylineThreshold(Number(eventItem.target.value))
                  }
                  placeholder="+250"
                />
              </div>
              <div className="alert-actions">
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => handleCreate("moneyline")}
                  disabled={submitting === "moneyline"}
                >
                  Create LIVE moneyline alert
                </button>
              </div>
            </div>
          </FeatureLock>
          <div className="panel panel-tight">
            <div className="label">Example</div>
            <div className="meta">
              Alert me if {team} goes {formatSigned(spreadThreshold)} LIVE
            </div>
            <div className="meta">
              Alert me if moneyline reaches {formatSigned(moneylineThreshold)} LIVE
            </div>
          </div>
        </div>
        {notice ? (
          <div className={`notice ${notice.type === "success" ? "success" : "error"}`}>
            {notice.message}
          </div>
        ) : null}
      </section>

      <FeatureLock requiredPlan="PRO">
        <section className="panel">
          {isMock ? (
            <DemoBanner message="Bet logs are stored locally in mock mode." />
          ) : null}
          <div className="panel-header">
            <h3 className="panel-title">Your bets for this game</h3>
            <button className="btn btn-primary" type="button" onClick={handleOpenBetModal}>
              Log Bet
            </button>
          </div>
          {eventBets.length === 0 ? (
            <div className="notice">No bets logged for this event yet.</div>
          ) : (
            <div className="table">
              {eventBets.map((bet) => {
                const clvValue = calculateClv(bet);
                const closingLabel = resolveClosingLabel(bet);
                const showSetClose =
                  isMock &&
                  (bet.market === "moneyline"
                    ? bet.closingOdds === undefined
                    : bet.closingLine === undefined);

                return (
                  <BetRow
                    key={bet.id}
                    bet={bet}
                    event={event}
                    clvValue={clvValue}
                    closingLineLabel={closingLabel}
                    showSetClose={showSetClose}
                    onSetClose={handleSetClose}
                  />
                );
              })}
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
        open={betModalOpen}
        onClose={() => {
          setBetModalOpen(false);
          setBetPrefill(null);
        }}
        events={event ? [event] : []}
        prefill={betPrefill ?? undefined}
      />
    </>
  );
}
