"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import FeatureLock from "@/components/FeatureLock";
import PlanBadge from "@/components/PlanBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { formatLocalDateTime } from "@/lib/format";
import { usePlan } from "@/lib/plan";
import {
  createAlertRule,
  deleteAlertRule,
  deleteTargetTracker,
  fetchEvents,
  fetchOddsSnapshots,
  fetchSportsbooks,
  fetchTargetTrackers,
  getApiMode,
  updateTargetTracker
} from "@/src/lib/api";
import { createRealtimeClient } from "@/src/lib/realtime";
import type {
  Event,
  MarketType,
  OddsSnapshot,
  Sportsbook,
  TargetTracker,
  TargetTrackerSide
} from "@/src/lib/contracts";
import TargetTrackerCard, { type TargetMetrics } from "@/src/components/TargetTrackerCard";

const SNAPSHOT_RETENTION_MINUTES = 180;

type Notice = {
  type: "success" | "error";
  message: string;
};

const trimSnapshots = (items: OddsSnapshot[]) => {
  const cutoff = Date.now() - SNAPSHOT_RETENTION_MINUTES * 60 * 1000;
  return items.filter(
    (snapshot) => new Date(snapshot.timestamp).getTime() >= cutoff
  );
};

const formatSignedNumber = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatSignedMoney = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
};

const formatPlainNumber = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
};

const formatLineLabel = (value: number, market: MarketType, side: TargetTrackerSide) => {
  if (market === "moneyline") {
    return formatSignedMoney(value);
  }
  if (market === "total") {
    const prefix = side === "over" ? "O " : "U ";
    return `${prefix}${formatPlainNumber(value, 1)}`;
  }
  return formatSignedNumber(value, 1);
};

const formatDeltaLabel = (distance: number, market: MarketType) => {
  if (market === "moneyline") {
    return `${formatSignedMoney(distance)}c`;
  }
  return `${formatSignedNumber(distance, 1)} pts`;
};

const getSnapshotValue = (
  snapshot: OddsSnapshot,
  market: MarketType,
  side: TargetTrackerSide
) => {
  if (market === "moneyline") {
    return side === "home" ? snapshot.homeOdds : snapshot.awayOdds;
  }
  if (market === "total") {
    return snapshot.line;
  }
  const line = snapshot.line;
  return side === "home" ? line : -line;
};

const isTargetHit = (tracker: TargetTracker, bestValue: number) => {
  if (tracker.market === "total") {
    return tracker.side === "over" ? bestValue >= tracker.target : bestValue <= tracker.target;
  }
  return bestValue >= tracker.target;
};

const computeProgress = (distance: number, market: MarketType, hit: boolean) => {
  if (hit) {
    return 1;
  }
  const maxRange = market === "moneyline" ? 200 : market === "total" ? 10 : 6;
  const ratio = Math.min(Math.abs(distance) / maxRange, 1);
  return Math.max(0, 1 - ratio);
};

export default function TargetsPage() {
  const { currentPlan } = usePlan();
  const [trackers, setTrackers] = useState<TargetTracker[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Record<string, Sportsbook>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [trackerData, eventData, snapshotData, sportsbookData] =
        await Promise.all([
          fetchTargetTrackers(),
          fetchEvents(),
          fetchOddsSnapshots(),
          fetchSportsbooks()
        ]);

      const bookMap = sportsbookData.reduce<Record<string, Sportsbook>>(
        (acc, book) => {
          acc[book.id] = book;
          return acc;
        },
        {}
      );

      setTrackers(trackerData);
      setEvents(eventData);
      setSnapshots(trimSnapshots(snapshotData));
      setSportsbooks(bookMap);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load targets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const client = createRealtimeClient();
    const handleOddsUpdate = (payload: OddsSnapshot) => {
      setSnapshots((prev) => trimSnapshots([...prev, payload]));
      setLastUpdated(new Date().toISOString());
    };

    client.connect();
    client.on("odds:update", handleOddsUpdate);

    return () => {
      client.off("odds:update", handleOddsUpdate);
      client.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!trackers.some((tracker) => tracker.autoRearm && tracker.nextRearmAt)) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [trackers]);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const latestByEventMarket = useMemo(() => {
    const map = new Map<string, Map<string, OddsSnapshot>>();

    for (const snapshot of snapshots) {
      if (!snapshot.sportsbookId) {
        continue;
      }
      const key = `${snapshot.eventId}:${snapshot.market}`;
      const existing = map.get(key) ?? new Map<string, OddsSnapshot>();
      const current = existing.get(snapshot.sportsbookId);
      if (
        !current ||
        new Date(snapshot.timestamp).getTime() >
          new Date(current.timestamp).getTime()
      ) {
        existing.set(snapshot.sportsbookId, snapshot);
      }
      map.set(key, existing);
    }

    return map;
  }, [snapshots]);

  const trackerMetrics = useMemo(() => {
    const map = new Map<string, TargetMetrics>();

    trackers.forEach((tracker) => {
      const key = `${tracker.eventId}:${tracker.market}`;
      const bookMap = latestByEventMarket.get(key);
      if (!bookMap || bookMap.size === 0) {
        map.set(tracker.id, {
          bestLineLabel: "--",
          bestBookLabel: "No book data yet",
          distanceLabel: "--",
          progress: 0,
          hit: false
        });
        return;
      }

      const entries = Array.from(bookMap.values());
      let bestSnapshot = entries[0];
      let bestValue = getSnapshotValue(bestSnapshot, tracker.market, tracker.side);
      const prefersLower = tracker.market === "total" && tracker.side === "over";

      for (const snapshot of entries.slice(1)) {
        const value = getSnapshotValue(snapshot, tracker.market, tracker.side);
        if (prefersLower ? value < bestValue : value > bestValue) {
          bestValue = value;
          bestSnapshot = snapshot;
        }
      }

      const hit = isTargetHit(tracker, bestValue);
      const distance = tracker.target - bestValue;
      const progress = computeProgress(distance, tracker.market, hit);
      const bookLabel = bestSnapshot.sportsbookId
        ? sportsbooks[bestSnapshot.sportsbookId]?.shortName ??
          sportsbooks[bestSnapshot.sportsbookId]?.name ??
          bestSnapshot.sportsbookId
        : "Consensus";

      map.set(tracker.id, {
        bestValue,
        bestLineLabel: formatLineLabel(bestValue, tracker.market, tracker.side),
        bestBookLabel: bookLabel,
        distanceLabel: hit
          ? "Target hit"
          : `${formatDeltaLabel(distance, tracker.market)} to target`,
        progress,
        hit
      });
    });

    return map;
  }, [latestByEventMarket, sportsbooks, trackers]);

  useEffect(() => {
    if (!isMock) {
      return;
    }

    const candidates = trackers.filter((tracker) => {
      const metrics = trackerMetrics.get(tracker.id);
      return tracker.notifyOnHit && tracker.armed && metrics?.hit;
    });

    if (!candidates.length) {
      return;
    }

    const triggerHits = async () => {
      for (const tracker of candidates) {
        const firedAt = new Date().toISOString();
        const updates: Partial<TargetTracker> = {
          armed: false,
          lastHitAt: firedAt
        };
        if (tracker.autoRearm) {
          updates.nextRearmAt = new Date(
            Date.now() + tracker.cooldownSeconds * 1000
          ).toISOString();
        }
        try {
          const updated = await updateTargetTracker(tracker.id, updates);
          setTrackers((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
        } catch {
          setNotice({
            type: "error",
            message: "Unable to update target tracker state."
          });
        }
      }
    };

    triggerHits();
  }, [isMock, trackerMetrics, trackers]);

  useEffect(() => {
    if (!isMock) {
      return;
    }
    const due = trackers.filter((tracker) => {
      if (!tracker.autoRearm || tracker.armed || !tracker.nextRearmAt) {
        return false;
      }
      return new Date(tracker.nextRearmAt).getTime() <= now;
    });

    if (!due.length) {
      return;
    }

    const rearmTargets = async () => {
      for (const tracker of due) {
        try {
          const updated = await updateTargetTracker(tracker.id, {
            armed: true,
            nextRearmAt: undefined
          });
          setTrackers((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
        } catch {
          setNotice({
            type: "error",
            message: "Unable to re-arm target tracker."
          });
        }
      }
    };

    rearmTargets();
  }, [isMock, now, trackers]);

  const handleToggleNotify = async (tracker: TargetTracker, nextValue: boolean) => {
    if (!eventMap[tracker.eventId]) {
      setNotice({ type: "error", message: "Event data unavailable." });
      return;
    }
    setUpdatingId(tracker.id);
    setNotice(null);

    const event = eventMap[tracker.eventId];
    let alertRuleId = tracker.alertRuleId;

    try {
      if (nextValue && !alertRuleId) {
        const direction =
          tracker.market === "total" && tracker.side === "under" ? "lte" : "gte";
        const teamLabel =
          tracker.market === "total"
            ? tracker.side
            : tracker.side === "away"
            ? event.awayTeam
            : event.homeTeam;

        const rule = await createAlertRule({
          type: "THRESHOLD_AT",
          isLive: tracker.isLive,
          eventId: tracker.eventId,
          sport: tracker.sport,
          market: tracker.market,
          team: teamLabel,
          threshold: tracker.target,
          direction,
          name: `${teamLabel} ${tracker.market} ${tracker.target}`
        });
        alertRuleId = rule.id;
      }

      if (!nextValue && alertRuleId) {
        await deleteAlertRule(alertRuleId);
        alertRuleId = undefined;
      }

      const updated = await updateTargetTracker(tracker.id, {
        notifyOnHit: nextValue,
        alertRuleId
      });

      setTrackers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to update tracker."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleAutoRearm = async (
    tracker: TargetTracker,
    nextValue: boolean
  ) => {
    setUpdatingId(tracker.id);
    setNotice(null);
    try {
      const updates: Partial<TargetTracker> = {
        autoRearm: nextValue
      };
      if (nextValue && !tracker.armed && !tracker.nextRearmAt) {
        updates.armed = true;
      }
      if (!nextValue) {
        updates.nextRearmAt = undefined;
      }
      const updated = await updateTargetTracker(tracker.id, updates);
      setTrackers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to update tracker."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (tracker: TargetTracker) => {
    setUpdatingId(tracker.id);
    setNotice(null);
    try {
      await deleteTargetTracker(tracker.id);
      setTrackers((prev) => prev.filter((item) => item.id !== tracker.id));
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to delete tracker."
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Tracked Targets</h2>
          <p className="page-subtitle">
            Monitor target numbers, auto-rearm cooldowns, and current best lines.
          </p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        {isMock ? (
          <DemoBanner message="Mock target trackers and book data are active." />
        ) : null}
        <div className="panel-header">
          <h3 className="panel-title">Active targets</h3>
          <span className="meta">{trackers.length} trackers</span>
        </div>

        {loading ? (
          <div className="notice">Loading tracked targets...</div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : (
          <>
            <FeatureLock requiredPlan="PRO">
              {trackers.length === 0 ? (
                <div className="notice">
                  No tracked targets yet. Create one from an event detail page.
                </div>
              ) : (
                <div className="targets-grid">
                  {trackers.map((tracker) => {
                    const event = eventMap[tracker.eventId];
                    const metrics = trackerMetrics.get(tracker.id);

                    return (
                      <TargetTrackerCard
                        key={tracker.id}
                        tracker={tracker}
                        event={event}
                        metrics={metrics}
                        now={now}
                        isUpdating={updatingId === tracker.id}
                        onToggleNotify={handleToggleNotify}
                        onToggleAutoRearm={handleToggleAutoRearm}
                        onDelete={handleDelete}
                      />
                    );
                  })}
                </div>
              )}
            </FeatureLock>
            <UpgradeCTA requiredPlan="PRO" featureName="Target tracking and auto-rearm" />
          </>
        )}

        {notice ? (
          <div className={`notice ${notice.type === "success" ? "success" : "error"}`}>
            {notice.message}
          </div>
        ) : null}
      </section>

      <section className="panel panel-tight">
        <div className="label">Target tracking notes</div>
        <div className="meta">
          Auto-rearm is simulated in mock mode. Real backend hooks will update last
          hit timestamps and cooldowns.
        </div>
        <div className="meta">
          Last updated {lastUpdated ? formatLocalDateTime(lastUpdated) : "--"}
        </div>
      </section>
    </>
  );
}
