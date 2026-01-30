import type { InPlayState } from "@/lib/types";

const normalize = (value?: string) => value?.trim() ?? "";

export const formatInPlayDetail = (
  inPlayState?: InPlayState,
  fallback?: string
) => {
  const period = normalize(inPlayState?.period);
  const clock = normalize(inPlayState?.clock);
  const status = normalize(inPlayState?.statusText) || normalize(fallback);

  if (period && clock) {
    return `${period} ${clock}`;
  }

  if (status) {
    return status;
  }

  if (period) {
    return period;
  }

  return "LIVE";
};

export const buildStatusLabel = (
  isLive: boolean,
  inPlayState?: InPlayState,
  statusText?: string
) => {
  if (isLive) {
    const detail = formatInPlayDetail(inPlayState, statusText);
    return detail === "LIVE" ? "LIVE" : `LIVE ${detail}`;
  }

  return statusText ? statusText.toUpperCase() : "PREGAME";
};

export const statusTone = (isLive: boolean, statusText?: string) => {
  if (isLive) {
    return "badge-live";
  }

  if (statusText && statusText.toLowerCase().includes("final")) {
    return "badge-final";
  }

  return "badge-pregame";
};
