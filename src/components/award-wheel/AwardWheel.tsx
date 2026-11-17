import { useEffect, useState } from "react";
import {
  SPIN_DURATION_MS,
  SPIN_EASING,
  landingRotation,
  spinTargetRotation,
} from "@/lib/wheel-geometry";
import type { Company, DrawPhase } from "@/lib/wheel-types";
import { WheelChassis } from "./WheelChassis";
import { WheelRotor } from "./WheelRotor";

type AwardWheelProps = {
  companies: Company[];
  phase: DrawPhase;
  winnerIndex: number;
  /** Changes once per reveal so the pointer knock replays. */
  landedKey: number | null;
  onLanded: () => void;
};

/**
 * The physical wheel: a rotating rotor over fixed rim, hub and pointer.
 * Rotation is CSS-driven so the landing angle is exact and cheap to animate.
 */
export const AwardWheel = ({
  companies,
  phase,
  winnerIndex,
  landedKey,
  onLanded,
}: AwardWheelProps) => {
  const [rotation, setRotation] = useState(() =>
    phase === "result" ? landingRotation(winnerIndex, companies.length) : 0,
  );

  useEffect(() => {
    if (phase === "result" && winnerIndex >= 0) {
      setRotation(landingRotation(winnerIndex, companies.length));
      return;
    }
    if (phase === "spinning" && winnerIndex >= 0) {
      setRotation(spinTargetRotation(winnerIndex, companies.length));
      return;
    }
    setRotation(0);
  }, [phase, winnerIndex, companies.length]);

  useEffect(() => {
    if (phase !== "spinning") return;
    const timer = window.setTimeout(onLanded, SPIN_DURATION_MS + 120);
    return () => window.clearTimeout(timer);
  }, [phase, onLanded]);

  const spinning = phase === "spinning";

  return (
    <div className="relative aspect-square w-full max-w-[min(74vh,42vw)] max-lg:max-w-[min(62vh,86vw)]">
      <div
        aria-hidden="true"
        className={`absolute -inset-[9%] rounded-full opacity-80 blur-2xl wheel-ambient ${
          phase === "result" ? "wheel-ambient--lit" : ""
        }`}
        style={{
          background:
            "radial-gradient(circle at 50% 46%, hsl(var(--brand-mint) / 0.26) 0%, hsl(var(--brand-cyan) / 0.12) 46%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[14%] bottom-[-4%] h-[8%] rounded-[50%] bg-brand-ink/70 blur-2xl"
      />

      <div
        className="absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning
            ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}`
            : "none",
          willChange: "transform",
        }}
      >
        <WheelRotor companies={companies} phase={phase} winnerIndex={winnerIndex} />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <WheelChassis landedKey={landedKey} />
      </div>

      {!spinning ? <div aria-hidden="true" className="wheel-shine" /> : null}
    </div>
  );
};
