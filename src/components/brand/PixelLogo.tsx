import { cn } from "@/lib/utils";

/**
 * The CyberCodex mark — `{ ⌖ }` drawn on a 17×13 pixel grid, redrawn from
 * public/images/cyberCodexLogoOnly.png so it stays crisp at any size.
 */
const BRACE_LEFT: [number, number][] = [
  [3, 0], [4, 0],
  [2, 1], [2, 2], [2, 3], [2, 4],
  [1, 5], [0, 6], [1, 7],
  [2, 8], [2, 9], [2, 10], [2, 11],
  [3, 12], [4, 12],
];
const BRACE_RIGHT = BRACE_LEFT.map(([x, y]) => [16 - x, y] as [number, number]);

const GLYPH_BODY: [number, number][] = [
  [8, 2],
  [7, 3], [8, 3], [9, 3],
  [6, 4], [7, 4], [8, 4], [9, 4], [10, 4],
  [6, 5], [10, 5],
  [6, 6], [7, 6], [8, 6], [9, 6], [10, 6],
  [7, 7], [9, 7],
  [8, 8], [8, 9], [8, 10], [8, 11],
];
const GLYPH_LIGHT: [number, number][] = [
  [8, 0], [7, 1], [8, 1], [9, 1],
  [7, 5], [8, 5], [9, 5],
  [8, 7],
];

export interface PixelLogoProps {
  size?: number;
  className?: string;
  /** Draw the hard ink drop-shadow behind the mark */
  shadow?: boolean;
}

function Pixels({ cells, fill, dx = 0, dy = 0 }: { cells: [number, number][]; fill: string; dx?: number; dy?: number }) {
  return (
    <>
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x + dx} y={y + dy} width="1" height="1" fill={fill} />
      ))}
    </>
  );
}

export function PixelLogo({ size = 40, className, shadow = true }: PixelLogoProps) {
  const all = [...BRACE_LEFT, ...BRACE_RIGHT, ...GLYPH_BODY, ...GLYPH_LIGHT];
  return (
    <svg
      viewBox="0 0 18 14"
      width={size}
      height={(size * 14) / 18}
      className={cn("shrink-0", className)}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {shadow && <Pixels cells={all} fill="var(--color-cyber-ink)" dx={1} dy={1} />}
      <Pixels cells={[...BRACE_LEFT, ...BRACE_RIGHT]} fill="var(--color-cyber-primary)" />
      <Pixels cells={GLYPH_BODY} fill="var(--color-cyber-primary-dark)" />
      <Pixels cells={GLYPH_LIGHT} fill="var(--color-cyber-warning)" />
    </svg>
  );
}

export function Wordmark({ className, size }: { className?: string; size?: string }) {
  return (
    <span
      className={cn("font-pixel leading-none whitespace-nowrap [text-shadow:2px_2px_0_var(--color-cyber-ink)]", className)}
      style={{ fontSize: size ?? "var(--font-size-nav-logo)" }}
    >
      <span className="text-cyber-primary">Cyber</span>
      <span className="text-cyber-text-primary">Codex</span>
    </span>
  );
}
