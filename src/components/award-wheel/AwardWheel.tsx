import { useEffect, useMemo, useState } from "react";
import {
  SPIN_DURATION_MS,
  SPIN_EASING,
  landingRotation,
  spinTargetRotation,
} from "@/lib/wheel-geometry";
import { useWheelSpinSound } from "@/hooks/use-wheel-spin-sound";
import type { Company, DrawPhase } from "@/lib/wheel-types";
import { WheelChassis } from "./WheelChassis";
import { WheelRotor } from "./WheelRotor";

type AwardWheelProps = {
  companies: Company[];
  phase: DrawPhase;
  winnerIndex: number;
  /** Changes once per reveal so the pointer knock replays. */
  landedKey: number | null;
  /** How many of the 10 segment-color slots to cycle through. */
  segmentColorCount?: number;
  /** For a second wheel on screen mirroring the real one — silences it so it doesn't also make noise. */
  muted?: boolean;
  /** When `phase` last changed, as an ISO timestamp — the authoritative
   * clock a mirrored client (the stage display) times its own spin off,
   * instead of always playing a full fresh animation from whenever it
   * happened to hear about the change. Optional for callers that drive the
   * wheel locally with no mirroring delay to account for. */
  phaseChangedAt?: string | null;
};

/**
 * The physical wheel: a rotating rotor over fixed rim, hub and pointer.
 * Rotation is CSS-driven so the landing angle is exact and cheap to animate.
 * Phase timing is owned upstream (the draw hook); this component only
 * reacts to phase/winnerIndex, so it works the same whether it's driven
 * locally or mirrored live from another machine — except that a mirrored
 * client can hear about a phase change late (a slow connection, a dropped
 * or catch-up broadcast), so it derives how much of the spin has already
 * really elapsed from `phaseChangedAt` and animates only what's left,
 * rather than restarting a full-length spin late and jumping or landing at
 * the wrong moment.
 */
export const AwardWheel = ({
  companies,
  phase,
  winnerIndex,
  landedKey,
  segmentColorCount,
  muted,
  phaseChangedAt,
}: AwardWheelProps) => {
  const [rotation, setRotation] = useState(() =>
    phase === "result" ? landingRotation(winnerIndex, companies.length) : 0,
  );
  const [spinMs, setSpinMs] = useState(SPIN_DURATION_MS);

  // Captured once per spin event (not re-evaluated on every render) so a
  // late-arriving "spinning" message still lands at the right wall-clock
  // moment instead of restarting the full animation from scratch.
  const elapsedMs = useMemo(() => {
    if (phase !== "spinning" || !phaseChangedAt) return 0;
    const startedAt = Date.parse(phaseChangedAt);
    if (Number.isNaN(startedAt)) return 0;
    return Math.max(0, Date.now() - startedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, winnerIndex, phaseChangedAt]);

  useWheelSpinSound({ phase, winnerIndex, companyCount: companies.length, muted, elapsedMs });

  useEffect(() => {
    if (phase === "result" && winnerIndex >= 0) {
      setSpinMs(SPIN_DURATION_MS);
      setRotation(landingRotation(winnerIndex, companies.length));
      return;
    }
    if (phase === "spinning" && winnerIndex >= 0) {
      const remaining = SPIN_DURATION_MS - elapsedMs;
      if (remaining <= 0) {
        // Found out about this spin only after it should already have
        // finished (a slow or catching-up connection) — settle straight
        // into the landed position instead of playing a stale full spin.
        setSpinMs(0);
        setRotation(landingRotation(winnerIndex, companies.length));
        return;
      }
      setSpinMs(remaining);
      setRotation(spinTargetRotation(winnerIndex, companies.length));
      return;
    }
    setSpinMs(SPIN_DURATION_MS);
    setRotation(0);
  }, [phase, winnerIndex, companies.length, elapsedMs]);

  const spinning = phase === "spinning" && spinMs > 0;

  return (
    <div
      className="relative aspect-square w-full max-w-[min(74vh,42vw)] max-lg:max-w-[min(62vh,86vw)]"
      style={{ transform: "scale(var(--scale-wheel, 1))" }}
    >
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
          transition: spinning ? `transform ${spinMs}ms ${SPIN_EASING}` : "none",
          willChange: "transform",
        }}
      >
        <WheelRotor
          companies={companies}
          phase={phase}
          winnerIndex={winnerIndex}
          segmentColorCount={segmentColorCount}
        />
      </div>

      <div className="pointer-events-none absolute inset-0">
        <WheelChassis landedKey={landedKey} />
      </div>

      {!spinning ? <div aria-hidden="true" className="wheel-shine" /> : null}
    </div>
  );
};
