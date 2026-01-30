"use client";

import StatusBadge from "./StatusBadge";
import { formatLocalTime } from "../lib/format";
import type { DemoEvent, DemoLiveOdds, Event } from "../lib/contracts";
import OddsBlock from "./OddsBlock";

type EventCardEvent = DemoEvent | Event;

type EventCardProps = {
  event: EventCardEvent;
  showLiveLines: boolean;
  liveOdds?: DemoLiveOdds;
};

const buildScoreLine = (event: EventCardEvent) => {
  const inPlay = event.inPlayState as { score?: { away: number; home: number } } | undefined;
  const demoScore = inPlay?.score;
  const liveScore = "score" in event ? event.score : undefined;
  const score = demoScore ?? liveScore;
  if (!event.isLive || !score) {
    return null;
  }
  const { away, home } = score;
  return `${event.awayTeam} ${away} - ${event.homeTeam} ${home}`;
};

export default function EventCard({ event, showLiveLines, liveOdds }: EventCardProps) {
  const scoreLine = buildScoreLine(event);
  const odds =
    liveOdds ?? ("liveOdds" in event ? (event as DemoEvent).liveOdds : undefined);
  const updatedAt =
    "lastUpdated" in event && event.lastUpdated ? event.lastUpdated : event.startTime;

  return (
    <div className="event-card">
      <div className="event-summary">
        <strong>
          {event.awayTeam} @ {event.homeTeam}
        </strong>
        <div className="meta">
          {event.sport} - Start {formatLocalTime(event.startTime)}
        </div>
      </div>
      <div className="event-status">
        <StatusBadge
          isLive={event.isLive}
          inPlayState={event.inPlayState}
          statusText={event.statusText}
        />
        {scoreLine ? <div className="event-score">{scoreLine}</div> : null}
      </div>
      {showLiveLines && odds ? (
        <>
          <OddsBlock
            label="Live spread"
            market="spread"
            awayLabel={event.awayTeam}
            homeLabel={event.homeTeam}
            away={odds.spread.away}
            home={odds.spread.home}
          />
          <OddsBlock
            label="Live moneyline"
            market="moneyline"
            awayLabel={event.awayTeam}
            homeLabel={event.homeTeam}
            away={odds.moneyline.away}
            home={odds.moneyline.home}
          />
        </>
      ) : showLiveLines ? (
        <div className="odds-hidden">Live lines unavailable</div>
      ) : (
        <div className="odds-hidden">Live lines hidden</div>
      )}
      <div className="event-updated">
        <div className="label">Updated</div>
        <div className="meta">{formatLocalTime(updatedAt)}</div>
      </div>
    </div>
  );
}
