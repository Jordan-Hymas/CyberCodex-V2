"use client";

import { useMemo } from "react";

const COLORS = ["#3dfc8a", "#4cc9ff", "#a07cff", "#ff5fa2", "#ffd23f", "#ff9b3d"];

/**
 * One-shot burst of square "pixel" confetti. Re-mount (change `key`) to fire again.
 * Purely decorative: hidden from assistive tech and skipped with reduced motion.
 */
export function PixelConfetti({ pieces = 70 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        size: 6 + Math.round(Math.random() * 2) * 3,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.25,
        duration: 1.1 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 220,
        spin: Math.round(Math.random() * 4) * 90,
      })),
    [pieces]
  );

  return (
    <div className="pixel-confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${b.left}%`,
              width: b.size,
              height: b.size,
              background: b.color,
              boxShadow: "2px 2px 0 0 #12132b",
              animation: `confetti-fall ${b.duration}s steps(14) ${b.delay}s both`,
              "--drift": `${b.drift}px`,
              "--spin": `${b.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
