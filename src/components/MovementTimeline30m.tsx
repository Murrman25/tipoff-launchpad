"use client";

import { formatLocalTime } from "@/lib/format";
import type { MarketType, Sportsbook } from "@/src/lib/contracts";

export type MovementTimelineEvent = {
  id: string;
  timestamp: string;
  market: MarketType;
  oldValue: number;
  newValue: number;
  books: string[];
  confidence: "low" | "med" | "high";
  tags: string[];
};

type MovementTimeline30mProps = {
  events: MovementTimelineEvent[];
  sportsbooks?: Record<string, Sportsbook>;
};

const formatLine = (value: number, market: MarketType) => {
  if (market === "moneyline") {
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded}`;
  }
  const rounded = Math.round(value * 2) / 2;
  const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded > 0 ? "+" : ""}${formatted}`;
};

const formatBooks = (books: string[], sportsbooks?: Record<string, Sportsbook>) => {
  if (!books.length) {
    return "Consensus";
  }
  const labels = books.map((bookId) => {
    const book = sportsbooks?.[bookId];
    return book?.shortName ?? book?.name ?? bookId;
  });
  if (labels.length > 3) {
    return `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
  }
  return labels.join(", ");
};

const confidenceLabel: Record<MovementTimelineEvent["confidence"], string> = {
  low: "Low",
  med: "Med",
  high: "High"
};

export default function MovementTimeline30m({
  events,
  sportsbooks
}: MovementTimeline30mProps) {
  if (!events.length) {
    return <div className="notice">No attribution events in the last 30 minutes.</div>;
  }

  return (
    <div className="movement-timeline">
      {events.map((item) => (
        <div key={item.id} className="movement-row">
          <div className="movement-time">{formatLocalTime(item.timestamp)}</div>
          <div className="movement-detail">
            <div className="movement-market">{item.market.toUpperCase()}</div>
            <div className="movement-line">
              {formatLine(item.oldValue, item.market)} {"->"}{" "}
              {formatLine(item.newValue, item.market)}
            </div>
            <div className="movement-books">Books: {formatBooks(item.books, sportsbooks)}</div>
            {item.tags.length ? (
              <div className="movement-tags-inline">
                {item.tags.map((tag) => (
                  <span key={tag} className={`tag tag-${tag}`}>
                    {tag.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className={`movement-confidence ${item.confidence}`}>
            {confidenceLabel[item.confidence]} confidence
          </div>
        </div>
      ))}
    </div>
  );
}
