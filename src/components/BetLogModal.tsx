"use client";

import { useEffect, useMemo, useState } from "react";
import DemoBanner from "@/components/DemoBanner";
import { formatLocalDateTime } from "@/lib/format";
import { addBet, type BetDraft, type BetEntry } from "@/src/lib/betsStore";
import {
  fetchEvents,
  fetchOddsSnapshots,
  getApiMode
} from "@/src/lib/api";
import type { BetSide, Event, MarketType, OddsSnapshot, Sport } from "@/src/lib/contracts";

export type BetLogPrefill = {
  eventId?: string;
  sport?: Sport;
  awayTeam?: string;
  homeTeam?: string;
  market?: MarketType;
  side?: BetSide;
  book?: string;
  line?: number;
  price?: number;
  stake?: number;
  tags?: string[];
  sourceAlertId?: string;
  alertRuleId?: string;
  placedAt?: string;
};

type BetLogModalProps = {
  open: boolean;
  onClose: () => void;
  events?: Event[];
  prefill?: BetLogPrefill;
  onSaved?: (bet: BetEntry) => void;
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

const formatOdds = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${Math.round(value)}`;
};

const resolveSideFromTeam = (team: string | undefined, event?: Event) => {
  if (!team) {
    return undefined;
  }
  const normalized = team.toLowerCase();
  if (normalized === "over" || normalized === "under") {
    return normalized as BetSide;
  }
  if (normalized === "away" || normalized === "home") {
    return normalized as BetSide;
  }
  if (event) {
    if (team === event.awayTeam) {
      return "away" as BetSide;
    }
    if (team === event.homeTeam) {
      return "home" as BetSide;
    }
  }
  return undefined;
};

const bestSnapshotForMarket = (snapshots: OddsSnapshot[], market: MarketType) => {
  const relevant = snapshots.filter((snapshot) => snapshot.market === market);
  if (!relevant.length) {
    return null;
  }
  return relevant.reduce((latest, snapshot) =>
    new Date(snapshot.timestamp).getTime() > new Date(latest.timestamp).getTime()
      ? snapshot
      : latest
  );
};

export default function BetLogModal({
  open,
  onClose,
  events: providedEvents,
  prefill,
  onSaved
}: BetLogModalProps) {
  const [events, setEvents] = useState<Event[]>(providedEvents ?? []);
  const [eventQuery, setEventQuery] = useState("");
  const [eventId, setEventId] = useState("");
  const [market, setMarket] = useState<MarketType>("spread");
  const [side, setSide] = useState<BetSide>("away");
  const [line, setLine] = useState<number>(0);
  const [odds, setOdds] = useState<number>(-110);
  const [stake, setStake] = useState<number>(50);
  const [book, setBook] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lineTouched, setLineTouched] = useState(false);
  const [oddsTouched, setOddsTouched] = useState(false);

  const apiMode = getApiMode();
  const isMock = apiMode === "mock";

  useEffect(() => {
    if (!open) {
      return;
    }
    setNotice(null);
    setEvents(providedEvents ?? []);
    setEventQuery("");
    setLineTouched(false);
    setOddsTouched(false);
  }, [open, providedEvents]);

  useEffect(() => {
    if (!open || providedEvents) {
      return;
    }
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        setEvents(data);
      } catch {
        setEvents([]);
      }
    };
    loadEvents();
  }, [open, providedEvents]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const selectedEvent = events.find((event) => event.id === prefill?.eventId);
    const resolvedSide = resolveSideFromTeam(prefill?.side, selectedEvent);

    setEventId(prefill?.eventId ?? events[0]?.id ?? "");
    setMarket(prefill?.market ?? "spread");
    setSide(resolvedSide ?? prefill?.side ?? "away");
    setLine(prefill?.line ?? 0);
    setOdds(
      prefill?.price ?? (prefill?.market === "moneyline" ? prefill?.line ?? -110 : -110)
    );
    setStake(prefill?.stake ?? 50);
    setBook(prefill?.book ?? "");
    setNote("");
    setTags(prefill?.tags ?? []);
  }, [events, open, prefill]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === eventId),
    [eventId, events]
  );

  useEffect(() => {
    if (!open || !eventId) {
      return;
    }
    if (lineTouched && oddsTouched) {
      return;
    }

    const populateFromSnapshot = async () => {
      try {
        const snapshots = await fetchOddsSnapshots(eventId);
        const latest = bestSnapshotForMarket(snapshots, market);
        if (!latest) {
          return;
        }

        if (!lineTouched && prefill?.line === undefined) {
          if (market === "moneyline") {
            setLine(0);
          } else if (market === "spread") {
            const value = side === "away" ? -latest.line : latest.line;
            setLine(value);
          } else {
            setLine(latest.line);
          }
        }

        if (!oddsTouched && prefill?.price === undefined) {
          const value =
            market === "moneyline"
              ? side === "home"
                ? latest.homeOdds
                : latest.awayOdds
              : side === "home" || side === "over"
              ? latest.homeOdds
              : latest.awayOdds;
          setOdds(value);
        }
      } catch {
        // ignore snapshot prefills
      }
    };

    populateFromSnapshot();
  }, [eventId, lineTouched, market, oddsTouched, open, prefill, side]);

  useEffect(() => {
    if (market === "total") {
      setSide((prev) => (prev === "under" ? "under" : "over"));
    } else if (market === "moneyline" || market === "spread") {
      setSide((prev) => (prev === "home" ? "home" : "away"));
    }
  }, [market]);

  const filteredEvents = useMemo(() => {
    const term = eventQuery.trim().toLowerCase();
    if (!term) {
      return events;
    }
    return events.filter(
      (event) =>
        event.awayTeam.toLowerCase().includes(term) ||
        event.homeTeam.toLowerCase().includes(term)
    );
  }, [eventQuery, events]);

  const sideLabel = useMemo(() => {
    if (market === "total") {
      return side === "under" ? "Under" : "Over";
    }
    if (!selectedEvent) {
      return side === "away" ? "Away" : "Home";
    }
    return side === "away" ? selectedEvent.awayTeam : selectedEvent.homeTeam;
  }, [market, selectedEvent, side]);

  const summaryLine = useMemo(() => {
    if (market === "moneyline") {
      return `${sideLabel} moneyline ${formatOdds(odds)}`;
    }
    const lineLabel = formatSignedNumber(line, 1);
    const marketLabel = market === "total" ? "total" : "spread";
    return `${sideLabel} ${marketLabel} ${lineLabel}`;
  }, [line, market, odds, sideLabel]);

  const handleSave = () => {
    setNotice(null);

    if (!eventId) {
      setNotice({ type: "error", message: "Select an event to log a bet." });
      return;
    }
    if (Number.isNaN(odds)) {
      setNotice({ type: "error", message: "Enter a valid price." });
      return;
    }
    if (stake <= 0 || Number.isNaN(stake)) {
      setNotice({ type: "error", message: "Stake must be greater than 0." });
      return;
    }
    if (market !== "moneyline" && Number.isNaN(line)) {
      setNotice({ type: "error", message: "Enter a valid line." });
      return;
    }

    setSubmitting(true);

    const teamLabel = market === "total" ? sideLabel : sideLabel;

    const payload: BetDraft = {
      eventId,
      sport: selectedEvent?.sport ?? prefill?.sport,
      market,
      side,
      team: teamLabel,
      stake,
      odds,
      line: market === "moneyline" ? undefined : line,
      placedAt: prefill?.placedAt ?? new Date().toISOString(),
      book: book || undefined,
      tags: tags.length ? tags : undefined,
      note: note || undefined,
      sourceAlertId: prefill?.sourceAlertId,
      alertRuleId: prefill?.alertRuleId
    };

    try {
      const entry = addBet(payload);
      onSaved?.(entry);
      setNotice({ type: "success", message: "Bet logged." });
      onClose();
    } catch (err) {
      setNotice({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to save bet."
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
            <h3 className="panel-title">Log a bet</h3>
            <p className="meta">Track CLV and link to alert triggers.</p>
          </div>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {isMock ? (
          <DemoBanner message="Bet logs are stored locally in mock mode." />
        ) : null}

        {prefill?.sourceAlertId ? (
          <div className="notice info">
            Linked to alert {prefill.sourceAlertId} at {formatLocalDateTime(prefill.placedAt ?? new Date().toISOString())}
          </div>
        ) : null}

        <div className="bet-form">
          <div className="bet-form-grid">
            <div className="filter-block">
              <label className="label" htmlFor="bet-event-search">
                Event search
              </label>
              <input
                id="bet-event-search"
                className="input"
                value={eventQuery}
                onChange={(eventItem) => setEventQuery(eventItem.target.value)}
                placeholder="Lakers, Bills, Duke..."
              />
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="bet-event">
                Event
              </label>
              <select
                id="bet-event"
                className="select"
                value={eventId}
                onChange={(eventItem) => setEventId(eventItem.target.value)}
              >
                {filteredEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.awayTeam} @ {event.homeTeam}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="bet-market">
                Market
              </label>
              <select
                id="bet-market"
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
            <div className="filter-block">
              <label className="label" htmlFor="bet-side">
                Side
              </label>
              <select
                id="bet-side"
                className="select"
                value={side}
                onChange={(eventItem) => setSide(eventItem.target.value as BetSide)}
              >
                {market === "total" ? (
                  <>
                    <option value="over">Over</option>
                    <option value="under">Under</option>
                  </>
                ) : (
                  <>
                    <option value="away">Away</option>
                    <option value="home">Home</option>
                  </>
                )}
              </select>
            </div>
            {market === "moneyline" ? null : (
              <div className="filter-block">
                <label className="label" htmlFor="bet-line">
                  Line
                </label>
                <input
                  id="bet-line"
                  className="input"
                  type="number"
                  step={0.5}
                  value={Number.isNaN(line) ? "" : line}
                  onChange={(eventItem) => {
                    setLine(Number(eventItem.target.value));
                    setLineTouched(true);
                  }}
                />
              </div>
            )}
            <div className="filter-block">
              <label className="label" htmlFor="bet-odds">
                Price
              </label>
              <input
                id="bet-odds"
                className="input"
                type="number"
                value={Number.isNaN(odds) ? "" : odds}
                onChange={(eventItem) => {
                  setOdds(Number(eventItem.target.value));
                  setOddsTouched(true);
                }}
              />
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="bet-stake">
                Stake
              </label>
              <input
                id="bet-stake"
                className="input"
                type="number"
                value={Number.isNaN(stake) ? "" : stake}
                onChange={(eventItem) => setStake(Number(eventItem.target.value))}
              />
            </div>
            <div className="filter-block">
              <label className="label" htmlFor="bet-book">
                Book
              </label>
              <input
                id="bet-book"
                className="input"
                value={book}
                onChange={(eventItem) => setBook(eventItem.target.value)}
                placeholder="DraftKings, FanDuel..."
              />
            </div>
          </div>

          <div className="filter-block">
            <label className="label" htmlFor="bet-note">
              Note (optional)
            </label>
            <textarea
              id="bet-note"
              className="input"
              rows={3}
              value={note}
              onChange={(eventItem) => setNote(eventItem.target.value)}
              placeholder="Optional note about the bet..."
            />
          </div>

          {tags.length ? (
            <div className="tag-row">
              {tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="rule-summary">{summaryLine}</div>
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
            onClick={handleSave}
            disabled={submitting}
          >
            Log bet
          </button>
        </div>
      </div>
    </div>
  );
}
