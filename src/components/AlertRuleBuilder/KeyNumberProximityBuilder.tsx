"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel } from "./constants";
import { formatSignedNumber } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type KeyNumberProximityBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

export default function KeyNumberProximityBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: KeyNumberProximityBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [keyNumber, setKeyNumber] = useState(3);
  const [distance, setDistance] = useState(0.5);
  const [isLive, setIsLive] = useState(true);

  const summary = useMemo(() => {
    const prefix = isLive ? "LIVE" : "PREGAME";
    return `Alert me ${prefix} if spread nears key number ${keyNumber} within ${formatSignedNumber(
      distance,
      1
    )}`;
  }, [distance, isLive, keyNumber]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "KEY_NUMBER_PROXIMITY",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market: "spread",
      team,
      keyNumber,
      distance,
      leagues: [event.sport],
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="key-number-event">
            Event
          </label>
          <select
            id="key-number-event"
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
          <label className="label" htmlFor="key-number-team">
            Team
          </label>
          <select
            id="key-number-team"
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
        <div className="filter-block">
          <label className="label" htmlFor="key-number-value">
            Key number
          </label>
          <input
            id="key-number-value"
            className="input"
            type="number"
            step={0.5}
            value={keyNumber}
            onChange={(eventItem) => setKeyNumber(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="key-number-distance">
            Proximity
          </label>
          <input
            id="key-number-distance"
            className="input"
            type="number"
            step={0.5}
            value={distance}
            onChange={(eventItem) => setDistance(Number(eventItem.target.value))}
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
        Create key number alert
      </button>
    </div>
  );
}
