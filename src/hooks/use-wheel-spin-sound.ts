import { useEffect, useRef } from "react";
import {
  SPIN_DURATION_MS,
  landingRotation,
  segmentSpan,
  spinEasing,
  spinTargetRotation,
} from "@/lib/wheel-geometry";
import { playWheelChime, playWheelTick } from "@/lib/wheel-sound";
import type { DrawPhase } from "@/lib/wheel-types";

type Params = {
  phase: DrawPhase;
  winnerIndex: number;
  companyCount: number;
  /** Skips every sound call — for a second wheel on screen (e.g. the command center's mini preview) that mirrors the real one and must not also make noise. */
  muted?: boolean;
};

/**
 * Drives the wheel's tick sound (the only sound during the spin itself) and
 * the reveal chime from the same rotation math as the CSS spin, kept
 * entirely separate from the visual rotation state so audio can't desync
 * it. A segment boundary crossing fires a tick; the local angle tracker
 * starts at 0 and only ever moves through the same landing/spin-target
 * transitions the wheel itself goes through, so the two stay in lockstep
 * without sharing state.
 */
export const useWheelSpinSound = ({ phase, winnerIndex, companyCount, muted }: Params): void => {
  const angleRef = useRef(0);
  const planRef = useRef<{ start: number; target: number; startedAt: number } | null>(null);
  const boundaryRef = useRef(0);

  useEffect(() => {
    if (phase === "result" && winnerIndex >= 0) {
      angleRef.current = landingRotation(winnerIndex, companyCount);
      planRef.current = null;
      if (!muted) playWheelChime();
      return;
    }
    if (phase === "spinning" && winnerIndex >= 0) {
      const start = angleRef.current;
      const target = spinTargetRotation(winnerIndex, companyCount);
      angleRef.current = target;
      boundaryRef.current = Math.floor(start / segmentSpan(companyCount));
      planRef.current = { start, target, startedAt: performance.now() };
      return;
    }
    angleRef.current = 0;
    planRef.current = null;
  }, [phase, winnerIndex, companyCount, muted]);

  useEffect(() => {
    if (phase !== "spinning" || muted) return undefined;
    const span = segmentSpan(companyCount);
    let frame: number;

    const step = () => {
      const plan = planRef.current;
      if (!plan) return;

      const t = Math.min(1, (performance.now() - plan.startedAt) / SPIN_DURATION_MS);
      const eased = spinEasing(t);
      const angle = plan.start + (plan.target - plan.start) * eased;
      const boundary = Math.floor(angle / span);
      const velocity = (spinEasing(t) - spinEasing(Math.max(0, t - 0.035))) / 0.035;
      const intensity = Math.min(1, velocity / 2.2);

      if (boundary !== boundaryRef.current) {
        const crossed = Math.min(Math.abs(boundary - boundaryRef.current), 6);
        for (let i = 0; i < crossed; i += 1) playWheelTick(intensity);
        boundaryRef.current = boundary;
      }

      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [phase, companyCount, muted]);
};
