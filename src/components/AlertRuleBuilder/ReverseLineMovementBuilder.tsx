"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel } from "./constants";
import { formatSignedNumber } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type ReverseLineMovementBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

export default function ReverseLineMovementBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: ReverseLineMovementBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [lineMove, setLineMove] = useState(1.5);
  const [ticketPercent, setTicketPercent] = useState(70);
  const [handlePercent, setHandlePercent] = useState(45);
  const [isLive, setIsLive] = useState(false);

  const summary = useMemo(() => {
    return `Alert me on RLM: line move ${formatSignedNumber(
      lineMove,
      1
    )} with tickets ${ticketPercent}% and handle ${handlePercent}%`;
  }, [handlePercent, lineMove, ticketPercent]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "RLM",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market: "spread",
      team,
      lineMove,
      ticketPercent,
      handlePercent,
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="rlm-event">
            Event
          </label>
          <select
            id="rlm-event"
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
          <label className="label" htmlFor="rlm-team">
            Team
          </label>
          <select
            id="rlm-team"
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
          <label className="label" htmlFor="rlm-line-move">
            Line move
          </label>
          <input
            id="rlm-line-move"
            className="input"
            type="number"
            step={0.5}
            value={lineMove}
            onChange={(eventItem) => setLineMove(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="rlm-ticket">
            Ticket %
          </label>
          <input
            id="rlm-ticket"
            className="input"
            type="number"
            value={ticketPercent}
            onChange={(eventItem) =>
              setTicketPercent(Number(eventItem.target.value))
            }
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="rlm-handle">
            Handle %
          </label>
          <input
            id="rlm-handle"
            className="input"
            type="number"
            value={handlePercent}
            onChange={(eventItem) =>
              setHandlePercent(Number(eventItem.target.value))
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
        Create RLM alert
      </button>
    </div>
  );
}
