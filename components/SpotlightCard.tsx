"use client";

import { useCallback, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export default function SpotlightCard({
  children,
  className,
  style
}: SpotlightCardProps) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMove = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const node = ref.current;
    if (!node) {
      return;
    }
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    node.style.setProperty("--spotlight-x", `${x}px`);
    node.style.setProperty("--spotlight-y", `${y}px`);
  }, []);

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    node.style.setProperty("--spotlight-x", "50%");
    node.style.setProperty("--spotlight-y", "50%");
  }, []);

  return (
    <article
      ref={ref}
      className={`spotlight-card${className ? ` ${className}` : ""}`}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </article>
  );
}
