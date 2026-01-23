"use client";

import { useEffect, useMemo, useState } from "react";
import PlanBadge from "@/components/PlanBadge";
import { usePlan } from "@/lib/plan";
import {
  defaultAlertPreferences,
  isWithinAllowedHours,
  loadAlertPreferences,
  saveAlertPreferences,
  type AlertPreferences
} from "@/src/lib/preferences";

const sportsOptions = ["NFL", "NBA", "NCAAB", "NCAAF"] as const;
const hourOptions = Array.from({ length: 24 }, (_, index) => index);
const fallbackTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles"
];

const formatHour = (hour: number) => {
  const period = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}${period}`;
};

export default function SettingsPage() {
  const { currentPlan } = usePlan();
  const [preferences, setPreferences] = useState<AlertPreferences>(
    defaultAlertPreferences
  );

  useEffect(() => {
    setPreferences(loadAlertPreferences());
  }, []);

  const quietHoursActive = useMemo(
    () => !isWithinAllowedHours(preferences),
    [preferences]
  );
  const timezoneOptions = useMemo(() => {
    const options = new Set([preferences.timezone, ...fallbackTimezones]);
    return Array.from(options);
  }, [preferences.timezone]);

  const updatePreferences = (next: AlertPreferences) => {
    setPreferences(next);
    saveAlertPreferences(next);
  };

  const handleSportToggle = (sport: (typeof sportsOptions)[number]) => {
    setPreferences((prev) => {
      const hasSport = prev.sports.includes(sport);
      const sports = hasSport
        ? prev.sports.filter((item) => item !== sport)
        : [...prev.sports, sport];
      const next = { ...prev, sports };
      saveAlertPreferences(next);
      return next;
    });
  };

  const handleHourChange = (field: "startHour" | "endHour", value: number) => {
    updatePreferences({
      ...preferences,
      allowedHours: {
        ...preferences.allowedHours,
        [field]: value
      }
    });
  };

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">
            Tune which events and hours TipOff monitors for alerts.
          </p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Alert Preferences</h3>
          <span className="meta">Used by the alert builders and mock delivery.</span>
        </div>
        <div className="settings-grid">
          <div className="settings-fieldset">
            <div className="label">Preferred sports</div>
            <div className="settings-checkboxes">
              {sportsOptions.map((sport) => {
                const isActive = preferences.sports.includes(sport);
                return (
                  <label
                    key={sport}
                    className={`checkbox-pill${isActive ? " active" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => handleSportToggle(sport)}
                    />
                    {sport}
                  </label>
                );
              })}
            </div>
            <div className="settings-note">
              Builders only show events in the sports you select.
            </div>
          </div>

          <div className="settings-fieldset">
            <div className="label">Allowed hours</div>
            <div className="settings-row">
              <div className="filter-block">
                <label className="label" htmlFor="allowed-start">
                  Start
                </label>
                <select
                  id="allowed-start"
                  className="select"
                  value={preferences.allowedHours.startHour}
                  onChange={(event) =>
                    handleHourChange("startHour", Number(event.target.value))
                  }
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-block">
                <label className="label" htmlFor="allowed-end">
                  End
                </label>
                <select
                  id="allowed-end"
                  className="select"
                  value={preferences.allowedHours.endHour}
                  onChange={(event) =>
                    handleHourChange("endHour", Number(event.target.value))
                  }
                >
                  {hourOptions.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHour(hour)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="settings-note">
              {quietHoursActive
                ? "Quiet hours active. Mock alerts are muted."
                : "Quiet hours are not active right now."}
            </div>
          </div>

          <div className="settings-fieldset">
            <div className="label">Timezone</div>
            <select className="select" value={preferences.timezone} disabled>
              {timezoneOptions.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <div className="settings-note">
              Timezone is detected automatically in mock mode.
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
