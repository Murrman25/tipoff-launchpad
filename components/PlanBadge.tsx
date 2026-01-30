"use client";

import type { PlanId } from "../lib/pricing";
import { planLabels } from "../lib/pricing";

type PlanBadgeProps = {
  plan: PlanId;
};

export default function PlanBadge({ plan }: PlanBadgeProps) {
  return (
    <span className={`plan-badge plan-${plan.toLowerCase()}`}>
      {planLabels[plan]}
    </span>
  );
}
