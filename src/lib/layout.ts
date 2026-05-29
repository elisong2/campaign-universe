/**
 * Geometry helpers for the orbital campaign visualization.
 *
 * Coordinate convention: angle 0° points straight up (12 o'clock),
 * angles increase clockwise.
 *
 * Two-zone layout:
 *   - Inner ring (satellites 1–8): a circle at innerRadius. Satellites
 *     can be freely positioned via drag; default formation slots are
 *     fixed angles (0°, 45°, 90°, ..., 315°) when no position is set.
 *   - Outer rect (satellites 7–12): 6 fixed slots near the canvas
 *     edges — four corners plus a mid-left/mid-right pair — filled
 *     in a diagonally-balanced order so each add visually balances
 *     against the previous one rather than crowding one side.
 *
 * Free dragging: each Asset can carry an optional `position: {x, y}`.
 * If set, that's where the satellite renders. If absent, falls back
 * to the formation slot for its array index.
 */

export type Point = { x: number; y: number };

/** Convert a (radius, angle) polar coordinate to (x, y) cartesian. */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleDeg: number,
): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

/**
 * Distance from a rectangle's center to its edge along the given direction.
 * Used to start/stop a connection line just outside each card.
 */
export function rayHalfExtent(
  halfWidth: number,
  halfHeight: number,
  angleDeg: number,
): number {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const dx = Math.abs(Math.cos(angleRad));
  const dy = Math.abs(Math.sin(angleRad));
  const tx = dx > 0.0001 ? halfWidth / dx : Infinity;
  const ty = dy > 0.0001 ? halfHeight / dy : Infinity;
  return Math.min(tx, ty);
}

/** Canvas dimensions and key positions. */
export const CANVAS = {
  width: 1500,
  height: 1080,
  heroX: 750,
  heroY: 540,
  /**
   * Inner-ring radius — circle for satellites 1–6 (60° apart).
   * Sized so the inner ring sits roughly halfway between the hero
   * and the outer-ring satellites. The outer corner slots sit at
   * distance ≈716 from hero (sqrt(OUTER_X_OFFSET² + OUTER_Y_OFFSET²)),
   * so ~360 puts inner satellites at the visual midpoint.
   *
   * Bumping this pushes the inner ring further from the hero. Vertical
   * headroom is the binding constraint: at the top/bottom slots (0°
   * and 180°) a satellite is rendered at heroY ∓ innerRadius, so if
   * cards start clipping the canvas you also need to grow `height` and
   * `heroY` here (keep heroY ≈ height/2 to stay centered).
   */
  innerRadius: 360,
} as const;

/** Maximum satellites in the inner ring (60° apart for equal spacing). */
export const INNER_RING_CAPACITY = 6;

/**
 * Maximum satellites in the outer rect: 4 corners + R + L (the L and R
 * slots are directly left/right of the hero, staggered between the
 * existing corner positions on each side).
 */
export const OUTER_RECT_CAPACITY = 6;

/** Half-extents of the hero card. */
export const HERO_CARD = { halfWidth: 150, halfHeight: 80 } as const;

/**
 * Half-extents of a satellite card. Used as the FALLBACK for line
 * geometry before ResizeObserver has measured each card's actual
 * height, and as the static value for drag clamping + outer-rect
 * corner positions. Bumped to 95 (was 65) because cards now grow
 * to fit full descriptions — this safety value keeps even larger
 * cards from being clamped off-canvas at extreme drag positions.
 */
export const SATELLITE_CARD = { halfWidth: 95, halfHeight: 95 } as const;

/** Pixels of breathing room between the card edge and the line endpoint. */
export const LINE_MARGIN = 10;

/** Margin from canvas edge for outer rect positions and drag clamp. */
const CANVAS_EDGE_MARGIN = 10;

/**
 * "Pull-in" factor for outer rect corner positions. 1.0 would be
 * extreme corner; lower values pull the satellite in toward the
 * center. 0.92 lands the cards close to corners but not crammed
 * against them, and clears the inner ring at 45° increments.
 */
const OUTER_CORNER_FACTOR = 0.92;

/** X offset from hero center for outer-corner satellites. */
const OUTER_X_OFFSET =
  ((CANVAS.width - 2 * SATELLITE_CARD.halfWidth - 2 * CANVAS_EDGE_MARGIN) /
    2) *
  OUTER_CORNER_FACTOR;

/** Y offset from hero center for outer-corner satellites. */
const OUTER_Y_OFFSET =
  ((CANVAS.height - 2 * SATELLITE_CARD.halfHeight - 2 * CANVAS_EDGE_MARGIN) /
    2) *
  OUTER_CORNER_FACTOR;

/**
 * Outer-rect positions, filled in a diagonally-balanced order. Each
 * slot is paired with its diagonal counterpart so satellites #7 and #8
 * land on opposite corners, etc. — keeps the layout visually balanced
 * as the user adds satellites one at a time.
 *
 *   0 = UL (upper-left corner)
 *   1 = LR (lower-right corner)
 *   2 = LL (lower-left corner)
 *   3 = UR (upper-right corner)
 *   4 = ML (middle-left, directly left of hero)
 *   5 = MR (middle-right, directly right of hero)
 */
export const OUTER_RECT_POSITIONS: Point[] = [
  { x: CANVAS.heroX - OUTER_X_OFFSET, y: CANVAS.heroY - OUTER_Y_OFFSET }, // UL
  { x: CANVAS.heroX + OUTER_X_OFFSET, y: CANVAS.heroY + OUTER_Y_OFFSET }, // LR
  { x: CANVAS.heroX - OUTER_X_OFFSET, y: CANVAS.heroY + OUTER_Y_OFFSET }, // LL
  { x: CANVAS.heroX + OUTER_X_OFFSET, y: CANVAS.heroY - OUTER_Y_OFFSET }, // UR
  { x: CANVAS.heroX - OUTER_X_OFFSET, y: CANVAS.heroY },                  // ML
  { x: CANVAS.heroX + OUTER_X_OFFSET, y: CANVAS.heroY },                  // MR
];

/**
 * Default formation position for the Nth satellite, used when the
 * asset has no explicit `position`. Inner-ring slots are at fixed 45°
 * angles; outer-ring slots come from OUTER_RECT_POSITIONS.
 */
export function getDefaultFormationPosition(index: number): Point {
  if (index < INNER_RING_CAPACITY) {
    const angle = (360 / INNER_RING_CAPACITY) * index;
    return polarToCartesian(
      CANVAS.heroX,
      CANVAS.heroY,
      CANVAS.innerRadius,
      angle,
    );
  }
  const outerIdx = (index - INNER_RING_CAPACITY) % OUTER_RECT_CAPACITY;
  return OUTER_RECT_POSITIONS[outerIdx];
}

/**
 * Find the best inner-ring angle for a NEW satellite, given the
 * existing satellite positions. Picks the midpoint of the largest
 * angular gap so adds stay visually balanced without disturbing
 * existing positions.
 *
 * If no existing satellites, returns 0° (top).
 */
export function findBestInnerAngle(existingPositions: Point[]): number {
  if (existingPositions.length === 0) return 0;

  const angles = existingPositions
    .map((p) => {
      const dx = p.x - CANVAS.heroX;
      const dy = p.y - CANVAS.heroY;
      return ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360;
    })
    .sort((a, b) => a - b);

  let bestMid = 0;
  let largestGap = -1;

  // Gaps between consecutive sorted angles
  for (let i = 0; i < angles.length - 1; i++) {
    const gap = angles[i + 1] - angles[i];
    if (gap > largestGap) {
      largestGap = gap;
      bestMid = (angles[i] + gap / 2) % 360;
    }
  }
  // Wrap-around gap from the last angle back to the first (+360)
  const wrapGap = angles[0] + 360 - angles[angles.length - 1];
  if (wrapGap > largestGap) {
    largestGap = wrapGap;
    bestMid = (angles[angles.length - 1] + wrapGap / 2) % 360;
  }

  return bestMid;
}

/**
 * Clamp a position to keep its card within the canvas (with edge margin).
 * Used by the free-drag handler.
 */
export function clampPositionToCanvas(p: Point): Point {
  const minX = SATELLITE_CARD.halfWidth + CANVAS_EDGE_MARGIN;
  const maxX = CANVAS.width - SATELLITE_CARD.halfWidth - CANVAS_EDGE_MARGIN;
  const minY = SATELLITE_CARD.halfHeight + CANVAS_EDGE_MARGIN;
  const maxY = CANVAS.height - SATELLITE_CARD.halfHeight - CANVAS_EDGE_MARGIN;
  return {
    x: Math.max(minX, Math.min(maxX, p.x)),
    y: Math.max(minY, Math.min(maxY, p.y)),
  };
}
