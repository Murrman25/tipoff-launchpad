"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DemoBanner from "@/components/DemoBanner";
import FeatureLock from "@/components/FeatureLock";
import PlanBadge from "@/components/PlanBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { formatLocalDateTime } from "@/lib/format";
import { isPlanAtLeast, usePlan } from "@/lib/plan";
import {
  fetchEvents,
  fetchNotifications,
  fetchSportsbooks,
  getApiMode,
  updateNotification
} from "@/src/lib/api";
import type { Event, Notification, Sportsbook } from "@/src/lib/contracts";
import BetLogModal, { type BetLogPrefill } from "@/src/components/BetLogModal";
import {
  loadBets,
  subscribeBets,
  type BetEntry
} from "@/src/lib/betsStore";

type Notice = {
  type: "success" | "error";
  message: string;
};

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

export default function NotificationsPage() {
  const router = useRouter();
  const { currentPlan } = usePlan();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [sportsbooks, setSportsbooks] = useState<Record<string, Sportsbook>>({});
  const [bets, setBets] = useState<BetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [activePrefill, setActivePrefill] = useState<BetLogPrefill | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  useEffect(() => {
    setBets(loadBets());
    return subscribeBets(setBets);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const [noteData, eventData, bookData] = await Promise.all([
        fetchNotifications(),
        fetchEvents(),
        fetchSportsbooks()
      ]);
      const sorted = [...noteData].sort((a, b) => {
        const aTime = a.firedAt ? new Date(a.firedAt).getTime() : 0;
        const bTime = b.firedAt ? new Date(b.firedAt).getTime() : 0;
        return bTime - aTime;
      });
      const bookMap = bookData.reduce<Record<string, Sportsbook>>((acc, book) => {
        acc[book.id] = book;
        return acc;
      }, {});
      setNotifications(sorted);
      setEvents(eventData);
      setSportsbooks(bookMap);
    } catch (err) {
      setNotifications([]);
      setEvents([]);
      setSportsbooks({});
      setError(err instanceof Error ? err.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const eventMap = useMemo(() => {
    return events.reduce<Record<string, Event>>((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});
  }, [events]);

  const loggedAlertIds = useMemo(() => {
    const set = new Set<string>();
    bets.forEach((bet) => {
      if (bet.sourceAlertId) {
        set.add(bet.sourceAlertId);
      }
    });
    return set;
  }, [bets]);

  const buildPrefill = (notification: Notification): BetLogPrefill => {
    const event = notification.eventId ? eventMap[notification.eventId] : undefined;
    const market = notification.market ?? "spread";
    const side =
      notification.side ??
      resolveSideFromTeam(notification.team, event) ??
      "away";
    const book = notification.sportsbookId
      ? sportsbooks[notification.sportsbookId]?.name ?? notification.sportsbookId
      : undefined;

    return {
      eventId: notification.eventId,
      sport: event?.sport ?? notification.event?.sport,
      awayTeam: event?.awayTeam ?? notification.event?.awayTeam,
      homeTeam: event?.homeTeam ?? notification.event?.homeTeam,
      market,
      side,
      line: notification.line,
      price: notification.price ?? (market === "moneyline" ? notification.line : undefined),
      book,
      tags: notification.tags,
      sourceAlertId: notification.id,
      alertRuleId: notification.alertRuleId,
      placedAt: notification.firedAt
    };
  };

  const handleMarkRead = async (notification: Notification) => {
    try {
      setNotice(null);
      const updated = await updateNotification(notification.id, { isRead: true });
      setNotifications((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to update."
      });
    }
  };

  const handleNavigate = (notification: Notification) => {
    if (notification.eventId) {
      router.push(`/event/${notification.eventId}`);
    }
  };

  const handleLogBet = (notification: Notification) => {
    if (!isPlanAtLeast(currentPlan, "PRO")) {
      router.push("/pricing");
      return;
    }
    setActivePrefill(buildPrefill(notification));
    setModalOpen(true);
  };

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Notifications</h2>
          <p className="page-subtitle">Alert history, newest first.</p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Notification Channels</h3>
          <span className="meta">Control how TipOff delivers alerts.</span>
        </div>
        <div className="notification-channels">
          <div className="channel-row">
            <div>
              <div className="label">In-app alerts</div>
              <div className="meta">Always enabled for all plans.</div>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              Enabled
            </label>
          </div>
          <FeatureLock requiredPlan="PRO">
            <div className="channel-row">
              <div>
                <div className="label">Push notifications (mobile)</div>
                <div className="meta">Real-time alerts on your device.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                Enabled
              </label>
            </div>
            <div className="channel-row">
              <div>
                <div className="label">Web push notifications</div>
                <div className="meta">Desktop alerts when lines move.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" />
                Enabled
              </label>
            </div>
          </FeatureLock>
          <UpgradeCTA requiredPlan="PRO" featureName="Push and web push delivery" />
          {currentPlan === "FREE" ? (
            <div className="notice info">Pro unlocks push and web push delivery.</div>
          ) : null}
        </div>
      </section>

      <section className="panel">
        {isMock ? (
          <DemoBanner message="Mock alert history is active until the backend is connected." />
        ) : null}
        <div className="panel-header">
          <h3 className="panel-title">Inbox</h3>
          <span className="meta">{notifications.length} items</span>
        </div>

        {loading ? (
          <div className="notice">Loading notifications...</div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="notice">No alerts triggered yet.</div>
        ) : (
          <div className="table">
            {notifications.map((notification) => {
              const event = notification.eventId
                ? eventMap[notification.eventId]
                : undefined;
              const away = event?.awayTeam ?? notification.event?.awayTeam;
              const home = event?.homeTeam ?? notification.event?.homeTeam;
              const label = away && home ? `${away} @ ${home}` : "Alert";
              const condition = notification.message || "Alert triggered";
              const logged = loggedAlertIds.has(notification.id);

              return (
                <div
                  key={notification.id}
                  className="table-row"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleNavigate(notification)}
                >
                  <div>
                    <strong>{label}</strong>
                    <div className="meta">{condition}</div>
                  </div>
                  <div>
                    <div className="label">Fired</div>
                    <div className="meta">
                      {notification.firedAt
                        ? formatLocalDateTime(notification.firedAt)
                        : "--"}
                    </div>
                  </div>
                  <div>
                    <div className="label">Status</div>
                    <div className="meta">
                      {notification.isRead ? "Read" : "Unread"}
                    </div>
                  </div>
                  <div className="alert-actions">
                    {!notification.isRead ? (
                      <button
                        className="btn"
                        type="button"
                        onClick={(eventItem) => {
                          eventItem.stopPropagation();
                          handleMarkRead(notification);
                        }}
                      >
                        Mark read
                      </button>
                    ) : null}
                    {logged ? (
                      <span className="meta">Logged</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={(eventItem) => {
                          eventItem.stopPropagation();
                          handleLogBet(notification);
                        }}
                      >
                        Log as Bet
                      </button>
                    )}
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={(eventItem) => {
                        eventItem.stopPropagation();
                        handleNavigate(notification);
                      }}
                    >
                      View event
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

      <BetLogModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActivePrefill(null);
        }}
        events={events}
        prefill={activePrefill ?? undefined}
      />
    </>
  );
}
