"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FeatureLock from "@/components/FeatureLock";
import PlanBadge from "@/components/PlanBadge";
import UpgradeCTA from "@/components/UpgradeCTA";
import { usePlan } from "@/lib/plan";
import HedgeCalculator from "@/src/components/HedgeCalculator";
import MiddleFinder from "@/src/components/MiddleFinder";

const tabs = [
  { id: "hedge", label: "Hedge Calculator" },
  { id: "middle", label: "Middle Finder" }
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "middle" ? "middle" : "hedge";
  const eventId = searchParams.get("eventId") ?? undefined;
  const betId = searchParams.get("betId") ?? undefined;
  const { currentPlan } = usePlan();
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const headerCopy = useMemo(() => {
    return activeTab === "hedge"
      ? "Dial in hedges with live odds and profit locks."
      : "Scan live lines for middle windows on your pregame bets.";
  }, [activeTab]);

  return (
    <>
      <section className="page-header">
        <div>
          <h2 className="page-title">Edge Tools</h2>
          <p className="page-subtitle">{headerCopy}</p>
        </div>
        <PlanBadge plan={currentPlan} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="panel-title">Tools</h3>
            <span className="meta">Built for live hedging and variance control.</span>
          </div>
          <div className="toggle-row tools-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`pill${activeTab === tab.id ? " active" : ""}`}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <FeatureLock requiredPlan="PRO">
          {activeTab === "hedge" ? (
            <HedgeCalculator defaultEventId={eventId} defaultBetId={betId} />
          ) : (
            <MiddleFinder defaultEventId={eventId} />
          )}
        </FeatureLock>
        <UpgradeCTA requiredPlan="PRO" featureName="Edge tools" />
      </section>
    </>
  );
}



