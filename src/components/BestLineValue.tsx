"use client";

import { useMemo } from "react";
import type { MarketType, OddsSnapshot, Sportsbook } from "@/src/lib/contracts";

type BestLineValueProps = {
  eventId: string;
  market: MarketType;
  side: "away" | "home";
  sideLabel: string;
  snapshots: OddsSnapshot[];
  sportsbooks?: Record<string, Sportsbook>;
};

const formatSigned = (value: number) => {
  const rounded = Math.round(value * 2) / 2;
  const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${formatted}`;
};

const formatSignedMoney = (value: number) => {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
};

const formatLineValue = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return formatSigned(value);
};

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value > 0 ? "+" : ""}${Math.round(value)}`;
};

const median = (values: number[]) => {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
};

const getSnapshotValue = (
  snapshot: OddsSnapshot,
  market: MarketType,
  sideKey: "home" | "away" | "over" | "under"
) => {
  if (market === "moneyline") {
    return sideKey === "home" ? snapshot.homeOdds : snapshot.awayOdds;
  }
  if (market === "total") {
    return snapshot.line;
  }
  const line = snapshot.line;
  return sideKey === "home" ? line : -line;
};

export default function BestLineValue({
  eventId,
  market,
  side,
  sideLabel,
  snapshots,
  sportsbooks
}: BestLineValueProps) {
  const derived = useMemo(() => {
    const relevant = snapshots.filter(
      (snapshot) =>
        snapshot.eventId === eventId &&
        snapshot.market === market &&
        snapshot.sportsbookId
    );
    if (!relevant.length) {
      return null;
    }

    const latestByBook = new Map<string, OddsSnapshot>();
    for (const snapshot of relevant) {
      const key = snapshot.sportsbookId as string;
      const existing = latestByBook.get(key);
      if (
        !existing ||
        new Date(snapshot.timestamp).getTime() >
          new Date(existing.timestamp).getTime()
      ) {
        latestByBook.set(key, snapshot);
      }
    }

    const entries = Array.from(latestByBook.values());
    if (!entries.length) {
      return null;
    }

    const sideKey =
      market === "total" ? (side === "away" ? "over" : "under") : side;

    const values = entries.map((snapshot) =>
      getSnapshotValue(snapshot, market, sideKey)
    );

    const bestPrefersLower = market === "total" && sideKey === "over";
    let bestSnapshot = entries[0];
    let bestValue = getSnapshotValue(bestSnapshot, market, sideKey);

    for (const snapshot of entries.slice(1)) {
      const value = getSnapshotValue(snapshot, market, sideKey);
      if (bestPrefersLower ? value < bestValue : value > bestValue) {
        bestValue = value;
        bestSnapshot = snapshot;
      }
    }

    const medianValue = median(values);
    const improvement =
      market === "total" && sideKey === "over"
        ? medianValue - bestValue
        : bestValue - medianValue;

    return {
      bestSnapshot,
      bestValue,
      medianValue,
      improvement,
      sideKey
    };
  }, [eventId, market, side, snapshots]);

  if (!derived) {
    return (
      <div className="best-line">
        <div className="label">Best {sideLabel}</div>
        <div className="meta">No live book data.</div>
      </div>
    );
  }

  const bookLabel = derived.bestSnapshot.sportsbookId
    ? sportsbooks?.[derived.bestSnapshot.sportsbookId]?.shortName ??
      sportsbooks?.[derived.bestSnapshot.sportsbookId]?.name ??
      derived.bestSnapshot.sportsbookId
    : "Consensus";

  const improvement =
    market === "moneyline"
      ? `${formatSignedMoney(derived.improvement)}¢ vs median`
      : `${formatSigned(derived.improvement)} pts vs median`;

  const bestLine =
    market === "moneyline"
      ? formatOdds(derived.bestValue)
      : formatLineValue(derived.bestValue);

  const sidePrefix =
    market === "total"
      ? derived.sideKey === "over"
        ? "O "
        : "U "
      : "";

  return (
    <div className="best-line">
      <div className="label">Best {sideLabel}</div>
      <div className="best-line-value">
        {sidePrefix}
        {bestLine}
      </div>
      <div className="meta">
        {improvement} · {bookLabel}
      </div>
    </div>
  );
}
