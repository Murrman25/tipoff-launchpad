"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatLocalTime } from "@/lib/format";
import { isPlanAtLeast, usePlan } from "@/lib/plan";
import { fetchAlerts, fetchEvents } from "@/src/lib/api";
import type { AlertRule, Event, Notification } from "@/src/lib/contracts";
import { createRealtimeClient } from "@/src/lib/realtime";
import BetLogModal, { type BetLogPrefill } from "@/src/components/BetLogModal";
import {
  hasBetForSourceAlertId
} from "@/src/lib/betsStore";

type Toast = {
  id: string;
  sourceId: string;
  title: string;
  body: string;
  timeLabel: string;
  payload: Notification;
};

const TOAST_TTL = 6000;

const resolveSideFromTeam = (team: string | undefined, event?: Event) => {
  if (!team) {
    return undefined;
  }
  const normalized = team.toLowerCase();
  if (normalized === "over" || normalized === "under") {
    return normalized as "over" | "under";
  }
  if (normalized === "away" || normalized === "home") {
    return normalized as "away" | "home";
  }
  if (event) {
    if (team === event.awayTeam) {
      return "away";
    }
    if (team === event.homeTeam) {
      return "home";
    }
  }
  return undefined;
};

const buildToast = (
  payload: Notification,
  event?: Event
): Toast => {
  const away = event?.awayTeam?.trim() ?? payload.event?.awayTeam?.trim() ?? "";
  const home = event?.homeTeam?.trim() ?? payload.event?.homeTeam?.trim() ?? "";
  const teams = away && home ? `${away} @ ${home}` : "";
  const title = teams || "Alert triggered";
  const body = payload.message || "Threshold reached.";
  const firedAt = payload.firedAt ?? new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sourceId: payload.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    body,
    timeLabel: formatLocalTime(firedAt),
    payload
  };
};

// Global toast layer driven by alert:triggered events.
export default function ToastProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { currentPlan } = usePlan();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [activePrefill, setActivePrefill] = useState<BetLogPrefill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const alertMap = useMemo(() => {
    return alerts.reduce<Record<string, AlertRule>>((acc, alert) => {
      acc[alert.id] = alert;
      return acc;
    }, {});
  }, [alerts]);

  useEffect(() => {
    const loadBaseData = async () => {
      try {
        const [eventData, alertData] = await Promise.all([
          fetchEvents(),
          fetchAlerts()
        ]);
        setEvents(eventData);
        setAlerts(alertData);
      } catch {
        setEvents([]);
        setAlerts([]);
      }
    };
    loadBaseData();
  }, []);

  useEffect(() => {
    const client = createRealtimeClient();

    const handleTriggered = (payload: Notification) => {
      const event = payload.eventId ? eventMap[payload.eventId] : undefined;
      const toast = buildToast(payload, event);
      setToasts((prev) => [toast, ...prev].slice(0, 3));

      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
        delete timeouts.current[toast.id];
      }, TOAST_TTL);

      timeouts.current[toast.id] = timeout;
    };

    client.connect();
    client.on("alert:triggered", handleTriggered);

    return () => {
      client.off("alert:triggered", handleTriggered);
      client.disconnect();
      Object.values(timeouts.current).forEach((timeout) => clearTimeout(timeout));
      timeouts.current = {};
    };
  }, [eventMap]);

  const buildPrefill = (toast: Toast): BetLogPrefill => {
    const payload = toast.payload;
    const event = payload.eventId ? eventMap[payload.eventId] : undefined;
    const alertRule = payload.alertRuleId ? alertMap[payload.alertRuleId] : undefined;
    const market = payload.market ?? alertRule?.market ?? "spread";
    const side =
      payload.side ??
      resolveSideFromTeam(alertRule?.team, event) ??
      resolveSideFromTeam(payload.team, event) ??
      "away";
    const line =
      payload.line ??
      (alertRule?.type === "THRESHOLD_AT" ? alertRule.threshold : undefined);
    const price = payload.price ?? (market === "moneyline" ? line : undefined);

    return {
      eventId: payload.eventId,
      sport: event?.sport ?? payload.event?.sport,
      awayTeam: event?.awayTeam ?? payload.event?.awayTeam,
      homeTeam: event?.homeTeam ?? payload.event?.homeTeam,
      market,
      side,
      line,
      price,
      book: payload.sportsbookId,
      tags: payload.tags,
      sourceAlertId: toast.sourceId,
      alertRuleId: payload.alertRuleId,
      placedAt: payload.firedAt
    };
  };

  const handleDismiss = (toastId: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    if (timeouts.current[toastId]) {
      clearTimeout(timeouts.current[toastId]);
      delete timeouts.current[toastId];
    }
  };

  const handleLogBet = (toast: Toast) => {
    if (!isPlanAtLeast(currentPlan, "PRO")) {
      window.location.href = "/pricing";
      return;
    }
    setActivePrefill(buildPrefill(toast));
    setModalOpen(true);
    handleDismiss(toast.id);
  };

  return (
    <>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-body">
              {toast.body} <span className="meta">{toast.timeLabel}</span>
            </div>
            <div className="toast-actions">
              {hasBetForSourceAlertId(toast.sourceId) ? (
                <span className="meta">Logged</span>
              ) : (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleLogBet(toast)}
                >
                  Log Bet
                </button>
              )}
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => handleDismiss(toast.id)}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
      <BetLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        events={events}
        prefill={activePrefill ?? undefined}
      />
    </>
  );
}
