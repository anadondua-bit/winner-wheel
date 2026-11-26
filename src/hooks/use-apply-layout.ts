import { useEffect } from "react";
import type { Layout } from "@/lib/wheel-types";

/** Every component scale and the CSS custom property it drives. */
const LAYOUT_VARS: Array<[key: keyof Layout, cssVar: string]> = [
  ["logoScale", "--scale-logo"],
  ["statusScale", "--scale-status"],
  ["wheelScale", "--scale-wheel"],
  ["winnerPanelScale", "--scale-winner-panel"],
  ["titleScale", "--scale-title"],
];

/**
 * Applies a Layout's scale multipliers as :root CSS custom properties, the
 * same pattern useApplyBranding uses for colors — every stage element that
 * reads one of these vars (via a calc() or transform: scale()) picks up the
 * change for free. Lives inside StageCanvas so both the real /stage page and
 * the command center's mini mirror get it without any extra wiring.
 */
export const useApplyLayout = (layout: Layout): void => {
  useEffect(() => {
    const root = document.documentElement.style;

    LAYOUT_VARS.forEach(([key, cssVar]) => {
      root.setProperty(cssVar, String(layout[key]));
    });

    return () => {
      LAYOUT_VARS.forEach(([, cssVar]) => root.removeProperty(cssVar));
    };
  }, [layout]);
};
