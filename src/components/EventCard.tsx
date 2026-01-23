"use client";

import StatusBadge from "@/components/StatusBadge";
import { formatLocalTime } from "@/lib/format";
import type { DemoEvent } from "@/src/lib/contracts";
import OddsBlock from "@/src/components/OddsBlock";

type EventCardProps = {
  event: DemoEvent;
  showLiveLines: boolean;
};

const buildScoreLine = (event: DemoEvent) => {
  if (!event.isLive || !event.inPlayState?.score) {
    return null;
  }
  const { away, home } = event.inPlayState.score;
  return `${event.awayTeam} ${away} - ${event.homeTeam} ${home}`;
};

export default function EventCard({ event, showLiveLines }: EventCardProps) {
  const scoreLine = buildScoreLine(event);

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
      {showLiveLines ? (
        <>
          <OddsBlock
            label="Live spread"
            market="spread"
            awayLabel={event.awayTeam}
            homeLabel={event.homeTeam}
            away={event.liveOdds.spread.away}
            home={event.liveOdds.spread.home}
          />
          <OddsBlock
            label="Live moneyline"
            market="moneyline"
            awayLabel={event.awayTeam}
            homeLabel={event.homeTeam}
            away={event.liveOdds.moneyline.away}
            home={event.liveOdds.moneyline.home}
          />
        </>
      ) : (
        <div className="odds-hidden">Live lines hidden</div>
      )}
      <div className="event-updated">
        <div className="label">Updated</div>
        <div className="meta">{formatLocalTime(event.lastUpdated)}</div>
      </div>
    </div>
  );
}
