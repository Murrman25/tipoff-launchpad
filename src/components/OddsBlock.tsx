"use client";

import type { DemoBookKey, DemoLinePrice, DemoPrice } from "@/src/lib/contracts";

type OddsSide = DemoLinePrice | DemoPrice;

type OddsBlockProps = {
  label: string;
  market: "spread" | "moneyline";
  awayLabel: string;
  homeLabel: string;
  away: OddsSide;
  home: OddsSide;
};

const bookLabels: Record<DemoBookKey, string> = {
  draftkings: "DK",
  fanduel: "FD",
  circa: "CIR",
  pinnacle: "PIN"
};

const formatOdds = (value: number) => `${value >= 0 ? "+" : ""}${Math.round(value)}`;

const formatLine = (value: number) => {
  const rounded = Math.round(value * 2) / 2;
  const formatted = rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

const formatValue = (market: OddsBlockProps["market"], side: OddsSide) => {
  if (market === "moneyline") {
    return formatOdds(side.price);
  }
  const lineValue = "line" in side ? formatLine(side.line) : "--";
  return `${lineValue} (${formatOdds(side.price)})`;
};

const bookLabel = (side: OddsSide) => bookLabels[side.bookKey] ?? side.bookKey.toUpperCase();

export default function OddsBlock({
  label,
  market,
  awayLabel,
  homeLabel,
  away,
  home
}: OddsBlockProps) {
  return (
    <div className="odds-block">
      <div className="label">{label}</div>
      <div className="odds-row">
        <span className="odds-team">{awayLabel}</span>
        <span className="odds-value">{formatValue(market, away)}</span>
        <span className="odds-book">{bookLabel(away)}</span>
      </div>
      <div className="odds-row">
        <span className="odds-team">{homeLabel}</span>
        <span className="odds-value">{formatValue(market, home)}</span>
        <span className="odds-book">{bookLabel(home)}</span>
      </div>
    </div>
  );
}
