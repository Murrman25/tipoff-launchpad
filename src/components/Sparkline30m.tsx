"use client";

import { useMemo, useState } from "react";
import { formatLocalTime } from "@/lib/format";

export type SparklinePoint = {
  timestamp: string;
  value: number;
};

type Sparkline30mProps = {
  points: SparklinePoint[];
  height?: number;
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const formatValue = (value: number) => {
  if (Number.isNaN(value)) {
    return "--";
  }
  const rounded = Math.round(value * 2) / 2;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

export default function Sparkline30m({
  points,
  height = 36,
  className
}: Sparkline30mProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { coords, path } = useMemo(() => {
    if (!points.length) {
      return { coords: [] as Array<SparklinePoint & { x: number; y: number }>, path: "" };
    }

    const sorted = [...points].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const values = sorted.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const coords = sorted.map((point, index) => {
      const x =
        sorted.length === 1 ? 50 : (index / (sorted.length - 1)) * 100;
      const normalized = (point.value - min) / range;
      const y = height - normalized * height;
      return { ...point, x, y };
    });

    const path = coords
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");

    return { coords, path };
  }, [points, height]);

  const activePoint = activeIndex !== null ? coords[activeIndex] : null;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!coords.length) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width ? (event.clientX - rect.left) / rect.width : 0;
    const index = clamp(
      Math.round(ratio * (coords.length - 1)),
      0,
      coords.length - 1
    );
    setActiveIndex((prev) => (prev === index ? prev : index));
  };

  const handlePointerLeave = () => {
    setActiveIndex(null);
  };

  if (!points.length) {
    return (
      <div className={`sparkline ${className ?? ""}`.trim()}>
        <div className="sparkline-empty">No 30m data</div>
      </div>
    );
  }

  return (
    <div className={`sparkline ${className ?? ""}`.trim()}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="sparkline-svg"
      >
        <path className="sparkline-path" d={path} />
        {coords.map((point, index) => (
          <circle
            key={`${point.timestamp}-${index}`}
            className={`sparkline-dot${activeIndex === index ? " active" : ""}`}
            cx={point.x}
            cy={point.y}
            r={activeIndex === index ? 2.6 : 1.6}
          >
            <title>
              {formatValue(point.value)} @ {formatLocalTime(point.timestamp)}
            </title>
          </circle>
        ))}
      </svg>
      {activePoint ? (
        <div className="sparkline-tooltip" style={{ left: `${activePoint.x}%` }}>
          <div className="sparkline-tooltip-value">
            {formatValue(activePoint.value)}
          </div>
          <div className="sparkline-tooltip-time">
            {formatLocalTime(activePoint.timestamp)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
