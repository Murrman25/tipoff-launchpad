"use client";

import { useMemo } from "react";
import type { Event, MarketType, OddsSnapshot, Sportsbook } from "@/src/lib/contracts";
import MovementTimeline30m, {
  type MovementTimelineEvent
} from "@/src/components/MovementTimeline30m";

type MovementAttributionPanelProps = {
  event: Event;
  snapshots: OddsSnapshot[];
  sportsbooks?: Record<string, Sportsbook>;
  mode: "mock" | "real";
};

const KEY_NUMBERS = [3, 7, 10];
const WINDOW_MINUTES = 30;
const BUCKET_MINUTES = 6;

const TAG_LABELS: Record<string, string> = {
  "steam-like": "steam-like",
  "key-number": "key-number",
  buyback: "buyback",
  "live-momentum": "live-momentum",
  "book-vs-consensus": "book-vs-consensus",
  "injury-news": "injury/news"
};

const getLineValue = (snapshot: OddsSnapshot, market: MarketType) => {
  if (market === "moneyline") {
    return snapshot.homeOdds;
  }
  return snapshot.line;
};

const nearKeyNumber = (value: number) =>
  KEY_NUMBERS.some((key) => Math.abs(Math.abs(value) - key) <= 0.5);

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

const buildBookMoves = (
  snapshots: OddsSnapshot[],
  market: MarketType,
  targetDelta: number
) => {
  const byBook = new Map<string, OddsSnapshot[]>();
  for (const snapshot of snapshots) {
    const book = snapshot.sportsbookId ?? "consensus";
    if (!byBook.has(book)) {
      byBook.set(book, []);
    }
    byBook.get(book)?.push(snapshot);
  }

  const books: string[] = [];
  for (const [book, items] of byBook.entries()) {
    const sorted = items.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = getLineValue(last, market) - getLineValue(first, market);
    if (Math.sign(delta) === Math.sign(targetDelta)) {
      books.push(book);
    }
  }
  return books;
};

const buildMockMovements = (
  event: Event,
  snapshots: OddsSnapshot[]
): MovementTimelineEvent[] => {
  const cutoff = Date.now() - WINDOW_MINUTES * 60 * 1000;
  const recent = snapshots.filter(
    (snapshot) =>
      snapshot.eventId === event.id &&
      new Date(snapshot.timestamp).getTime() >= cutoff
  );

  const byMarket = new Map<MarketType, OddsSnapshot[]>();
  for (const snapshot of recent) {
    if (!byMarket.has(snapshot.market)) {
      byMarket.set(snapshot.market, []);
    }
    byMarket.get(snapshot.market)?.push(snapshot);
  }

  const events: MovementTimelineEvent[] = [];

  for (const [market, marketSnapshots] of byMarket.entries()) {
    const sorted = marketSnapshots.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    let lastDelta = 0;
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const oldValue = getLineValue(previous, market);
      const newValue = getLineValue(current, market);
      const delta = newValue - oldValue;
      if (!delta) {
        continue;
      }

      const currentTime = new Date(current.timestamp).getTime();
      const bucketCutoff = currentTime - BUCKET_MINUTES * 60 * 1000;
      const bucket = sorted.filter(
        (snapshot) => {
          const time = new Date(snapshot.timestamp).getTime();
          return time >= bucketCutoff && time <= currentTime;
        }
      );

      const books = buildBookMoves(bucket, market, delta);
      const tags = new Set<string>();

      if (books.length >= 3) {
        tags.add("steam-like");
      }
      if (market === "spread" && (nearKeyNumber(oldValue) || nearKeyNumber(newValue))) {
        tags.add("key-number");
      }
      if (lastDelta && Math.sign(lastDelta) !== Math.sign(delta)) {
        tags.add("buyback");
      }
      const deltaMinutes =
        (new Date(current.timestamp).getTime() -
          new Date(previous.timestamp).getTime()) /
        60000;
      if (
        event.isLive &&
        Math.abs(delta) >= (market === "moneyline" ? 20 : 1) &&
        deltaMinutes <= 6
      ) {
        tags.add("live-momentum");
      }

      const latestByBook = new Map<string, OddsSnapshot>();
      for (const snapshot of bucket) {
        const key = snapshot.sportsbookId ?? "consensus";
        const existing = latestByBook.get(key);
        if (
          !existing ||
          new Date(snapshot.timestamp).getTime() >
            new Date(existing.timestamp).getTime()
        ) {
          latestByBook.set(key, snapshot);
        }
      }
      const values = Array.from(latestByBook.values()).map((snapshot) =>
        getLineValue(snapshot, market)
      );
      const medianValue = median(values);
      const gap = Math.abs(newValue - medianValue);
      const gapThreshold = market === "moneyline" ? 15 : 0.5;
      if (gap >= gapThreshold) {
        tags.add("book-vs-consensus");
      }

      let confidence: MovementTimelineEvent["confidence"] = "low";
      if (books.length >= 3 || tags.has("steam-like")) {
        confidence = "high";
      } else if (books.length >= 2 || tags.size >= 2) {
        confidence = "med";
      }

      events.push({
        id: `${event.id}-${market}-${current.timestamp}`,
        timestamp: current.timestamp,
        market,
        oldValue,
        newValue,
        books,
        confidence,
        tags: Array.from(tags)
      });

      lastDelta = delta;
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 6);
};

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

const buildFallbackMovements = (event: Event): MovementTimelineEvent[] => [
  {
    id: `${event.id}-steam-${minutesAgo(6)}`,
    timestamp: minutesAgo(6),
    market: "spread",
    oldValue: -4.5,
    newValue: -5.5,
    books: ["dk", "fd", "mgm"],
    confidence: "high",
    tags: ["steam-like"]
  },
  {
    id: `${event.id}-key-${minutesAgo(14)}`,
    timestamp: minutesAgo(14),
    market: "spread",
    oldValue: 2.5,
    newValue: 3,
    books: ["dk", "caesars"],
    confidence: "med",
    tags: ["key-number", "book-vs-consensus"]
  },
  {
    id: `${event.id}-momentum-${minutesAgo(21)}`,
    timestamp: minutesAgo(21),
    market: "moneyline",
    oldValue: -145,
    newValue: -175,
    books: ["fd", "mgm"],
    confidence: "med",
    tags: ["live-momentum", "buyback"]
  }
];

const buildMockInjuries = (event: Event) => {
  const map: Record<string, string[]> = {
    NFL: [
      "Questionable: WR1 (hamstring)",
      "Limited: CB2 (illness)"
    ],
    NBA: [
      "Questionable: lead guard (ankle)",
      "Out: starting center (knee)"
    ],
    NCAAB: [
      "Probable: top scorer (ankle)",
      "Questionable: forward (illness)"
    ],
    NCAAF: [
      "Questionable: QB1 (shoulder)",
      "Limited: RB2 (ankle)"
    ]
  };

  const notes = map[event.sport] ?? [
    "Questionable: key starter (lower body)",
    "Limited: rotation player (illness)"
  ];

  return [
    `${event.awayTeam}: ${notes[0]}`,
    `${event.homeTeam}: ${notes[1]}`
  ];
};

export default function MovementAttributionPanel({
  event,
  snapshots,
  sportsbooks,
  mode
}: MovementAttributionPanelProps) {
  const isMock = mode === "mock";

  const movementEvents = useMemo(() => {
    if (!isMock) {
      return [];
    }
    const derived = buildMockMovements(event, snapshots);
    return derived.length ? derived : buildFallbackMovements(event);
  }, [event, isMock, snapshots]);

  const tagItems = useMemo(() => {
    const set = new Set<string>();
    movementEvents.forEach((movement) => {
      movement.tags.forEach((tag) => set.add(tag));
    });
    if (isMock) {
      set.add("injury-news");
    }
    if (!isMock && set.size === 0) {
      return [
        {
          key: "injury-news",
          label: TAG_LABELS["injury-news"],
          muted: true
        }
      ];
    }
    return Array.from(set).map((tag) => ({
      key: tag,
      label: TAG_LABELS[tag] ?? tag,
      muted: false
    }));
  }, [isMock, movementEvents]);

  const injuries = useMemo(() => {
    if (!isMock) {
      return [];
    }
    return buildMockInjuries(event);
  }, [event, isMock]);

  return (
    <div className="movement-panel">
      <div className="panel-header">
        <div>
          <h3 className="panel-title">Why did it move?</h3>
          <p className="meta">
            Attribution signals from the last {WINDOW_MINUTES} minutes.
          </p>
        </div>
        <div className="meta">
          {movementEvents.length} events
        </div>
      </div>
      <div className="movement-tags">
        {tagItems.length ? (
          tagItems.map((tag) => (
            <span
              key={tag.key}
              className={`tag tag-${tag.key}${tag.muted ? " tag-muted" : ""}`}
            >
              {tag.label}
            </span>
          ))
        ) : (
          <span className="tag tag-muted">No attribution tags yet</span>
        )}
      </div>
      <div className="movement-injury">
        <div className="label">Injury / News</div>
        {isMock ? (
          <div className="movement-injury-list">
            {injuries.map((item) => (
              <div key={item} className="movement-injury-item">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="meta">Connect provider to surface live news.</div>
        )}
      </div>
      <MovementTimeline30m events={movementEvents} sportsbooks={sportsbooks} />
    </div>
  );
}
