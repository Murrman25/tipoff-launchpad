"use client";

import { useMemo, useState } from "react";
import FAQ from "@/components/FAQ";
import FeatureComparisonTable from "@/components/FeatureComparisonTable";
import PlanBadge from "@/components/PlanBadge";
import PricingCard from "@/components/PricingCard";
import type { BillingInterval, PlanId } from "@/lib/pricing";
import { pricingFeatures, pricingTiers } from "@/lib/pricing";
import { usePlan } from "@/lib/plan";

const faqItems = [
  {
    question: "Do alerts work live?",
    answer:
      "Yes. Pro and Elite include live in-play thresholds, while Free stays pregame-only."
  },
  {
    question: "How fast are TipOff alerts?",
    answer:
      "Alerts fire within seconds of a line move, with priority evaluation on Elite."
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel anytime from your account and keep access through your billing period."
  },
  {
    question: "What's included in Elite?",
    answer:
      "Elite adds steam moves, key numbers, discrepancy alerts, advanced charts, and API access."
  }
];

export default function PricingPage() {
  const { currentPlan } = usePlan();
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("PRO");

  const selectedTier = useMemo(
    () => pricingTiers.find((tier) => tier.id === selectedPlan) ?? pricingTiers[0],
    [selectedPlan]
  );

  return (
    <div className="pricing-page">
      <section className="panel pricing-hero">
        <div>
          <h2 className="page-title">TipOff Plans & Pricing</h2>
          <p className="page-subtitle">
            Real-time line movement and alerting across NFL, NBA, NCAAB, and NCAAF
          </p>
          <div className="pricing-meta">
            <span className="label">Your plan</span>
            <PlanBadge plan={currentPlan} />
          </div>
        </div>
        <div className="pricing-toggle">
          <span className="label">Billing cycle</span>
          <div className="toggle-row">
            <button
              className={`pill${interval === "monthly" ? " active" : ""}`}
              onClick={() => setInterval("monthly")}
              type="button"
            >
              Monthly
            </button>
            <button
              className={`pill${interval === "annual" ? " active" : ""}`}
              onClick={() => setInterval("annual")}
              type="button"
            >
              Annual
            </button>
          </div>
          <div className="meta">Annual billing saves two months.</div>
        </div>
      </section>

      <section className="pricing-cards">
        {pricingTiers.map((tier) => (
          <PricingCard
            key={tier.id}
            tier={tier}
            interval={interval}
            selected={selectedPlan === tier.id}
            currentPlan={currentPlan}
            onSelect={setSelectedPlan}
          />
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Plan Comparison</h3>
          <span className="meta">Every plan includes the core live board.</span>
        </div>
        <FeatureComparisonTable tiers={pricingTiers} features={pricingFeatures} />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3 className="panel-title">Pricing FAQ</h3>
          <span className="meta">Quick answers before you upgrade.</span>
        </div>
        <FAQ items={faqItems} />
      </section>

      <div className="footer-disclaimer">
        TipOff is informational only and not affiliated with any sportsbook.
      </div>

      <div className="pricing-sticky">
        <div>
          <div className="label">Plan selected</div>
          <div className="pricing-sticky-plan">{selectedTier.name}</div>
          <div className="meta">
            {interval === "monthly"
              ? `$${selectedTier.priceMonthly}/mo`
              : `$${selectedTier.priceAnnual}/yr`}
          </div>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            // TODO: Wire to Stripe Checkout or billing portal.
          }}
        >
          {selectedTier.ctaLabel}
        </button>
      </div>
    </div>
  );
}
