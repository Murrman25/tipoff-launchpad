"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { planOrder, type PlanId } from "@/lib/pricing";

type PlanContextValue = {
  currentPlan: PlanId;
  setCurrentPlan: (plan: PlanId) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);
const STORAGE_KEY = "tipoff.currentPlan";

export const planRank = (plan: PlanId) => planOrder.indexOf(plan);

export const isPlanAtLeast = (current: PlanId, required: PlanId) =>
  planRank(current) >= planRank(required);

const isValidPlan = (value: string): value is PlanId =>
  planOrder.includes(value as PlanId);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("FREE");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isValidPlan(stored)) {
      setCurrentPlan(stored);
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
