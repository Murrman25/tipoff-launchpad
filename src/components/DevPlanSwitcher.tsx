"use client";

import type { ChangeEvent } from "react";
import { planLabels, planTiers, usePlan, type PlanTier } from "../lib/plan";

export function DevPlanSwitcher() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const { currentPlan, setCurrentPlan } = usePlan();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setCurrentPlan(event.target.value as PlanTier);
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(148, 163, 184, 0.4)",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#e2e8f0",
        zIndex: 50,
        fontSize: 12,
        letterSpacing: "0.02em"
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Dev Plan</div>
      <select
        aria-label="Switch plan"
        value={currentPlan}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid rgba(148, 163, 184, 0.4)",
          background: "rgba(15, 23, 42, 0.95)",
          color: "inherit"
        }}
      >
        {planTiers.map((tier) => (
          <option key={tier} value={tier}>
            {planLabels[tier]}
          </option>
        ))}
      </select>
    </div>
  );
}
