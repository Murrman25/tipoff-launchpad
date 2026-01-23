"use client";

import type { MarketType } from "@/src/lib/contracts";

export const formatSignedNumber = (value: number, decimals = 1) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(value * factor) / factor;
  const formatted =
    rounded % 1 === 0 && decimals > 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
  return `${rounded >= 0 ? "+" : ""}${formatted}`;
};

export const formatSignedMoney = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded}`;
};

export const formatMarketValue = (value: number, market: MarketType) => {
  if (market === "moneyline") {
    return formatSignedMoney(value);
  }
  return formatSignedNumber(value, 1);
};
