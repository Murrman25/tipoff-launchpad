"use client";

import Link from "next/link";
import type { PlanId } from "@/lib/pricing";
import { planLabels } from "@/lib/pricing";
import { isPlanAtLeast, usePlan } from "@/lib/plan";

type UpgradeCTAProps = {
  requiredPlan: PlanId;
  featureName: string;
};

export default function UpgradeCTA({ requiredPlan, featureName }: UpgradeCTAProps) {
  const { currentPlan } = usePlan();
  if (isPlanAtLeast(currentPlan, requiredPlan)) {
    return null;
  }
  const label = planLabels[requiredPlan];

  return (
    <div className="upgrade-cta">
      <div>
        <div className="label">Plan locked</div>
        <div className="meta">{featureName}</div>
      </div>
      <Link className="btn btn-ghost" href="/pricing">
        Go {label}
      </Link>
    </div>
  );
}
