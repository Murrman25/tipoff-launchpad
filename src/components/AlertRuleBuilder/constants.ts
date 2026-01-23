"use client";

import { formatLocalTime } from "@/lib/format";
import type { Event, MarketType } from "@/src/lib/contracts";

export const markets: MarketType[] = ["spread", "total", "moneyline"];

export const formatEventLabel = (event: Event) =>
  `${event.awayTeam} @ ${event.homeTeam} - ${formatLocalTime(event.startTime)}`;
