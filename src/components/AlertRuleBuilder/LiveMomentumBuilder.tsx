"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/src/lib/contracts";
import type { CreateAlertRulePayload } from "@/src/lib/api";
import { formatEventLabel } from "./constants";
import { formatSignedNumber } from "./formatting";
import { useEventSelection, useTeamSelection } from "./hooks";

type LiveMomentumBuilderProps = {
  events: Event[];
  isCreating: boolean;
  disabledReason?: string;
  quietHoursActive: boolean;
  onCreate: (payload: CreateAlertRulePayload, summary: string) => void;
};

export default function LiveMomentumBuilder({
  events,
  isCreating,
  disabledReason,
  quietHoursActive,
  onCreate
}: LiveMomentumBuilderProps) {
  const { event, eventId, setEventId } = useEventSelection(events);
  const { team, setTeam, teamOptions } = useTeamSelection(event);
  const [runPoints, setRunPoints] = useState(8);
  const [runSeconds, setRunSeconds] = useState(90);
  const [minLineMove, setMinLineMove] = useState(1.5);
  const [isLive, setIsLive] = useState(true);

  const summary = useMemo(() => {
    return `Alert me LIVE when ${team || "a team"} runs ${runPoints} pts in ${runSeconds}s and moves the line ${formatSignedNumber(
      minLineMove,
      1
    )}`;
  }, [minLineMove, runPoints, runSeconds, team]);

  const canCreate = Boolean(event) && !disabledReason;

  const handleCreate = () => {
    if (!event) {
      return;
    }
    const payload: CreateAlertRulePayload = {
      type: "LIVE_MOMENTUM",
      isLive,
      eventId: event.id,
      sport: event.sport,
      market: "spread",
      team,
      runPoints,
      runSeconds,
      minLineMove,
      name: summary
    };
    onCreate(payload, summary);
  };

  return (
    <div className="rule-builder">
      <div className="rule-builder-grid">
        <div className="filter-block">
          <label className="label" htmlFor="momentum-event">
            Event
          </label>
          <select
            id="momentum-event"
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
          <label className="label" htmlFor="momentum-team">
            Team
          </label>
          <select
            id="momentum-team"
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
          <label className="label" htmlFor="momentum-points">
            Run points
          </label>
          <input
            id="momentum-points"
            className="input"
            type="number"
            value={runPoints}
            onChange={(eventItem) => setRunPoints(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="momentum-seconds">
            Run seconds
          </label>
          <input
            id="momentum-seconds"
            className="input"
            type="number"
            value={runSeconds}
            onChange={(eventItem) => setRunSeconds(Number(eventItem.target.value))}
          />
        </div>
        <div className="filter-block">
          <label className="label" htmlFor="momentum-line-move">
            Min line move
          </label>
          <input
            id="momentum-line-move"
            className="input"
            type="number"
            step={0.5}
            value={minLineMove}
            onChange={(eventItem) =>
              setMinLineMove(Number(eventItem.target.value))
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
        Create momentum alert
      </button>
    </div>
  );
}
