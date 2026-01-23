"use client";

import type { BillingInterval, PlanId, PlanTier } from "@/lib/pricing";
import { planLabels } from "@/lib/pricing";

type PricingCardProps = {
  tier: PlanTier;
  interval: BillingInterval;
  selected: boolean;
  currentPlan: PlanId;
  onSelect: (plan: PlanId) => void;
};

const formatPrice = (value: number) => (value === 0 ? "$0" : `$${value}`);

export default function PricingCard({
  tier,
  interval,
  selected,
  currentPlan,
  onSelect
}: PricingCardProps) {
  const price = interval === "monthly" ? tier.priceMonthly : tier.priceAnnual;
  const cadence = interval === "monthly" ? "mo" : "yr";
  const annualSavings =
    tier.priceMonthly > 0
      ? tier.priceMonthly * 12 - tier.priceAnnual
      : 0;
  const isCurrent = currentPlan === tier.id;

  return (
    <div
      className={`pricing-card${tier.badge ? " highlight" : ""}${
        selected ? " selected" : ""
      }`}
      onClick={() => onSelect(tier.id)}
    >
      {tier.badge ? <div className="pricing-badge">{tier.badge}</div> : null}
      {isCurrent ? (
        <div className="pricing-current">{planLabels[tier.id]} plan</div>
      ) : null}
      <h3 className="pricing-title">{tier.name}</h3>
      <p className="pricing-description">{tier.description}</p>
      <div className="pricing-price">
        <span className="pricing-amount">{formatPrice(price)}</span>
        <span className="pricing-cadence">/{cadence}</span>
      </div>
      {interval === "annual" && annualSavings > 0 ? (
        <div className="pricing-savings">Save ${annualSavings} per year</div>
      ) : null}
      <ul className="pricing-features">
        {tier.highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button
        className={`btn ${tier.id === "FREE" ? "btn-ghost" : "btn-primary"}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect(tier.id);
          // TODO: Wire to Stripe Checkout or billing portal.
        }}
        disabled={isCurrent}
      >
        {isCurrent ? "On this plan" : tier.ctaLabel}
      </button>
    </div>
  );
}
