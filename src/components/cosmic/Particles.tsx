"use client";

import { useMemo } from "react";

// Partículas doradas/violetas flotantes — ambientación premium.
export function Particles({
  count = 14,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 29.3 + 5) % 95}%`,
        top: `${(i * 47.7 + 10) % 90}%`,
        size: 3 + ((i * 1.7) % 5),
        delay: `${(i * 0.9) % 14}s`,
        gold: i % 3 === 0,
      })),
    [count]
  );

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-drift"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            background: p.gold
              ? "radial-gradient(circle, #f3d9a7, rgba(233,189,121,0))"
              : "radial-gradient(circle, #d8b4fe, rgba(169,124,232,0))",
            filter: "blur(0.5px)",
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}
