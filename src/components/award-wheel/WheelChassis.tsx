import {
  HUB_RADIUS,
  RIM_INNER,
  RIM_OUTER,
  SEGMENT_OUTER,
  STUD_RADIUS,
  studPositions,
} from "@/lib/wheel-geometry";

type WheelChassisProps = {
  /** Changes once per reveal so the pointer knock replays. */
  landedKey: number | null;
};

const pointerPath = "M500 108 L444 24 L556 24 Z";

/** Fixed artwork: outer rim, studs, hub and the pointer the segments land under. */
export const WheelChassis = ({ landedKey }: WheelChassisProps) => (
  <svg viewBox="0 0 1000 1000" className="h-full w-full">
    <defs>
      <linearGradient id="rim-band" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0%" className="grad-rim-start" />
        <stop offset="100%" className="grad-rim-end" />
      </linearGradient>
      <filter id="pointer-shadow" x="-60%" y="-40%" width="220%" height="220%">
        <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.65" />
      </filter>
    </defs>

    {/* soft halo hugging the rim */}
    <circle cx={500} cy={500} r={RIM_OUTER} className="rim-halo" fill="none" strokeWidth={26} />
    <circle
      cx={500}
      cy={500}
      r={(RIM_OUTER + RIM_INNER) / 2}
      className="rim-surface"
      fill="none"
      strokeWidth={RIM_OUTER - RIM_INNER}
    />
    <circle cx={500} cy={500} r={RIM_OUTER - 1.5} className="rim-edge-light" fill="none" strokeWidth={2.5} />
    <circle cx={500} cy={500} r={RIM_INNER + 1} className="rim-edge-dark" fill="none" strokeWidth={3} />
    <circle cx={500} cy={500} r={SEGMENT_OUTER + 4} className="seg-shadow" fill="none" strokeWidth={7} />

    {studPositions(16).map((angle) => {
      const radians = ((angle - 90) * Math.PI) / 180;
      const cx = 500 + STUD_RADIUS * Math.cos(radians);
      const cy = 500 + STUD_RADIUS * Math.sin(radians);
      return (
        <g key={angle}>
          <circle cx={cx} cy={cy} r={6.4} className="stud-fill" />
          <circle cx={cx} cy={cy} r={6.4} className="stud-ring" fill="none" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={2.4} className="stud-core" />
        </g>
      );
    })}

    {/* hub */}
    <circle cx={500} cy={500} r={HUB_RADIUS} className="hub-fill" />
    <circle cx={500} cy={500} r={HUB_RADIUS - 7} className="hub-ring" fill="none" strokeWidth={2} />
    <circle cx={500} cy={500} r={HUB_RADIUS} className="hub-edge" fill="none" strokeWidth={2} />
    <circle cx={500} cy={500} r={30} className="hub-core" strokeWidth={2} />
    <circle cx={500} cy={500} r={9} className="hub-dot" />

    {/* pointer */}
    <g
      key={landedKey ?? "static"}
      className={landedKey ? "pointer-flick" : undefined}
      style={{ transformBox: "view-box", transformOrigin: "500px 30px" }}
      filter="url(#pointer-shadow)"
    >
      <path d={pointerPath} className="pointer-fill pointer-edge" strokeWidth={2.5} />
      <path d="M500 96 L472 44 L528 44 Z" className="pointer-shade" />
    </g>
  </svg>
);
