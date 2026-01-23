"use client";

import type { MarketType } from "@/src/lib/contracts";

type CLVBadgeProps = {
  value?: number | null;
  market: MarketType;
};

const formatSigned = (value: number, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const classifyClv = (value: number, market: MarketType) => {
  const threshold = market === "moneyline" ? 10 : 0.5;
  if (value >= threshold) {
    return "good" as const;
  }
  if (value <= -threshold) {
    return "bad" as const;
  }
  return "neutral" as const;
};

export default function CLVBadge({ value, market }: CLVBadgeProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <span className="clv-badge clv-pending">Awaiting close</span>;
  }

  const label = classifyClv(value, market);
  const unit = market === "moneyline" ? "c" : "pts";
  const formatted = market === "moneyline" ? formatSigned(value, 0) : formatSigned(value, 1);

  return (
    <span className={`clv-badge clv-${label}`}>
      {formatted} {unit} {label}
    </span>
  );
}
