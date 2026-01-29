"use client";

import { useEffect, useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import EventCard from "@/src/components/EventCard";
import {
  fetchEvents,
  fetchOddsSnapshots,
  getOddsMode
} from "@/src/lib/api";
import { listEvents } from "@/src/lib/demo/demoApi";
import {
  startRealtimeSim,
  subscribe,
  unsubscribe
} from "@/src/lib/demo/realtimeSim";
import type {
  DemoEvent,
  DemoLiveOdds,
  Event,
  MarketType,
  OddsSnapshot
} from "@/src/lib/contracts";

const sports = ["All", "NFL", "NBA", "NCAAB", "NCAAF"] as const;

type SportFilter = (typeof sports)[number];

export default function DashboardPage() {
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<SportFilter>("All");
  const [liveOnly, setLiveOnly] = useState(false);
  const [showLiveLines, setShowLiveLines] = useState(true);
  const oddsMode = getOddsMode();
  const isLiveOdds = oddsMode === "real";

  useEffect(() => {
    if (isLiveOdds) {
      return;
    }
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await listEvents();
        setDemoEvents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load demo events.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isLiveOdds]);

  useEffect(() => {
    if (isLiveOdds) {
      return;
    }
    startRealtimeSim();
    const handleUpdate = (payload: { eventId: string; event: DemoEvent }) => {
      setDemoEvents((prev) =>
        prev.map((event) => (event.id === payload.eventId ? payload.event : event))
      );
    };

    subscribe("score:update", handleUpdate);
    subscribe("odds:update", handleUpdate);

    return () => {
      unsubscribe("score:update", handleUpdate);
      unsubscribe("odds:update", handleUpdate);
    };
  }, [isLiveOdds]);

  useEffect(() => {
    if (!isLiveOdds) {
      return;
    }
    let active = true;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [eventsData, oddsData] = await Promise.all([
          fetchEvents(),
          fetchOddsSnapshots()
        ]);
        if (!active) {
          return;
        }
        setLiveEvents(eventsData);
        setSnapshots(oddsData);
      } catch (err) {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load live events.");
        setLiveEvents([]);
        setSnapshots([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isLiveOdds]);

  const events = isLiveOdds ? liveEvents : demoEvents;

  const latestByEventMarket = useMemo(() => {
    if (!isLiveOdds) {
      return {} as Record<string, Partial<Record<MarketType, OddsSnapshot>>>;
    }
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
  }, [isLiveOdds, snapshots]);

  const buildLiveOdds = (eventId: string): DemoLiveOdds | undefined => {
    const byMarket = latestByEventMarket[eventId];
    const spread = byMarket?.spread;
    const moneyline = byMarket?.moneyline;
    if (!spread || !moneyline) {
      return undefined;
    }
    const spreadBook = spread.sportsbookId ?? "consensus";
    const moneyBook = moneyline.sportsbookId ?? "consensus";
    return {
      spread: {
        away: {
          line: -spread.line,
          price: spread.awayOdds,
          bookKey: spreadBook,
          updatedAt: spread.timestamp
        },
        home: {
          line: spread.line,
          price: spread.homeOdds,
          bookKey: spreadBook,
          updatedAt: spread.timestamp
        }
      },
      moneyline: {
        away: {
          price: moneyline.awayOdds,
          bookKey: moneyBook,
          updatedAt: moneyline.timestamp
        },
        home: {
          price: moneyline.homeOdds,
          bookKey: moneyBook,
          updatedAt: moneyline.timestamp
        }
      }
    };
  };

  const visibleEvents = useMemo(() => {
    return events
      .filter((event) => (sportFilter === "All" ? true : event.sport === sportFilter))
      .filter((event) => (liveOnly ? event.isLive : true))
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  }, [events, liveOnly, sportFilter]);

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">
            Live scores, spreads, and moneylines across every tracked sport.
          </p>
        </div>
        <div className="panel panel-tight">
          <div className="label">Events shown</div>
          <div className="meta">{visibleEvents.length}</div>
        </div>
      </section>

      <section className="panel">
        {!isLiveOdds ? (
          <DemoBanner message="Demo mode is active. Live scores and odds are simulated." />
        ) : null}
        <div className="panel-header">
          <h3 className="panel-title">Filters</h3>
          <span className="meta">Adjust what appears in the live board.</span>
        </div>
        <div className="filters">
          <div className="filter-block">
            <label className="label" htmlFor="sport-filter">
              Sport
            </label>
            <select
              id="sport-filter"
              className="select"
              value={sportFilter}
              onChange={(event) => setSportFilter(event.target.value as SportFilter)}
            >
              {sports.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-block">
            <label className="label">Live only</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={liveOnly}
                onChange={(event) => setLiveOnly(event.target.checked)}
              />
              {liveOnly ? "On" : "Off"}
            </label>
          </div>
          <div className="filter-block">
            <label className="label">Show live lines</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={showLiveLines}
                onChange={(event) => setShowLiveLines(event.target.checked)}
              />
              {showLiveLines ? "On" : "Off"}
            </label>
          </div>
        </div>
      </section>

      <section className="list">
        {loading ? (
          <div className="notice">
            {isLiveOdds ? "Loading live events..." : "Loading demo events..."}
          </div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : visibleEvents.length === 0 ? (
          <div className="notice">No events match the current filters.</div>
        ) : (
          visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              showLiveLines={showLiveLines}
              liveOdds={isLiveOdds ? buildLiveOdds(event.id) : undefined}
            />
          ))
        )}
      </section>
    </>
  );
}
