"use client";

import { useEffect, useMemo, useState } from "react";
import type { Event, MarketType } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel, markets } from "./constants";
import { formatMarketValue } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type ThresholdAtBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

type TotalSide = "over" | "under";

const summaryPrefix = (isLive: boolean) => (isLive ? "LIVE" : "PREGAME");

export default function ThresholdAtBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: ThresholdAtBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [market, setMarket] = useState<MarketType>("spread");
  const [threshold, setThreshold] = useState(10.5);
  const [direction, setDirection] = useState<"gte" | "lte">("gte");
  const [isLive, setIsLive] = useState(true);
  const [totalSide, setTotalSide] = useState<TotalSide>("over");

  useEffect(() => {
    if (market === "total") {
      setDirection("gte");
    }
  }, [market]);

  const summary = useMemo(() => {
    const prefix = summaryPrefix(isLive);
    const formatted = formatMarketValue(threshold, market);
    if (market === "total") {
      const sideLabel = totalSide === "over" ? "Over" : "Under";
      return `Alert me ${prefix} if ${sideLabel} reaches ${formatted} at any point`;
    }
    const target = team || "the team";
    return `Alert me ${prefix} if ${target} reaches ${formatted} at any point`;
  }, [isLive, market, team, threshold, totalSide]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "THRESHOLD_AT",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market,
      team: market === "total" ? totalSide : team,
      threshold,
      direction,
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="threshold-at-event">
            Event
          </label>
          <select
            id="threshold-at-event"
            className="select"
            value={eventId}
            onChange={(eventItem) => setEventId(eventItem.target.value)}
          >
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {formatEventLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="threshold-at-market">
            Market
          </label>
          <select
            id="threshold-at-market"
            className="select"
            value={market}
            onChange={(eventItem) => setMarket(eventItem.target.value as MarketType)}
          >
            {markets.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        {market === "total" ? (
          <div className="filter-block">
            <label className="label" htmlFor="threshold-at-total-side">
              Side
            </label>
            <select
              id="threshold-at-total-side"
              className="select"
              value={totalSide}
              onChange={(eventItem) =>
                setTotalSide(eventItem.target.value as TotalSide)
              }
            >
              <option value="over">Over</option>
              <option value="under">Under</option>
            </select>
          </div>
        ) : (
          <div className="filter-block">
            <label className="label" htmlFor="threshold-at-team">
              Team
            </label>
            <select
              id="threshold-at-team"
              className="select"
              value={team}
              onChange={(eventItem) => setTeam(eventItem.target.value)}
            >
              {teamOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="filter-block">
          <label className="label" htmlFor="threshold-at-value">
            Threshold
          </label>
          <input
            id="threshold-at-value"
            className="input"
            type="number"
            step={market === "moneyline" ? 1 : 0.5}
            value={threshold}
            onChange={(eventItem) => setThreshold(Number(eventItem.target.value))}
          />
        </div>
        {market !== "total" ? (
          <div className="filter-block">
            <label className="label" htmlFor="threshold-at-direction">
              Direction
            </label>
            <select
              id="threshold-at-direction"
              className="select"
              value={direction}
              onChange={(eventItem) =>
                setDirection(eventItem.target.value as "gte" | "lte")
              }
            >
              <option value="gte">At or above</option>
              <option value="lte">At or below</option>
            </select>
          </div>
        ) : null}
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={isLive}
          onChange={(eventItem) => setIsLive(eventItem.target.checked)}
        />
        Live-only alert
      </label>
      {disabledReason ? <div className="notice info">{disabledReason}</div> : null}
      {quietHoursActive ? (
        <div className="notice info">
          Quiet hours are active. Mock notifications will be muted.
        </div>
      ) : null}
      <div className="rule-summary">{summary}</div>
      <button
        className="btn btn-primary"
        type="button"
        onClick={handleCreate}
        disabled={!canCreate || isCreating}
      >
        Create threshold alert
      </button>
    </div>
  );
}
