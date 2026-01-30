"use client";

import Link from "../adapters/Link";
import { useMemo } from "react";
import type { Event, MarketType, OddsSnapshot } from "@/src/lib/contracts";
import { formatLocalTime } from "@/lib/format";

type SteamRadarProps = {
  events: Event[];
  snapshots: OddsSnapshot[];
  minBooks?: number;
  windowMinutes?: number;
};

type SteamSignal = {
  event: Event;
  market: MarketType;
  direction: "up" | "down";
  booksMoved: number;
  avgMove: number;
  latestAt: string;
};

const getMarketValue = (snapshot: OddsSnapshot, market: MarketType) => {
  if (market === "moneyline") {
    return snapshot.homeOdds;
  }
  return snapshot.line;
};

const formatMove = (value: number, market: MarketType) => {
  const rounded =
    market === "moneyline"
      ? Math.round(value)
      : Math.round(value * 2) / 2;
  const unit = market === "moneyline" ? "¢" : "pts";
  return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
};

export default function SteamRadar({
  events,
  snapshots,
  minBooks = 3,
  windowMinutes = 8
}: SteamRadarProps) {
  const signals = useMemo(() => {
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    const recent = snapshots.filter(
      (snapshot) => new Date(snapshot.timestamp).getTime() >= cutoff
    );
    const eventMap = new Map(events.map((event) => [event.id, event]));
    const byEventMarket = new Map<string, OddsSnapshot[]>();

    for (const snapshot of recent) {
      const key = `${snapshot.eventId}::${snapshot.market}`;
      if (!byEventMarket.has(key)) {
        byEventMarket.set(key, []);
      }
      byEventMarket.get(key)?.push(snapshot);
    }

    const results: SteamSignal[] = [];

    for (const [key, batch] of byEventMarket.entries()) {
      const [eventId, market] = key.split("::") as [string, MarketType];
      const event = eventMap.get(eventId);
      if (!event) {
        continue;
      }
      const byBook = new Map<string, OddsSnapshot[]>();
      for (const snapshot of batch) {
        const book = snapshot.sportsbookId ?? "consensus";
        if (!byBook.has(book)) {
          byBook.set(book, []);
        }
        byBook.get(book)?.push(snapshot);
      }

      let booksUp = 0;
      let booksDown = 0;
      let latestAt = batch[0]?.timestamp ?? new Date().toISOString();
      const moves: number[] = [];

      for (const snapshotsByBook of byBook.values()) {
        const sorted = snapshotsByBook.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        if (new Date(last.timestamp).getTime() > new Date(latestAt).getTime()) {
          latestAt = last.timestamp;
        }
        const delta =
          getMarketValue(last, market) - getMarketValue(first, market);
        if (delta > 0) {
          booksUp += 1;
          moves.push(Math.abs(delta));
        } else if (delta < 0) {
          booksDown += 1;
          moves.push(Math.abs(delta));
        }
      }

      const booksMoved = Math.max(booksUp, booksDown);
      if (booksMoved < minBooks) {
        continue;
      }

      const avgMove =
        moves.length > 0 ? moves.reduce((a, b) => a + b, 0) / moves.length : 0;
      results.push({
        event,
        market,
        direction: booksUp >= booksDown ? "up" : "down",
        booksMoved,
        avgMove,
        latestAt
      });
    }

    return results
      .sort((a, b) => b.booksMoved - a.booksMoved || b.avgMove - a.avgMove)
      .slice(0, 5);
  }, [events, minBooks, snapshots, windowMinutes]);

  return (
    <div className="steam-radar">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Steam Radar</h3>
          <p className="meta">
            {minBooks}+ books moving the same way in the last {windowMinutes} minutes.
          </p>
        </div>
        <div className="meta">{signals.length} signals</div>
      </div>
      {signals.length === 0 ? (
        <div className="notice">No steam signals in the current window.</div>
      ) : (
        <div className="steam-list">
          {signals.map((signal) => (
            <Link
              key={`${signal.event.id}-${signal.market}`}
              className="steam-row"
              href={`/event/${signal.event.id}`}
            >
              <div>
                <div className="steam-event">
                  {signal.event.awayTeam} @ {signal.event.homeTeam}
                </div>
                <div className="meta">
                  {signal.market.toUpperCase()} ·{" "}
                  {signal.direction === "up" ? "Up" : "Down"} ·{" "}
                  {formatLocalTime(signal.latestAt)}
                </div>
              </div>
              <div className="steam-meta">
                <div className="steam-value">
                  {formatMove(signal.avgMove, signal.market)}
                </div>
                <div className="meta">{signal.booksMoved} books</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
