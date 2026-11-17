/** Geometry for the 1000 × 1000 wheel artwork. */

export const WHEEL_SIZE = 1000;
export const WHEEL_CENTER = 500;

export const RIM_OUTER = 448;
export const RIM_INNER = 406;
export const STUD_RADIUS = (RIM_OUTER + RIM_INNER) / 2;
export const SEGMENT_OUTER = 404;
export const SEGMENT_INNER = 92;
export const HUB_RADIUS = 94;
export const LABEL_START = 124;
export const LABEL_LIMIT = 378;

export const SPIN_TURNS = 7;
export const SPIN_DURATION_MS = 6400;
export const SPIN_EASING = "cubic-bezier(0.12, 0.66, 0.02, 0.99)";

/** Segment colours come from --seg-1…--seg-10 via the .seg-fill-* classes. */
export const SEGMENT_COUNT = 10;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Point on a circle where 0° is 12 o'clock and angles grow clockwise. */
export const polarPoint = (radius: number, angle: number): [number, number] => {
  const radians = toRadians(angle - 90);
  return [
    WHEEL_CENTER + radius * Math.cos(radians),
    WHEEL_CENTER + radius * Math.sin(radians),
  ];
};

export const segmentSpan = (count: number): number => 360 / count;

/** Centre angle of a segment, clockwise from 12 o'clock. */
export const segmentCenterAngle = (index: number, count: number): number =>
  (index + 0.5) * segmentSpan(count);

/** Annular sector path for one segment. */
export const segmentPath = (index: number, count: number): string => {
  const start = index * segmentSpan(count);
  const end = start + segmentSpan(count);
  const [outerStartX, outerStartY] = polarPoint(SEGMENT_OUTER, start);
  const [outerEndX, outerEndY] = polarPoint(SEGMENT_OUTER, end);
  const [innerEndX, innerEndY] = polarPoint(SEGMENT_INNER, end);
  const [innerStartX, innerStartY] = polarPoint(SEGMENT_INNER, start);
  const largeArc = end - start > 180 ? 1 : 0;

  return [
    `M ${outerStartX.toFixed(2)} ${outerStartY.toFixed(2)}`,
    `A ${SEGMENT_OUTER} ${SEGMENT_OUTER} 0 ${largeArc} 1 ${outerEndX.toFixed(2)} ${outerEndY.toFixed(2)}`,
    `L ${innerEndX.toFixed(2)} ${innerEndY.toFixed(2)}`,
    `A ${SEGMENT_INNER} ${SEGMENT_INNER} 0 ${largeArc} 0 ${innerStartX.toFixed(2)} ${innerStartY.toFixed(2)}`,
    "Z",
  ].join(" ");
};

/** Wheel rotation (clockwise degrees) that brings a segment under the pointer. */
export const landingRotation = (index: number, count: number): number => {
  if (index < 0 || count <= 0) return 0;
  const offset = (index + 0.5) * segmentSpan(count);
  return (360 - (offset % 360)) % 360;
};

/** Resets the wheel with a full extra rotation while spinning. */
export const spinTargetRotation = (index: number, count: number): number =>
  SPIN_TURNS * 360 + landingRotation(index, count);

/** Label size shrinks with the segment count so 50 names stay readable. */
export const labelFontSize = (count: number, shortLength: number): number => {
  const midRadius = (LABEL_START + LABEL_LIMIT) / 2;
  const arc = (2 * Math.PI * midRadius) / count;
  const base = Math.min(34, Math.max(11, arc * 0.84));
  const lengthFactor = Math.min(1, 9 / Math.max(6, shortLength));
  return Number((base * lengthFactor).toFixed(2));
};

export const studPositions = (count: number): number[] =>
  Array.from({ length: count }, (_, index) => (index * 360) / count);

/**
 * WebKit's cubic-bezier solver (Newton-Raphson, bisection fallback), used so
 * JS-timed effects (the spin's tick sound) can match a CSS `transition`
 * curve exactly without reading computed style.
 */
const cubicBezier = (p1x: number, p1y: number, p2x: number, p2y: number) => {
  const sampleX = (t: number) =>
    ((1 - 3 * p2x + 3 * p1x) * t + (3 * p2x - 6 * p1x)) * t * t + 3 * p1x * t;
  const sampleY = (t: number) =>
    ((1 - 3 * p2y + 3 * p1y) * t + (3 * p2y - 6 * p1y)) * t * t + 3 * p1y * t;
  const sampleDerivativeX = (t: number) =>
    (3 * (1 - 3 * p2x + 3 * p1x) * t + 2 * (3 * p2x - 6 * p1x)) * t + 3 * p1x;

  const solveX = (x: number, epsilon = 1e-6): number => {
    let t = x;
    for (let i = 0; i < 8; i += 1) {
      const dx = sampleX(t) - x;
      if (Math.abs(dx) < epsilon) return t;
      const derivative = sampleDerivativeX(t);
      if (Math.abs(derivative) < 1e-6) break;
      t -= dx / derivative;
    }
    let low = 0;
    let high = 1;
    t = x;
    if (t < low) return low;
    if (t > high) return high;
    while (low < high) {
      const current = sampleX(t);
      if (Math.abs(current - x) < epsilon) return t;
      if (x > current) low = t;
      else high = t;
      t = (high - low) / 2 + low;
    }
    return t;
  };

  return (x: number): number => sampleY(solveX(x));
};

/** JS mirror of SPIN_EASING's control points — keep the two in sync. */
export const spinEasing = cubicBezier(0.12, 0.66, 0.02, 0.99);
