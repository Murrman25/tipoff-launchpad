"use client";
import { planOrder, type PlanId } from "@/lib/pricing";
import { usePlan } from "@/lib/plan";

export default function DevPlanSwitcher() {
  const { currentPlan, setCurrentPlan } = usePlan();
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="dev-switcher">
      <span className="label">Dev plan</span>
      <select
        className="select"
        value={currentPlan}
        onChange={(event) => setCurrentPlan(event.target.value as PlanId)}
      >
        {planOrder.map((plan) => (
          <option key={plan} value={plan}>
            {plan}
          </option>
        ))}
      </select>
    </div>
  );
}
