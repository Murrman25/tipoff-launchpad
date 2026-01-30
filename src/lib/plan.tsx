"use client";

import Link from "../adapters/Link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const planTiers = ["FREE", "PRO", "ELITE"] as const;
export type PlanTier = (typeof planTiers)[number];

export type FeatureKey =
  | "alerts.unlimited"
  | "alerts.live"
  | "alerts.marketDepth"
  | "alerts.bookSelection"
  | "alerts.steam"
  | "alerts.keyNumbers"
  | "alerts.buyback"
  | "alerts.rlm"
  | "alerts.liveMomentum"
  | "notifications.push"
  | "notifications.webPush"
  | "notifications.email"
  | "notifications.sms"
  | "charts.basic"
  | "charts.advanced"
  | "api.readonly";

export const featureFlags: Record<FeatureKey, PlanTier> = {
  "alerts.unlimited": "PRO",
  "alerts.live": "PRO",
  "alerts.marketDepth": "PRO",
  "alerts.bookSelection": "PRO",
  "alerts.steam": "ELITE",
  "alerts.keyNumbers": "ELITE",
  "alerts.buyback": "ELITE",
  "alerts.rlm": "ELITE",
  "alerts.liveMomentum": "ELITE",
  "notifications.push": "PRO",
  "notifications.webPush": "PRO",
  "notifications.email": "ELITE",
  "notifications.sms": "ELITE",
  "charts.basic": "PRO",
  "charts.advanced": "ELITE",
  "api.readonly": "ELITE"
};

export const planLabels: Record<PlanTier, string> = {
  FREE: "Free",
  PRO: "Pro",
  ELITE: "Elite"
};

const planRank = (plan: PlanTier) => planTiers.indexOf(plan);

export const hasFeature = (plan: PlanTier, featureKey: FeatureKey) =>
  planRank(plan) >= planRank(featureFlags[featureKey]);

type PlanContextValue = {
  currentPlan: PlanTier;
  setCurrentPlan: (plan: PlanTier) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);
const STORAGE_KEY = "tipoff.plan.v2";

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("FREE");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && planTiers.includes(stored as PlanTier)) {
      setCurrentPlan(stored as PlanTier);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, currentPlan);
  }, [currentPlan]);

  const value = useMemo(() => ({ currentPlan, setCurrentPlan }), [currentPlan]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export const usePlan = () => {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlan must be used within PlanProvider.");
  }
  return context;
};

export function PlanBadge({ plan }: { plan?: PlanTier }) {
  const context = useContext(PlanContext);
  const resolvedPlan = plan ?? context?.currentPlan ?? "FREE";

  return (
    <span className={`plan-badge plan-${resolvedPlan.toLowerCase()}`}>
      {planLabels[resolvedPlan]}
    </span>
  );
}

export function FeatureLock({
  requiredPlan,
  featureName,
  children
}: {
  requiredPlan: PlanTier;
  featureName: string;
  children: React.ReactNode;
}) {
  const { currentPlan } = usePlan();
  const locked = planRank(currentPlan) < planRank(requiredPlan);

  return (
    <div className={`feature-lock${locked ? " locked" : ""}`}>
      <div className="feature-lock-content" aria-hidden={locked}>
        {children}
      </div>
      {locked ? (
        <div className="feature-lock-overlay">
          <div className="feature-lock-text">
            {featureName} is {planLabels[requiredPlan]} only
          </div>
          <Link className="btn btn-primary" href="/pricing">
            Upgrade to {planLabels[requiredPlan]}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function UpgradeCTA({
  requiredPlan,
  featureName
}: {
  requiredPlan: PlanTier;
  featureName?: string;
}) {
  const { currentPlan } = usePlan();
  if (planRank(currentPlan) >= planRank(requiredPlan)) {
    return null;
  }

  return (
    <div className="upgrade-cta">
      <div>
        <div className="label">Locked feature</div>
        <div className="meta">{featureName ?? "Upgrade to unlock this feature."}</div>
      </div>
      <Link className="btn btn-ghost" href="/pricing">
        Upgrade to {planLabels[requiredPlan]}
      </Link>
    </div>
  );
}
