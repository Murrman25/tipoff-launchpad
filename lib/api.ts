import type { Alert, Event, Notification } from "@/lib/types";

// Centralized API helper for consistent errors and JSON handling.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const apiFetch = async <T>(path: string, options: RequestOptions = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
};

export const fetchEvents = () => apiFetch<Event[]>("/events");

export const fetchEvent = (id: string) => apiFetch<Event>(`/events/${id}`);

export type CreateAlertPayload = {
  eventId: string;
  team: string;
  market: "spread" | "moneyline" | string;
  threshold: number;
  isLive: boolean;
  books?: "all" | string[];
  cooldown?: boolean;
};

export const createAlert = (payload: CreateAlertPayload) =>
  apiFetch<Alert>("/alerts", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const fetchAlerts = () => apiFetch<Alert[]>("/alerts");

export type UpdateAlertPayload = {
  enabled?: boolean;
  threshold?: number;
};

export const updateAlert = (id: string, payload: UpdateAlertPayload) =>
  apiFetch<Alert>(`/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });

export const deleteAlert = (id: string) =>
  apiFetch<void>(`/alerts/${id}`, {
    method: "DELETE"
  });

export const fetchNotifications = () => apiFetch<Notification[]>("/notifications");

export type UpdateNotificationPayload = {
  isRead: boolean;
};

export const updateNotification = (id: string, payload: UpdateNotificationPayload) =>
  apiFetch<Notification>(`/notifications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
