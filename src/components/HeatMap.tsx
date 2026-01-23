"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Event, MarketType, OddsSnapshot } from "@/src/lib/contracts";
import { formatLocalTime } from "@/lib/format";

type HeatMapProps = {
  events: Event[];
  snapshots: OddsSnapshot[];
};

type StatusFilter = "all" | "live" | "pregame";

type HeatMetric = {
  event: Event;
  market: MarketType;
  absMove: number;
  perMinute: number;
  booksMoved: number;
  direction: "up" | "down";
  latestAt: string;
};

const markets: MarketType[] = ["spread", "total", "moneyline"];
const sports = ["All", "NFL", "NBA", "NCAAB", "NCAAF"];

const formatMove = (value: number, market: MarketType) => {
  const rounded =
    market === "moneyline"
      ? Math.round(value)
      : Math.round(value * 2) / 2;
  const unit = market === "moneyline" ? "¢" : "pts";
  return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
};

const getMarketValue = (snapshot: OddsSnapshot, market: MarketType) => {
  if (market === "moneyline") {
    return snapshot.homeOdds;
  }
  return snapshot.line;
};

const buildMetric = (
  event: Event,
  market: MarketType,
  snapshots: OddsSnapshot[],
  cutoff: number
): HeatMetric | null => {
  const relevant = snapshots.filter(
    (snapshot) =>
      snapshot.eventId === event.id &&
      snapshot.market === market &&
      new Date(snapshot.timestamp).getTime() >= cutoff
  );

  if (relevant.length < 2) {
    return null;
  }

  const byBook = new Map<string, OddsSnapshot[]>();
  for (const snapshot of relevant) {
    const key = snapshot.sportsbookId ?? "consensus";
    if (!byBook.has(key)) {
      byBook.set(key, []);
    }
    byBook.get(key)?.push(snapshot);
  }

  let maxAbsMove = 0;
  let maxPerMinute = 0;
  let booksUp = 0;
  let booksDown = 0;
  let latestAt = relevant[0].timestamp;

  for (const snapshotsByBook of byBook.values()) {
    const sorted = snapshotsByBook.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta =
      getMarketValue(last, market) - getMarketValue(first, market);
    if (delta > 0) {
      booksUp += 1;
    } else if (delta < 0) {
      booksDown += 1;
    }

    const minutes =
      (new Date(last.timestamp).getTime() -
        new Date(first.timestamp).getTime()) /
      60000;
    const absMove = Math.abs(delta);
    const perMinute = minutes > 0 ? absMove / minutes : absMove;

    if (absMove > maxAbsMove) {
      maxAbsMove = absMove;
    }
    if (perMinute > maxPerMinute) {
      maxPerMinute = perMinute;
    }
    if (new Date(last.timestamp).getTime() > new Date(latestAt).getTime()) {
      latestAt = last.timestamp;
    }
  }

  if (!maxAbsMove) {
    return null;
  }

  return {
    event,
    market,
    absMove: maxAbsMove,
    perMinute: maxPerMinute,
    booksMoved: Math.max(booksUp, booksDown),
    direction: booksUp >= booksDown ? "up" : "down",
    latestAt
  };
};

export default function HeatMap({ events, snapshots }: HeatMapProps) {
  const [sportFilter, setSportFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [marketFilter, setMarketFilter] = useState<MarketType>("spread");

  const metrics = useMemo(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;

    return events
      .filter((event) => (sportFilter === "All" ? true : event.sport === sportFilter))
      .filter((event) => {
        if (statusFilter === "live") {
          return event.isLive;
        }
        if (statusFilter === "pregame") {
          return !event.isLive;
        }
        return true;
      })
      .map((event) => buildMetric(event, marketFilter, snapshots, cutoff))
      .filter((item): item is HeatMetric => Boolean(item));
  }, [events, marketFilter, snapshots, sportFilter, statusFilter]);

  const biggest = useMemo(
    () => metrics.slice().sort((a, b) => b.absMove - a.absMove)[0] ?? null,
    [metrics]
  );
  const fastest = useMemo(
    () => metrics.slice().sort((a, b) => b.perMinute - a.perMinute)[0] ?? null,
    [metrics]
  );
  const confirmed = useMemo(
    () => metrics.slice().sort((a, b) => b.booksMoved - a.booksMoved)[0] ?? null,
    [metrics]
  );

  const renderTile = (
    metric: HeatMetric | null,
    title: string,
    subtitle: string,
    value: string
  ) => {
    if (!metric) {
      return (
        <div className="heat-tile">
          <div className="label">{title}</div>
          <div className="meta">{subtitle}</div>
          <div className="heat-empty">No movement signals yet.</div>
        </div>
      );
    }

    return (
      <Link className="heat-tile" href={`/event/${metric.event.id}`}>
        <div className="label">{title}</div>
        <div className="heat-event">
          {metric.event.awayTeam} @ {metric.event.homeTeam}
        </div>
        <div className="meta">
          {metric.market.toUpperCase()} ·{" "}
          {metric.event.isLive ? "Live" : "Pregame"} ·{" "}
          {formatLocalTime(metric.latestAt)}
        </div>
        <div className="heat-value">{value}</div>
      </Link>
    );
  };

  return (
    <div className="heat-map">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Market Heat</h3>
          <p className="meta">
            Top movers across books over the last 30 minutes.
          </p>
        </div>
      </div>
      <div className="heat-filters">
        <div className="filter-block">
          <label className="label" htmlFor="heat-sport">
            Sport
          </label>
          <select
            id="heat-sport"
            className="select"
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
          >
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="heat-market">
            Market
          </label>
          <select
            id="heat-market"
            className="select"
            value={marketFilter}
            onChange={(event) => setMarketFilter(event.target.value as MarketType)}
          >
            {markets.map((market) => (
              <option key={market} value={market}>
                {market.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-block">
          <span className="label">Status</span>
          <div className="toggle-row">
            {(["all", "live", "pregame"] as StatusFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                className={`pill${statusFilter === value ? " active" : ""}`}
                onClick={() => setStatusFilter(value)}
              >
                {value === "all"
                  ? "All"
                  : value === "live"
                  ? "Live only"
                  : "Pregame only"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="heat-grid">
        {renderTile(
          biggest,
          "Biggest move",
          "Absolute movement",
          biggest ? formatMove(biggest.absMove, biggest.market) : ""
        )}
        {renderTile(
          fastest,
          "Fastest move",
          "Points per minute",
          fastest
            ? `${formatMove(fastest.perMinute, fastest.market)}/min`
            : ""
        )}
        {renderTile(
          confirmed,
          "Most-confirmed",
          "Books moved together",
          confirmed ? `${confirmed.booksMoved} books` : ""
        )}
      </div>
    </div>
  );
}
