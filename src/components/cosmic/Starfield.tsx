"use client";

import { useMemo } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

// Cielo estrellado: dos capas — estrellas fijas tenues y estrellas titilantes.
// Todo CSS puro, respeta prefers-reduced-motion vía globals.css.
export function Starfield({ density = 70, className = "" }: { density?: number; className?: string }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: density }, (_, i) => ({
        x: (i * 37.77 + 13) % 100,
        y: (i * 53.31 + 7) % 100,
        size: i % 9 === 0 ? 2.2 : i % 4 === 0 ? 1.5 : 1,
        delay: (i * 0.37) % 4,
        duration: 3 + ((i * 0.61) % 4),
        opacity: 0.25 + ((i * 0.13) % 0.6),
      })),
    [density]
  );

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            background: i % 11 === 0 ? "#e9bd79" : "#f5efe7",
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow: s.size > 1.5 ? "0 0 6px rgba(245,239,231,0.5)" : "none",
          }}
        />
      ))}
    </div>
  );
}
