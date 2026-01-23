import type { Sport } from "./contracts";

export type AlertPreferences = {
  sports: Sport[];
  allowedHours: {
    startHour: number;
    endHour: number;
  };
  timezone: string;
};

export const PREFERENCES_STORAGE_KEY = "tipoff.v2.alertPrefs";

const resolveTimezone = () => {
  try {
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "Local";
    }
  } catch {
    return "Local";
  }
  return "Local";
};

export const defaultAlertPreferences: AlertPreferences = {
  sports: ["NFL", "NBA", "NCAAB", "NCAAF"],
  allowedHours: {
    startHour: 18,
    endHour: 23
  },
  timezone: resolveTimezone()
};

export const loadAlertPreferences = (): AlertPreferences => {
  if (typeof window === "undefined") {
    return defaultAlertPreferences;
  }
  try {
    const stored = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!stored) {
      return defaultAlertPreferences;
    }
    const parsed = JSON.parse(stored) as Partial<AlertPreferences>;
    return {
      sports: parsed.sports ?? defaultAlertPreferences.sports,
      allowedHours: {
        startHour:
          parsed.allowedHours?.startHour ?? defaultAlertPreferences.allowedHours.startHour,
        endHour:
          parsed.allowedHours?.endHour ?? defaultAlertPreferences.allowedHours.endHour
      },
      timezone: parsed.timezone ?? defaultAlertPreferences.timezone
    };
  } catch {
    return defaultAlertPreferences;
  }
};

export const saveAlertPreferences = (preferences: AlertPreferences) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences)
  );
};

export const isWithinAllowedHours = (
  preferences: AlertPreferences,
  date = new Date()
) => {
  const hour = date.getHours();
  const { startHour, endHour } = preferences.allowedHours;

  if (startHour === endHour) {
    return true;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour <= endHour;
  }

  return hour >= startHour || hour <= endHour;
};

export const isQuietHours = (preferences: AlertPreferences, date = new Date()) =>
  !isWithinAllowedHours(preferences, date);
