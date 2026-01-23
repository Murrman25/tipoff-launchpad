"use client";

import Link from "next/link";
import type { PlanId } from "@/lib/pricing";
import { planLabels } from "@/lib/pricing";
import { isPlanAtLeast, usePlan } from "@/lib/plan";

type FeatureLockProps = {
  requiredPlan: PlanId;
  children: React.ReactNode;
};

export default function FeatureLock({ requiredPlan, children }: FeatureLockProps) {
  const { currentPlan } = usePlan();
  const isLocked = !isPlanAtLeast(currentPlan, requiredPlan);
  const label = planLabels[requiredPlan];

  return (
    <div className={`feature-lock${isLocked ? " locked" : ""}`}>
      <div className="feature-lock-content" aria-hidden={isLocked}>
        {children}
      </div>
      {isLocked ? (
        <div className="feature-lock-overlay">
          <div className="feature-lock-text">Upgrade to {label} for the full edge</div>
          <Link className="btn btn-primary" href="/pricing">
            Go {label}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
