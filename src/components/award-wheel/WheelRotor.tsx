import {
  LABEL_LIMIT,
  WHEEL_CENTER,
  labelFontSize,
  segmentCenterAngle,
  segmentPath,
} from "@/lib/wheel-geometry";
import type { Company, DrawPhase } from "@/lib/wheel-types";

type WheelRotorProps = {
  companies: Company[];
  phase: DrawPhase;
  winnerIndex: number;
};

/**
 * Literal class names on purpose: Tailwind only ships classes it can read in
 * the source, so a `seg-fill-${n}` template would be purged and the segments
 * would fall back to black.
 */
const SEGMENT_FILLS = [
  "seg-fill-1",
  "seg-fill-2",
  "seg-fill-3",
  "seg-fill-4",
  "seg-fill-5",
  "seg-fill-6",
  "seg-fill-7",
  "seg-fill-8",
  "seg-fill-9",
  "seg-fill-10",
] as const;

/** Rotating half of the wheel: coloured segments, separators and short names. */
export const WheelRotor = ({ companies, phase, winnerIndex }: WheelRotorProps) => {
  const count = companies.length;

  return (
    <svg viewBox="0 0 1000 1000" className="h-full w-full">
      <defs>
        <linearGradient id="winner-segment" x1="0.1" y1="0" x2="0.8" y2="1">
          <stop offset="0%" className="grad-mint" />
          <stop offset="100%" className="grad-teal" />
        </linearGradient>
      </defs>

      {companies.map((company, index) => {
        const isWinner = phase === "result" && index === winnerIndex;
        const labelSize = labelFontSize(count, company.short.length) * (isWinner ? 1.06 : 1);

        return (
          <g
            key={company.id}
            style={{
              opacity: phase === "result" && !isWinner ? 0.38 : 1,
              transition: "opacity 520ms ease",
            }}
            className={isWinner ? "winner-segment-glow" : undefined}
          >
            <path
              d={segmentPath(index, count)}
              className={`wheel-hairline ${
                isWinner ? "seg-fill-winner" : SEGMENT_FILLS[index % SEGMENT_FILLS.length]
              }`}
              strokeWidth={1.4}
            />
            <g
              transform={`rotate(${segmentCenterAngle(index, count)} ${WHEEL_CENTER} ${WHEEL_CENTER})`}
            >
              <text
                transform={`translate(${WHEEL_CENTER} ${WHEEL_CENTER - LABEL_LIMIT}) rotate(-90)`}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={labelSize}
                fontWeight={isWinner ? 800 : 700}
                letterSpacing="0.045em"
                className={isWinner ? "label-ink" : "label-bright label-halo"}
                style={{ paintOrder: "stroke", strokeWidth: 1 }}
              >
                {company.short}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
