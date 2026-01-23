export type Sport = "NFL" | "NBA" | "NCAAB" | "NCAAF" | string;
export type MarketType = "spread" | "total" | "moneyline";

export type Sportsbook = {
  id: string;
  name: string;
  shortName?: string;
  region?: string;
  url?: string;
};

export type InPlayState = {
  period?: string;
  clock?: string;
  statusText?: string;
  possession?: string;
  downDistance?: string;
  momentum?: "home" | "away" | "even";
  lastUpdate?: string;
};

export type OddsSnapshot = {
  id: string;
  eventId: string;
  market: MarketType;
  line: number;
  homeOdds: number;
  awayOdds: number;
  timestamp: string;
  sportsbookId?: string;
  isLive: boolean;
  tags?: string[];
};

export type ConsensusLine = {
  eventId: string;
  market: MarketType;
  line: number;
  homeOdds: number;
  awayOdds: number;
  timestamp: string;
  sources: string[];
};

export type Event = {
  id: string;
  sport: Sport;
  awayTeam: string;
  homeTeam: string;
  startTime: string;
  isLive: boolean;
  statusText?: string;
  inPlayState?: InPlayState;
  score?: {
    away: number;
    home: number;
  };
  lastUpdated?: string;
  consensus?: ConsensusLine[];
};

export type AlertRuleType =
  | "THRESHOLD_MOVE"
  | "THRESHOLD_AT"
  | "KEY_NUMBER_PROXIMITY"
  | "BUYBACK"
  | "LIVE_MOMENTUM"
  | "RLM"
  | "STEAM";

export type AlertRuleBase = {
  id: string;
  name: string;
  type: AlertRuleType;
  enabled: boolean;
  isLive: boolean;
  createdAt: string;
  eventId?: string;
  sport?: Sport;
  market?: MarketType;
  team?: "away" | "home" | string;
  cooldownSeconds?: number;
};

export type ThresholdAtRule = AlertRuleBase & {
  type: "THRESHOLD_AT";
  threshold: number;
  direction: "gte" | "lte";
};

export type ThresholdMoveRule = AlertRuleBase & {
  type: "THRESHOLD_MOVE";
  moveAmount: number;
  direction: "up" | "down" | "any";
  windowMinutes?: number;
};

export type KeyNumberProximityRule = AlertRuleBase & {
  type: "KEY_NUMBER_PROXIMITY";
  keyNumber: number;
  distance: number;
  leagues?: Sport[];
};

export type BuybackRule = AlertRuleBase & {
  type: "BUYBACK";
  originalLine: number;
  returnLine: number;
  windowMinutes: number;
};

export type LiveMomentumRule = AlertRuleBase & {
  type: "LIVE_MOMENTUM";
  runPoints: number;
  runSeconds: number;
  minLineMove: number;
};

export type RlmRule = AlertRuleBase & {
  type: "RLM";
  lineMove: number;
  ticketPercent: number;
  handlePercent: number;
};

export type SteamRule = AlertRuleBase & {
  type: "STEAM";
  scope: "global";
  minBooks: number;
  minMove: number;
  windowSeconds: number;
};

export type AlertRule =
  | ThresholdMoveRule
  | ThresholdAtRule
  | KeyNumberProximityRule
  | BuybackRule
  | LiveMomentumRule
  | RlmRule
  | SteamRule;

export type TargetTrackerSide = "away" | "home" | "over" | "under";
export type BetSide = "away" | "home" | "over" | "under";

export type TargetTracker = {
  id: string;
  eventId: string;
  sport: Sport;
  market: MarketType;
  side: TargetTrackerSide;
  target: number;
  isLive: boolean;
  notifyOnHit: boolean;
  alertRuleId?: string;
  autoRearm: boolean;
  cooldownSeconds: number;
  createdAt: string;
  lastHitAt?: string;
  nextRearmAt?: string;
  armed: boolean;
};

export type Notification = {
  id: string;
  eventId?: string;
  alertRuleId?: string;
  ruleType: AlertRuleType;
  firedAt: string;
  message: string;
  market?: MarketType;
  side?: BetSide;
  team?: string;
  line?: number;
  price?: number;
  sportsbookId?: string;
  event?: {
    awayTeam?: string;
    homeTeam?: string;
    sport?: Sport;
  };
  tags?: string[];
  isRead?: boolean;
  attribution?: {
    signal: "steam" | "key-number" | "rlm" | "momentum" | "threshold";
    confidence?: number;
  };
};

export type BetLog = {
  id: string;
  eventId?: string;
  alertRuleId?: string;
  sourceAlertId?: string;
  sport?: Sport;
  market: MarketType;
  team?: "away" | "home" | string;
  side?: BetSide;
  book?: string;
  stake: number;
  odds: number;
  line?: number;
  placedAt: string;
  result?: "open" | "win" | "loss" | "push";
  notificationId?: string;
  closingLine?: number;
  closingOdds?: number;
  tags?: string[];
  note?: string;
};

export type CLV = {
  id: string;
  eventId?: string;
  alertRuleId?: string;
  market: MarketType;
  team?: "away" | "home" | string;
  betLine: number;
  closeLine: number;
  betOdds?: number;
  closeOdds?: number;
  delta: number;
  calculatedAt: string;
};

export type DemoBookKey = "draftkings" | "fanduel" | "circa" | "pinnacle";

export type DemoLinePrice = {
  line: number;
  price: number;
  bookKey: DemoBookKey;
  updatedAt: string;
};

export type DemoPrice = {
  price: number;
  bookKey: DemoBookKey;
  updatedAt: string;
};

export type DemoLiveOdds = {
  spread: {
    away: DemoLinePrice;
    home: DemoLinePrice;
  };
  moneyline: {
    away: DemoPrice;
    home: DemoPrice;
  };
};

export type DemoLiveScore = {
  away: number;
  home: number;
};

export type DemoInPlayState = InPlayState & {
  live: boolean;
  score: DemoLiveScore;
  updatedAt: string;
};

export type DemoEvent = {
  id: string;
  sport: Sport;
  startTime: string;
  awayTeam: string;
  homeTeam: string;
  isLive: boolean;
  statusText?: string;
  inPlayState?: DemoInPlayState;
  lastUpdated: string;
  liveOdds: DemoLiveOdds;
};
