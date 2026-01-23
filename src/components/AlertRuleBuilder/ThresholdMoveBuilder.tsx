"use client";

import { useMemo, useState } from "react";
import type { Event, MarketType } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel, markets } from "./constants";
import { formatMarketValue } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type ThresholdMoveBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

type MoveDirection = "up" | "down" | "any";
type TotalSide = "over" | "under";

export default function ThresholdMoveBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: ThresholdMoveBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [market, setMarket] = useState<MarketType>("spread");
  const [moveAmount, setMoveAmount] = useState(1.5);
  const [direction, setDirection] = useState<MoveDirection>("any");
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [isLive, setIsLive] = useState(true);
  const [totalSide, setTotalSide] = useState<TotalSide>("over");

  const summary = useMemo(() => {
    const formatted = formatMarketValue(moveAmount, market);
    const directionLabel =
      direction === "any" ? "moves" : direction === "up" ? "moves up" : "moves down";
    const sideLabel =
      market === "total"
        ? totalSide === "over"
          ? "Over"
          : "Under"
        : team || "the team";
    const prefix = isLive ? "LIVE" : "PREGAME";
    return `Alert me ${prefix} if ${sideLabel} ${directionLabel} ${formatted} within ${windowMinutes} min`;
  }, [direction, isLive, market, moveAmount, team, totalSide, windowMinutes]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "THRESHOLD_MOVE",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market,
      team: market === "total" ? totalSide : team,
      moveAmount,
      direction,
      windowMinutes,
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="threshold-move-event">
            Event
          </label>
          <select
            id="threshold-move-event"
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
          <label className="label" htmlFor="threshold-move-market">
            Market
          </label>
          <select
            id="threshold-move-market"
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
            <label className="label" htmlFor="threshold-move-side">
              Side
            </label>
            <select
              id="threshold-move-side"
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
            <label className="label" htmlFor="threshold-move-team">
              Team
            </label>
            <select
              id="threshold-move-team"
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
          <label className="label" htmlFor="threshold-move-amount">
            Move amount
          </label>
          <input
            id="threshold-move-amount"
            className="input"
            type="number"
            step={market === "moneyline" ? 1 : 0.5}
            value={moveAmount}
            onChange={(eventItem) => setMoveAmount(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="threshold-move-direction">
            Direction
          </label>
          <select
            id="threshold-move-direction"
            className="select"
            value={direction}
            onChange={(eventItem) =>
              setDirection(eventItem.target.value as MoveDirection)
            }
          >
            <option value="any">Either direction</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
          </select>
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="threshold-move-window">
            Window (min)
          </label>
          <input
            id="threshold-move-window"
            className="input"
            type="number"
            value={windowMinutes}
            onChange={(eventItem) => setWindowMinutes(Number(eventItem.target.value))}
          />
        </div>
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
        Create threshold move alert
      </button>
    </div>
  );
}
