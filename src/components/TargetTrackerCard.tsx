"use client";

import { useMemo } from "react";
import { formatLocalDateTime } from "@/lib/format";
import type { Event, TargetTracker } from "@/src/lib/contracts";

export type TargetMetrics = {
  bestValue?: number;
  bestLineLabel: string;
  bestBookLabel: string;
  distanceLabel: string;
  progress: number;
  hit: boolean;
};

type TargetTrackerCardProps = {
  tracker: TargetTracker;
  event?: Event;
  metrics?: TargetMetrics;
  now: number;
  isUpdating?: boolean;
  onToggleNotify: (tracker: TargetTracker, nextValue: boolean) => void;
  onToggleAutoRearm: (tracker: TargetTracker, nextValue: boolean) => void;
  onDelete: (tracker: TargetTracker) => void;
};

const formatSignedNumber = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatSignedMoney = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
};

const formatPlainNumber = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  return rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
};

const formatCountdown = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  const paddedSeconds = seconds.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${paddedMinutes}:${paddedSeconds}`;
};

export default function TargetTrackerCard({
  tracker,
  event,
  metrics,
  now,
  isUpdating,
  onToggleNotify,
  onToggleAutoRearm,
  onDelete
}: TargetTrackerCardProps) {
  const statusLabel = tracker.armed
    ? "Tracking"
    : tracker.autoRearm
    ? "Cooldown"
    : "Triggered";

  const sideLabel = useMemo(() => {
    if (tracker.market === "total") {
      return tracker.side === "over" ? "Over" : "Under";
    }
    if (!event) {
      return tracker.side === "away" ? "Away" : "Home";
    }
    return tracker.side === "away" ? event.awayTeam : event.homeTeam;
  }, [event, tracker.market, tracker.side]);

  const marketLabel = tracker.market === "moneyline"
    ? "Moneyline"
    : tracker.market === "total"
    ? "Total"
    : "Spread";

  const targetLabel = useMemo(() => {
    if (tracker.market === "moneyline") {
      return formatSignedMoney(tracker.target);
    }
    if (tracker.market === "total") {
      return formatPlainNumber(tracker.target, 1);
    }
    return formatSignedNumber(tracker.target, 1);
  }, [tracker.market, tracker.target]);

  const remainingSeconds = useMemo(() => {
    if (!tracker.nextRearmAt || tracker.armed) {
      return 0;
    }
    const diffMs = new Date(tracker.nextRearmAt).getTime() - now;
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [now, tracker.armed, tracker.nextRearmAt]);

  const progress = metrics ? Math.round(metrics.progress * 100) : 0;
  const bestLineLabel = metrics?.bestLineLabel ?? "--";
  const bestBookLabel = metrics?.bestBookLabel ?? "Waiting for book data";
  const distanceLabel = metrics?.distanceLabel ?? "--";

  return (
    <div className="target-card">
      <div className="target-header">
        <div>
          <div className="target-title">
            {event ? `${event.awayTeam} @ ${event.homeTeam}` : "Event"}
          </div>
          <div className="target-subtitle">
            {marketLabel} target {targetLabel} | {sideLabel}
          </div>
          <div className="meta">
            {event?.sport ?? tracker.sport} | {tracker.isLive ? "Live" : "Pregame"}
          </div>
        </div>
        <div className="target-status">{statusLabel}</div>
      </div>

      <div className="target-metrics">
        <div>
          <div className="label">Best line now</div>
          <div className="target-value">{bestLineLabel}</div>
          <div className="meta">{bestBookLabel}</div>
        </div>
        <div>
          <div className="label">Distance to target</div>
          <div className="target-value">{distanceLabel}</div>
          <div className="meta">{metrics?.hit ? "Target hit" : "Watching for movement"}</div>
        </div>
      </div>

      <div className="target-progress">
        <div className="target-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="target-status-row">
        <div className="meta">Last hit: {tracker.lastHitAt ? formatLocalDateTime(tracker.lastHitAt) : "--"}</div>
        {tracker.autoRearm && !tracker.armed && tracker.nextRearmAt ? (
          <div className="meta">Re-armed in {formatCountdown(remainingSeconds)}</div>
        ) : null}
      </div>

      <div className="target-actions">
        <label className="toggle">
          <input
            type="checkbox"
            checked={tracker.notifyOnHit}
            disabled={isUpdating}
            onChange={(eventItem) => onToggleNotify(tracker, eventItem.target.checked)}
          />
          Notify when hit
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={tracker.autoRearm}
            disabled={isUpdating}
            onChange={(eventItem) => onToggleAutoRearm(tracker, eventItem.target.checked)}
          />
          Auto-rearm
        </label>
        <button
          className="btn btn-danger"
          type="button"
          onClick={() => onDelete(tracker)}
          disabled={isUpdating}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
