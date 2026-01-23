"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel } from "./constants";
import { formatSignedNumber } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type BuybackBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

export default function BuybackBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: BuybackBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [originalLine, setOriginalLine] = useState(-3.5);
  const [returnLine, setReturnLine] = useState(-2.5);
  const [windowMinutes, setWindowMinutes] = useState(12);
  const [isLive, setIsLive] = useState(true);

  const summary = useMemo(() => {
    return `Alert me on buyback: move from ${formatSignedNumber(
      originalLine,
      1
    )} back to ${formatSignedNumber(returnLine, 1)} within ${windowMinutes} min`;
  }, [originalLine, returnLine, windowMinutes]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "BUYBACK",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market: "spread",
      team,
      originalLine,
      returnLine,
      windowMinutes,
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="buyback-event">
            Event
          </label>
          <select
            id="buyback-event"
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
          <label className="label" htmlFor="buyback-team">
            Team
          </label>
          <select
            id="buyback-team"
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
          <label className="label" htmlFor="buyback-original">
            Original line
          </label>
          <input
            id="buyback-original"
            className="input"
            type="number"
            step={0.5}
            value={originalLine}
            onChange={(eventItem) =>
              setOriginalLine(Number(eventItem.target.value))
            }
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="buyback-return">
            Return line
          </label>
          <input
            id="buyback-return"
            className="input"
            type="number"
            step={0.5}
            value={returnLine}
            onChange={(eventItem) => setReturnLine(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="buyback-window">
            Window (min)
          </label>
          <input
            id="buyback-window"
            className="input"
            type="number"
            value={windowMinutes}
            onChange={(eventItem) =>
              setWindowMinutes(Number(eventItem.target.value))
            }
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
        Create buyback alert
      </button>
    </div>
  );
}
