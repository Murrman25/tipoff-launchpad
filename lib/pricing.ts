export const planOrder = ["FREE", "PRO", "ELITE"] as const;

export type PlanId = (typeof planOrder)[number];

export type BillingInterval = "monthly" | "annual";

export type PlanTier = {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  ctaLabel: string;
  badge?: string;
  highlights: string[];
};

export type PlanFeature = {
  key: string;
  label: string;
  availability: Record<PlanId, boolean | string>;
};

export const planLabels: Record<PlanId, string> = {
  FREE: "Free",
  PRO: "Pro",
  ELITE: "Elite"
};

export const pricingTiers: PlanTier[] = [
  {
    id: "FREE",
    name: "FREE",
    description: "Track line movement and set a few key alerts.",
    priceMonthly: 0,
    priceAnnual: 0,
    ctaLabel: "Start Free",
    highlights: [
      "Live + pregame board",
      "Real-time odds updates (view-only)",
      "Event detail views",
      "Up to 3 active alerts",
      "Basic threshold alerts",
      "In-app notifications only"
    ]
  },
  {
    id: "PRO",
    name: "PRO",
    description: "All-market alerting with book-level control.",
    priceMonthly: 15,
    priceAnnual: 139,
    ctaLabel: "Go Pro",
    badge: "Best Value",
    highlights: [
      "Unlimited alerts",
      "Pregame + live thresholds",
      "Spread, total, moneyline markets",
      "Specific books + consensus lines",
      "Push + web push delivery",
      "Basic line history charts"
    ]
  },
  {
    id: "ELITE",
    name: "ELITE",
    description: "Market intelligence for sharper bettors.",
    priceMonthly: 25,
    priceAnnual: 239,
    ctaLabel: "Go Elite",
    badge: "Most Powerful",
    highlights: [
      "Steam move alerts",
      "Key number crossing alerts",
      "Book vs consensus gaps",
      "Priority alert evaluation",
      "Advanced charts + book tables",
      "Read-only API access"
    ]
  }
];

export const pricingFeatures: PlanFeature[] = [
  {
    key: "dashboard",
    label: "Live + pregame board",
    availability: { FREE: true, PRO: true, ELITE: true }
  },
  {
    key: "odds",
    label: "Real-time odds updates (view-only)",
    availability: { FREE: true, PRO: true, ELITE: true }
  },
  {
    key: "event-detail",
    label: "Event detail views",
    availability: { FREE: true, PRO: true, ELITE: true }
  },
  {
    key: "status-badges",
    label: "Status badges (pregame + live clock)",
    availability: { FREE: true, PRO: true, ELITE: true }
  },
  {
    key: "alerts-limit",
    label: "Alert capacity",
    availability: { FREE: "Up to 3", PRO: "Unlimited", ELITE: "Unlimited" }
  },
  {
    key: "alert-types",
    label: "Markets covered",
    availability: {
      FREE: "Basic thresholds",
      PRO: "Spread, total, moneyline",
      ELITE: "Spread, total, moneyline"
    }
  },
  {
    key: "in-play",
    label: "Live (in-play) alerts",
    availability: { FREE: "Pregame only", PRO: "Pregame + live", ELITE: "Pregame + live" }
  },
  {
    key: "books",
    label: "Book selection + consensus lines",
    availability: {
      FREE: false,
      PRO: "Specific books + consensus",
      ELITE: "Specific books + consensus"
    }
  },
  {
    key: "cooldowns",
    label: "Alert cooldown tuning",
    availability: { FREE: false, PRO: true, ELITE: true }
  },
  {
    key: "delivery",
    label: "Alert delivery channels",
    availability: { FREE: "In-app only", PRO: "In-app + push", ELITE: "In-app + push" }
  },
  {
    key: "charts",
    label: "Line history charts",
    availability: { FREE: false, PRO: "Basic", ELITE: "Advanced" }
  },
  {
    key: "steam",
    label: "Steam move alerts",
    availability: { FREE: false, PRO: false, ELITE: true }
  },
  {
    key: "key-numbers",
    label: "Key number crossings (NFL/NCAAF)",
    availability: { FREE: false, PRO: false, ELITE: true }
  },
  {
    key: "discrepancy",
    label: "Book vs consensus gaps",
    availability: { FREE: false, PRO: false, ELITE: true }
  },
  {
    key: "priority",
    label: "Priority alert evaluation",
    availability: { FREE: false, PRO: false, ELITE: "Faster alerts" }
  },
  {
    key: "comparisons",
    label: "Book-by-book comparison tables",
    availability: { FREE: false, PRO: false, ELITE: true }
  },
  {
    key: "email",
    label: "Email alerts add-on",
    availability: { FREE: false, PRO: false, ELITE: "Optional add-on" }
  },
  {
    key: "sms",
    label: "SMS alerts add-on",
    availability: { FREE: false, PRO: false, ELITE: "Optional add-on" }
  },
  {
    key: "api",
    label: "Read-only API access",
    availability: { FREE: false, PRO: false, ELITE: "Rate-limited" }
  }
];
