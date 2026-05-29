import {
  rayHalfExtent,
  CANVAS,
  HERO_CARD,
  SATELLITE_CARD,
  LINE_MARGIN,
} from "@/lib/layout";

interface SatellitePosition {
  x: number;
  y: number;
  /**
   * Per-satellite half-height measured at runtime by CampaignCanvas's
   * ResizeObserver. Falls back to SATELLITE_CARD.halfHeight if a card
   * hasn't been measured yet (initial render).
   */
  halfHeight: number;
}

interface ConnectionLinesProps {
  positions: SatellitePosition[];
  selectedIndex?: number;
}

/** Per-line stagger for the draw-in animation. */
const STAGGER_S = 0.06;

/** Direction-vector to angle in our convention (0° = up, clockwise). */
function directionAngleDeg(dx: number, dy: number): number {
  return ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
}

/**
 * SVG layer drawing solid hero→satellite lines.
 *
 * Each line's outer endpoint uses the PER-SATELLITE measured halfHeight
 * (passed via positions) so the line lands cleanly at the actual card
 * edge — important because cards grow vertically with description
 * length. The hero card stays a fixed size so its halfHeight comes
 * from the static HERO_CARD constant.
 */
export function ConnectionLines({
  positions,
  selectedIndex = -1,
}: ConnectionLinesProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={CANVAS.width}
      height={CANVAS.height}
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
    >
      {positions.map((pos, i) => {
        const dx = pos.x - CANVAS.heroX;
        const dy = pos.y - CANVAS.heroY;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) return null;
        const ux = dx / dist;
        const uy = dy / dist;
        const angleDeg = directionAngleDeg(dx, dy);

        const heroEdge = rayHalfExtent(
          HERO_CARD.halfWidth,
          HERO_CARD.halfHeight,
          angleDeg,
        );
        const satEdge = rayHalfExtent(
          SATELLITE_CARD.halfWidth,
          pos.halfHeight,
          angleDeg,
        );

        const innerLen = heroEdge + LINE_MARGIN;
        const outerLen = dist - satEdge - LINE_MARGIN;
        if (innerLen >= outerLen) return null;

        const innerX = CANVAS.heroX + innerLen * ux;
        const innerY = CANVAS.heroY + innerLen * uy;
        const outerX = CANVAS.heroX + outerLen * ux;
        const outerY = CANVAS.heroY + outerLen * uy;

        const isSelected = i === selectedIndex;
        const lineDelay = i * STAGGER_S;

        return (
          <line
            key={i}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke={
              isSelected ? "var(--color-accent)" : "var(--color-text-secondary)"
            }
            strokeWidth={isSelected ? 1.5 : 1.5}
            // Dotted by default — "0 6" with a round linecap turns each
            // "dash" into a perfect circle the size of the stroke width,
            // spaced 6px apart. Selected goes solid so the highlighted
            // connection stands out at a glance.
            strokeDasharray={isSelected ? undefined : "0 23"}
            strokeLinecap={isSelected ? undefined : "round"}
            className="connection-line"
            style={{ animationDelay: `${lineDelay}s` }}
          />
        );
      })}
    </svg>
  );
}
