"use client";

import { useEffect, useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import {
  createAlertRule,
  createTargetTracker,
  deleteAlertRule,
  getApiMode,
  type CreateAlertRulePayload
} from "@/src/lib/api";
import type { Event, MarketType, TargetTracker, TargetTrackerSide } from "@/src/lib/contracts";

type TargetTrackerCreateModalProps = {
  event: Event;
  open: boolean;
  onClose: () => void;
  onCreated?: (tracker: TargetTracker) => void;
};

type Notice = {
  type: "success" | "error";
  message: string;
};

const marketOptions: MarketType[] = ["spread", "moneyline", "total"];

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

const cooldownOptions = [60, 90, 120, 180];

export default function TargetTrackerCreateModal({
  event,
  open,
  onClose,
  onCreated
}: TargetTrackerCreateModalProps) {
  const [market, setMarket] = useState<MarketType>("spread");
  const [side, setSide] = useState<TargetTrackerSide>("away");
  const [target, setTarget] = useState(10.5);
  const [notifyOnHit, setNotifyOnHit] = useState(true);
  const [autoRearm, setAutoRearm] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  useEffect(() => {
    if (!open) {
      return;
    }
    setNotice(null);
  }, [open]);

  useEffect(() => {
    if (market === "moneyline") {
      setTarget(250);
      setSide("away");
    } else if (market === "total") {
      setTarget(220.5);
      setSide("over");
    } else {
      setTarget(10.5);
      setSide("away");
    }
  }, [market]);

  const sideLabel = useMemo(() => {
    if (market === "total") {
      return side === "over" ? "Over" : "Under";
    }
    return side === "away" ? event.awayTeam : event.homeTeam;
  }, [event.awayTeam, event.homeTeam, market, side]);

  const targetLabel = useMemo(() => {
    if (market === "moneyline") {
      return formatSignedMoney(target);
    }
    if (market === "total") {
      return formatPlainNumber(target, 1);
    }
    return formatSignedNumber(target, 1);
  }, [market, target]);

  const handleCreate = async () => {
    setNotice(null);

    if (Number.isNaN(target)) {
      setNotice({ type: "error", message: "Target must be a number." });
      return;
    }

    setSubmitting(true);
    let alertRuleId: string | undefined;

    try {
      if (notifyOnHit) {
        const direction = market === "total" && side === "under" ? "lte" : "gte";
        const teamLabel = market === "total" ? side : sideLabel;
        const alertPayload: CreateAlertRulePayload = {
          type: "THRESHOLD_AT",
          isLive: event.isLive,
          eventId: event.id,
          sport: event.sport,
          market,
          team: teamLabel,
          threshold: target,
          direction,
          name: `${sideLabel} ${market} ${targetLabel}`
        };
        const rule = await createAlertRule(alertPayload);
        alertRuleId = rule.id;
      }

      const tracker = await createTargetTracker({
        eventId: event.id,
        sport: event.sport,
        market,
        side,
        target,
        isLive: event.isLive,
        notifyOnHit,
        alertRuleId,
        autoRearm,
        cooldownSeconds,
        armed: true
      });

      setNotice({
        type: "success",
        message: isMock ? "Target tracker created locally." : "Target tracker created."
      });
      onCreated?.(tracker);
      onClose();
    } catch (err) {
      if (alertRuleId) {
        try {
          await deleteAlertRule(alertRuleId);
        } catch {
          // ignore cleanup failures in mock mode
        }
      }
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to create target tracker."
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="panel-title">Track target number</h3>
            <p className="meta">Set a price target and keep it re-armed automatically.</p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {isMock ? (
          <DemoBanner message="Target trackers are stored locally in mock mode." />
        ) : null}

        <div className="rule-builder">
          <div className="rule-builder-grid">
            <div className="filter-block">
              <label className="label" htmlFor="tracker-market">
                Market
              </label>
              <select
                id="tracker-market"
                className="select"
                value={market}
                onChange={(eventItem) => setMarket(eventItem.target.value as MarketType)}
              >
                {marketOptions.map((value) => (
                  <option key={value} value={value}>
                    {value.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {market === "total" ? (
              <div className="filter-block">
                <label className="label" htmlFor="tracker-side">
                  Side
                </label>
                <select
                  id="tracker-side"
                  className="select"
                  value={side}
                  onChange={(eventItem) =>
                    setSide(eventItem.target.value as TargetTrackerSide)
                  }
                >
                  <option value="over">Over</option>
                  <option value="under">Under</option>
                </select>
              </div>
            ) : (
              <div className="filter-block">
                <label className="label" htmlFor="tracker-team">
                  Team
                </label>
                <select
                  id="tracker-team"
                  className="select"
                  value={side}
                  onChange={(eventItem) =>
                    setSide(eventItem.target.value as TargetTrackerSide)
                  }
                >
                  <option value="away">{event.awayTeam}</option>
                  <option value="home">{event.homeTeam}</option>
                </select>
              </div>
            )}

            <div className="filter-block">
              <label className="label" htmlFor="tracker-target">
                Target
              </label>
              <input
                id="tracker-target"
                className="input"
                type="number"
                step={market === "moneyline" ? 1 : 0.5}
                value={target}
                onChange={(eventItem) => setTarget(Number(eventItem.target.value))}
              />
            </div>
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={notifyOnHit}
              onChange={(eventItem) => setNotifyOnHit(eventItem.target.checked)}
            />
            Notify when hit (creates a threshold alert)
          </label>

          <label className="toggle">
            <input
              type="checkbox"
              checked={autoRearm}
              onChange={(eventItem) => setAutoRearm(eventItem.target.checked)}
            />
            Auto-rearm after trigger
          </label>

          <div className="filter-block">
            <label className="label" htmlFor="tracker-cooldown">
              Cooldown
            </label>
            <select
              id="tracker-cooldown"
              className="select"
              value={cooldownSeconds}
              onChange={(eventItem) =>
                setCooldownSeconds(Number(eventItem.target.value))
              }
            >
              {cooldownOptions.map((value) => (
                <option key={value} value={value}>
                  {value}s
                </option>
              ))}
            </select>
          </div>

          <div className="rule-summary">
            Target {sideLabel} at {targetLabel} ({market.toUpperCase()})
          </div>
        </div>

        {notice ? (
          <div className={`notice ${notice.type === "success" ? "success" : "error"}`}>
            {notice.message}
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="btn" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleCreate}
            disabled={submitting}
          >
            Create tracker
          </button>
        </div>
      </div>
    </div>
  );
}
