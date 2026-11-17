import { useMemo } from "react";
import type { CSSProperties } from "react";

const CONFETTI_COUNT = 18;
const COLOR_VARS = ["--brand-mint", "--brand-cyan", "--brand-blue", "--brand-light"] as const;

type ConfettiStyle = CSSProperties & {
  "--angle": string;
  "--dist": string;
  "--spin": string;
  "--delay": string;
};

const buildConfetti = (): ConfettiStyle[] =>
  Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const angle = (index / CONFETTI_COUNT) * 360 + (Math.random() * 18 - 9);
    const dist = 90 + Math.random() * 80;
    const spin = (180 + Math.random() * 360) * (index % 2 === 0 ? 1 : -1);
    const delay = Math.random() * 160;
    const colorVar = COLOR_VARS[index % COLOR_VARS.length];

    return {
      "--angle": `${angle}deg`,
      "--dist": `${dist}px`,
      "--spin": `${spin}deg`,
      "--delay": `${delay}ms`,
      background: `hsl(var(${colorVar}))`,
    };
  });

/**
 * One-shot reveal moment: a camera-flash, three expanding glow rings and a
 * confetti burst. Mount this keyed by draw number so it replays per winner.
 */
export const RevealFlourish = () => {
  const confetti = useMemo(buildConfetti, []);

  return (
    <div className="reveal-flourish" aria-hidden="true">
      <div className="reveal-flash-layer" />
      <span className="reveal-ring" />
      <span className="reveal-ring" />
      <span className="reveal-ring" />
      {confetti.map((style, index) => (
        <span key={index} className="confetti-piece" style={style} />
      ))}
    </div>
  );
};
