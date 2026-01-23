"use client";

import type { PlanFeature, PlanTier } from "@/lib/pricing";
import { planLabels } from "@/lib/pricing";

type FeatureComparisonTableProps = {
  tiers: PlanTier[];
  features: PlanFeature[];
};

const CheckIcon = () => (
  <svg
    className="comparison-check"
    viewBox="0 0 16 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M1 6.5L5.2 10.5L15 1.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function FeatureComparisonTable({
  tiers,
  features
}: FeatureComparisonTableProps) {
  return (
    <div className="comparison">
      <div className="comparison-desktop">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Capability</th>
              {tiers.map((tier) => (
                <th key={tier.id}>{planLabels[tier.id]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature.key}>
                <td className="comparison-feature">{feature.label}</td>
                {tiers.map((tier) => {
                  const value = feature.availability[tier.id];
                  return (
                    <td key={tier.id} className="comparison-cell">
                      {value === true ? (
                        <CheckIcon />
                      ) : value === false ? (
                        <span className="comparison-dash">-</span>
                      ) : (
                        <span className="comparison-text">{value}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="comparison-mobile">
        {tiers.map((tier) => (
          <details key={tier.id} className="comparison-card">
            <summary>
              <span>{planLabels[tier.id]}</span>
              <span className="comparison-summary">{tier.description}</span>
            </summary>
            <div className="comparison-list">
              {features.map((feature) => {
                const value = feature.availability[tier.id];
                return (
                  <div key={feature.key} className="comparison-item">
                    <span className="comparison-item-label">{feature.label}</span>
                    <span className="comparison-item-value">
                      {value === true ? (
                        <CheckIcon />
                      ) : value === false ? (
                        "-"
                      ) : (
                        value
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
