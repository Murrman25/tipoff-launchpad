"use client";

import { useEffect, useMemo, useState } from "react";
import type { Event } from "@/src/lib/contracts";

export const useEventSelection = (events: Event[]) => {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");

  useEffect(() => {
    if (!events.length) {
      if (eventId) {
        setEventId("");
      }
      return;
    }
    const exists = events.some((event) => event.id === eventId);
    if (!exists) {
      setEventId(events[0].id);
    }
  }, [eventId, events]);

  const event = useMemo(
    () => events.find((item) => item.id === eventId) ?? events[0] ?? null,
    [eventId, events]
  );

  return { event, eventId, setEventId };
};

export const useTeamSelection = (event: Event | null) => {
  const [team, setTeam] = useState(event?.awayTeam ?? "");

  useEffect(() => {
    if (!event) {
      return;
    }
    if (team !== event.awayTeam && team !== event.homeTeam) {
      setTeam(event.awayTeam);
    }
  }, [event, team]);

  const teamOptions = useMemo(() => {
    if (!event) {
      return [];
    }
    return [event.awayTeam, event.homeTeam];
  }, [event]);

  return { team, setTeam, teamOptions };
};
