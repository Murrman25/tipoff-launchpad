"use client";

import { formatLocalDateTime } from "@/lib/format";
import CLVBadge from "@/src/components/CLVBadge";
import type { BetEntry } from "@/src/lib/betsStore";
import type { Event, MarketType } from "@/src/lib/contracts";

type BetRowProps = {
  bet: BetEntry;
  event?: Event;
  clvValue?: number | null;
  closingLineLabel?: string;
  showSetClose?: boolean;
  onSetClose?: (bet: BetEntry) => void;
};

const formatSigned = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
};

const resolveSideLabel = (bet: BetEntry, event?: Event) => {
  if (bet.market === "total") {
    return bet.side === "under" ? "Under" : "Over";
  }
  if (bet.side && event) {
    return bet.side === "away" ? event.awayTeam : event.homeTeam;
  }
  if (bet.team && event) {
    if (bet.team === event.awayTeam) {
      return event.awayTeam;
    }
    if (bet.team === event.homeTeam) {
      return event.homeTeam;
    }
  }
  return bet.team ?? "--";
};

const formatLineLabel = (bet: BetEntry) => {
  if (bet.market === "moneyline") {
    return formatOdds(bet.odds);
  }
  if (bet.line === undefined) {
    return "--";
  }
  if (bet.market === "total") {
    return formatSigned(bet.line, 1);
  }
  return formatSigned(bet.line, 1);
};

const formatMarketLabel = (market: MarketType) =>
  market === "moneyline" ? "Moneyline" : market === "total" ? "Total" : "Spread";

export default function BetRow({
  bet,
  event,
  clvValue,
  closingLineLabel,
  showSetClose,
  onSetClose
}: BetRowProps) {
  const eventLabel = event
    ? `${event.awayTeam} @ ${event.homeTeam}`
    : bet.eventId ?? "Event";
  const sideLabel = resolveSideLabel(bet, event);
  const marketLabel = formatMarketLabel(bet.market);

  return (
    <div className="bet-row">
      <div>
        <strong>{eventLabel}</strong>
        <div className="meta">
          {marketLabel} | {sideLabel}
        </div>
        {bet.book ? <div className="meta">Book: {bet.book}</div> : null}
      </div>
      <div>
        <div className="label">Line</div>
        <div className="bet-value">{formatLineLabel(bet)}</div>
        <div className="meta">Price {formatOdds(bet.odds)}</div>
      </div>
      <div>
        <div className="label">Stake</div>
        <div className="bet-value">${bet.stake}</div>
        <div className="meta">Placed {formatLocalDateTime(bet.placedAt)}</div>
      </div>
      <div>
        <div className="label">CLV</div>
        <CLVBadge value={clvValue} market={bet.market} />
        {closingLineLabel ? <div className="meta">Close {closingLineLabel}</div> : null}
      </div>
      <div className="bet-actions">
        {showSetClose && onSetClose ? (
          <button className="btn btn-ghost" type="button" onClick={() => onSetClose(bet)}>
            Set closing line now
          </button>
        ) : null}
      </div>
    </div>
  );
}
