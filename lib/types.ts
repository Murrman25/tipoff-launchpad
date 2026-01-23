export type Sport = "NFL" | "NBA" | "NCAAB" | "NCAAF" | string;

export type InPlayState = {
  period?: string;
  clock?: string;
  statusText?: string;
};

export type Event = {
  id: string;
  awayTeam: string;
  homeTeam: string;
  sport: Sport;
  startTime: string;
  isLive: boolean;
  statusText?: string;
  inPlayState?: InPlayState;
  score?: {
    away: number;
    home: number;
  };
};

export type Alert = {
  id: string;
  sport?: Sport;
  team: string;
  market: string;
  threshold: number;
  isLive: boolean;
  enabled: boolean;
  lastTriggeredAt?: string;
  eventId?: string;
};

export type Notification = {
  id: string;
  eventId: string;
  condition: string;
  firedAt: string;
  isRead?: boolean;
  awayTeam?: string;
  homeTeam?: string;
};

export type AlertTriggeredPayload = {
  id?: string;
  eventId?: string;
  condition?: string;
  message?: string;
  firedAt?: string;
  event?: {
    awayTeam?: string;
    homeTeam?: string;
  };
};
