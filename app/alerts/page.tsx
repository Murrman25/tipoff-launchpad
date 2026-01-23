"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DemoBanner from "@/components/DemoBanner";
import FeatureLock from "@/components/FeatureLock";
import PlanBadge from "@/components/PlanBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { formatLocalDateTime } from "@/lib/format";
import { usePlan } from "@/lib/plan";
import type { PlanId } from "@/lib/pricing";
import {
  createAlertRule,
  deleteAlertRule,
  fetchAlerts,
  fetchEvents,
  getApiMode,
  updateAlertRule,
  type CreateAlertRulePayload
} from "@/src/lib/api";
import type { AlertRule, AlertRuleType, Event } from "@/src/lib/contracts";
import {
  defaultAlertPreferences,
  isWithinAllowedHours,
  loadAlertPreferences,
  PREFERENCES_STORAGE_KEY,
  type AlertPreferences
} from "@/src/lib/preferences";
import ThresholdAtBuilder from "@/src/components/AlertRuleBuilder/ThresholdAtBuilder";
import ThresholdMoveBuilder from "@/src/components/AlertRuleBuilder/ThresholdMoveBuilder";
import KeyNumberProximityBuilder from "@/src/components/AlertRuleBuilder/KeyNumberProximityBuilder";
import BuybackBuilder from "@/src/components/AlertRuleBuilder/BuybackBuilder";
import LiveMomentumBuilder from "@/src/components/AlertRuleBuilder/LiveMomentumBuilder";
import ReverseLineMovementBuilder from "@/src/components/AlertRuleBuilder/ReverseLineMovementBuilder";
import {
  formatMarketValue,
  formatSignedNumber
} from "@/src/components/AlertRuleBuilder/formatting";

type Notice = {
  type: "success" | "error";
  message: string;
};

type RuleOption = {
  id: AlertRuleType;
  label: string;
  description: string;
  requiredPlan: PlanId;
};

const ruleOptions: RuleOption[] = [
  {
    id: "THRESHOLD_MOVE",
    label: "Threshold Move",
    description: "Track line movement from a base number.",
    requiredPlan: "FREE"
  },
  {
    id: "THRESHOLD_AT",
    label: "Threshold At",
    description: "Alert when a target number is reached.",
    requiredPlan: "FREE"
  },
  {
    id: "LIVE_MOMENTUM",
    label: "Live Momentum Threshold",
    description: "Run detection in live play.",
    requiredPlan: "PRO"
  },
  {
    id: "KEY_NUMBER_PROXIMITY",
    label: "Key Number Proximity",
    description: "Watch critical spreads near key numbers.",
    requiredPlan: "ELITE"
  },
  {
    id: "BUYBACK",
    label: "Buyback",
    description: "Move and reverse within a time window.",
    requiredPlan: "ELITE"
  },
  {
    id: "RLM",
    label: "Reverse Line Movement",
    description: "Handle vs ticket imbalance alerts.",
    requiredPlan: "ELITE"
  }
];

const ruleLabels: Record<AlertRuleType, string> = {
  THRESHOLD_MOVE: "Threshold Move",
  THRESHOLD_AT: "Threshold At",
  KEY_NUMBER_PROXIMITY: "Key Number Proximity",
  BUYBACK: "Buyback",
  LIVE_MOMENTUM: "Live Momentum",
  RLM: "Reverse Line Movement",
  STEAM: "Steam"
};

const formatHour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}${period}`;
};

const buildSummary = (rule: AlertRule) => {
  if (rule.name) {
    return rule.name;
  }
  switch (rule.type) {
    case "THRESHOLD_MOVE":
      return `Alert when line moves ${formatMarketValue(
        rule.moveAmount,
        rule.market ?? "spread"
      )}`;
    case "THRESHOLD_AT":
      return `Alert when line reaches ${formatMarketValue(
        rule.threshold,
        rule.market ?? "spread"
      )}`;
    case "KEY_NUMBER_PROXIMITY":
      return `Alert near key number ${rule.keyNumber} within ${formatSignedNumber(
        rule.distance,
        1
      )}`;
    case "BUYBACK":
      return `Buyback from ${formatSignedNumber(
        rule.originalLine,
        1
      )} to ${formatSignedNumber(rule.returnLine, 1)}`;
    case "LIVE_MOMENTUM":
      return `Live run ${rule.runPoints} pts in ${rule.runSeconds}s, move ${formatSignedNumber(
        rule.minLineMove,
        1
      )}`;
    case "RLM":
      return `RLM move ${formatSignedNumber(rule.lineMove, 1)} (tickets ${
        rule.ticketPercent
      }% / handle ${rule.handlePercent}%)`;
    case "STEAM":
      return "Steam move alert";
    default:
      return "Alert";
  }
};

export default function AlertsPage() {
  const { currentPlan } = usePlan();
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [preferences, setPreferences] = useState<AlertPreferences>(
    defaultAlertPreferences
  );
  const [selectedRule, setSelectedRule] = useState<AlertRuleType>("THRESHOLD_AT");

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [alertData, eventData] = await Promise.all([
        fetchAlerts(),
        fetchEvents()
      ]);
      setAlerts(alertData);
      setEvents(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPreferences(loadAlertPreferences());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === PREFERENCES_STORAGE_KEY) {
        setPreferences(loadAlertPreferences());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!preferences.sports.length) {
      return [];
    }
    return events.filter((event) => preferences.sports.includes(event.sport));
  }, [events, preferences.sports]);

  const quietHoursActive = useMemo(
    () => !isWithinAllowedHours(preferences),
    [preferences]
  );

  const disabledReason = useMemo(() => {
    if (!filteredEvents.length) {
      return "No events match your preferred sports. Update Settings.";
    }
    return undefined;
  }, [filteredEvents.length]);

  const selectedOption = useMemo(
    () => ruleOptions.find((option) => option.id === selectedRule) ?? ruleOptions[0],
    [selectedRule]
  );

  const handleCreate = async (payload: CreateAlertRulePayload, summary: string) => {
    setNotice(null);
    try {
      setCreating(true);
      const created = await createAlertRule(payload);
      setAlerts((prev) => [created, ...prev]);
      setNotice({
        type: "success",
        message: isMock ? "Mock alert created locally." : `Alert created: ${summary}`
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to create alert."
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (alert: AlertRule) => {
    setNotice(null);
    try {
      const updated = await updateAlertRule(alert.id, { enabled: !alert.enabled });
      setAlerts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to update alert."
      });
    }
  };

  const handleDelete = async (alert: AlertRule) => {
    setNotice(null);
    try {
      await deleteAlertRule(alert.id);
      setAlerts((prev) => prev.filter((item) => item.id !== alert.id));
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to delete alert."
      });
    }
  };

  const renderBuilder = () => {
    const builderProps = {
      events: filteredEvents,
      isCreating: creating,
      disabledReason,
      quietHoursActive,
      onCreate: handleCreate
    };

    switch (selectedRule) {
      case "THRESHOLD_MOVE":
        return <ThresholdMoveBuilder {...builderProps} />;
      case "THRESHOLD_AT":
        return <ThresholdAtBuilder {...builderProps} />;
      case "KEY_NUMBER_PROXIMITY":
        return <KeyNumberProximityBuilder {...builderProps} />;
      case "BUYBACK":
        return <BuybackBuilder {...builderProps} />;
      case "LIVE_MOMENTUM":
        return <LiveMomentumBuilder {...builderProps} />;
      case "RLM":
        return <ReverseLineMovementBuilder {...builderProps} />;
      default:
        return null;
    }
  };

  const builderContent = renderBuilder();
  const requiredPlan = selectedOption.requiredPlan;

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Alerts</h2>
          <p className="page-subtitle">
            Build rules and manage live alert coverage across markets.
          </p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        {isMock ? (
          <DemoBanner message="Alerts are stored locally while mock mode is active." />
        ) : null}
        <div className="panel-header">
          <h3 className="panel-title">Create Alert</h3>
          <span className="meta">Choose a rule type and configure the trigger.</span>
        </div>
        <div className="rule-selector">
          <div className="filter-block">
            <label className="label" htmlFor="rule-type">
              Rule type
            </label>
            <select
              id="rule-type"
              className="select"
              value={selectedRule}
              onChange={(event) =>
                setSelectedRule(event.target.value as AlertRuleType)
              }
            >
              {ruleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="rule-type-meta">
            <div className="label">Plan required</div>
            <div className="meta">
              {requiredPlan === "FREE"
                ? "Included in Free"
                : `${requiredPlan} feature`}
            </div>
          </div>
          <div className="rule-type-meta">
            <div className="label">What it does</div>
            <div className="meta">{selectedOption.description}</div>
          </div>
        </div>
        {requiredPlan === "FREE" ? (
          builderContent
        ) : (
          <>
            <FeatureLock requiredPlan={requiredPlan}>{builderContent}</FeatureLock>
            <UpgradeCTA requiredPlan={requiredPlan} featureName={selectedOption.label} />
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Alert Preferences</h3>
          <Link className="link" href="/settings">
            Edit settings
          </Link>
        </div>
        <div className="preferences-grid">
          <div>
            <div className="label">Preferred sports</div>
            <div className="meta">
              {preferences.sports.length ? preferences.sports.join(", ") : "None"}
            </div>
          </div>
          <div>
            <div className="label">Allowed hours</div>
            <div className="meta">
              {formatHour(preferences.allowedHours.startHour)} -{" "}
              {formatHour(preferences.allowedHours.endHour)} ({preferences.timezone})
            </div>
          </div>
          <div>
            <div className="label">Quiet hours</div>
            <div className="meta">
              {quietHoursActive
                ? "Active now - notifications muted in mock mode"
                : "Not active"}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Active Alerts</h3>
          <span className="meta">{alerts.length} total</span>
        </div>
        {loading ? (
          <div className="notice">Loading alerts...</div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : alerts.length === 0 ? (
          <div className="notice">No alerts created yet.</div>
        ) : (
          <div className="table">
            {alerts.map((alert) => {
              const summary = buildSummary(alert);
              const eventLabel = alert.eventId
                ? eventMap[alert.eventId]
                  ? `${eventMap[alert.eventId].awayTeam} @ ${eventMap[alert.eventId].homeTeam}`
                  : "Event"
                : "Global";
              const scope = `${alert.isLive ? "Live" : "Pregame"}${
                alert.market ? ` · ${alert.market.toUpperCase()}` : ""
              }`;

              return (
                <div key={alert.id} className="table-row">
                  <div>
                    <strong>{summary}</strong>
                    <div className="meta">{eventLabel}</div>
                  </div>
                  <div>
                    <div className="label">Rule</div>
                    <div className="meta">{ruleLabels[alert.type]}</div>
                  </div>
                  <div>
                    <div className="label">Scope</div>
                    <div className="meta">{scope}</div>
                  </div>
                  <div>
                    <div className="label">Created</div>
                    <div className="meta">
                      {alert.createdAt ? formatLocalDateTime(alert.createdAt) : "--"}
                    </div>
                  </div>
                  <div className="alert-actions">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={alert.enabled}
                        onChange={() => handleToggle(alert)}
                      />
                      {alert.enabled ? "Enabled" : "Disabled"}
                    </label>
                    <button
                      className="btn btn-danger"
                      type="button"
                      onClick={() => handleDelete(alert)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {notice ? (
          <div className={`notice ${notice.type === "success" ? "success" : "error"}`}>
            {notice.message}
          </div>
        ) : null}
      </section>
    </>
  );
}
