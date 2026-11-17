import { useEffect, useRef } from "react";
import { hexToHslTriplet } from "@/lib/wheel-color";
import type { Branding, FontChoice } from "@/lib/wheel-types";

const FONT_STACKS: Record<Exclude<FontChoice, "custom">, string> = {
  manrope: "'Manrope', ui-sans-serif, system-ui, sans-serif",
  "system-sans": "-apple-system, 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
  "system-serif": "Georgia, 'Times New Roman', ui-serif, serif",
  "system-mono": "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
};

const CUSTOM_FONT_FAMILY = "BrandCustomFont";

type HexField = {
  [K in keyof Branding]: Branding[K] extends string | null ? K : never;
}[keyof Branding];

/** Every hex-or-null branding field and the CSS custom property it overrides. */
const BRAND_VARS: Array<[key: HexField, cssVar: string]> = [
  ["brandMint", "--brand-mint"],
  ["brandTeal", "--brand-teal"],
  ["brandCyan", "--brand-cyan"],
  ["brandBlue", "--brand-blue"],
  ["winnerFill", "--winner-fill"],
  ["winnerLabel", "--winner-label"],
  ["rimStart", "--rim-start"],
  ["rimEnd", "--rim-end"],
  ["hub", "--hub"],
  ["pointer", "--pointer"],
  ["headerTitle", "--text-header-title"],
  ["stageText", "--brand-light"],
  ["accentButtons", "--primary"],
  ["tintWinnerPanel", "--tint-winner-panel"],
  ["tintWinnersRail", "--tint-winners-rail"],
  ["tintControlBar", "--tint-control-bar"],
];

/**
 * Applies a Branding object to the live page: CSS custom-property overrides
 * for the brand hues and wheel segments (so every existing `hsl(var(--x))`
 * token in the stylesheet picks it up for free), the chosen display font,
 * and a custom font registration if one was uploaded. Safe to call from
 * both /stage and /control — it only ever touches :root, never component
 * state, so two instances of this hook (one per page) don't conflict.
 */
export const useApplyBranding = (branding: Branding): void => {
  const registeredFontUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement.style;

    BRAND_VARS.forEach(([key, cssVar]) => {
      const hex = branding[key];
      const triplet = hex ? hexToHslTriplet(hex) : null;
      if (triplet) root.setProperty(cssVar, triplet);
      else root.removeProperty(cssVar);
    });

    branding.segmentColors.forEach((hex, index) => {
      const cssVar = `--seg-${index + 1}`;
      const triplet = hex ? hexToHslTriplet(hex) : null;
      if (triplet) root.setProperty(cssVar, triplet);
      else root.removeProperty(cssVar);
    });

    return () => {
      BRAND_VARS.forEach(([, cssVar]) => root.removeProperty(cssVar));
      branding.segmentColors.forEach((_, index) => root.removeProperty(`--seg-${index + 1}`));
    };
  }, [branding]);

  useEffect(() => {
    const root = document.documentElement.style;

    if (branding.font === "custom" && branding.customFontDataUrl) {
      root.setProperty("--font-display", `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`);
      root.setProperty("--font-sans", `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`);

      if (registeredFontUrlRef.current !== branding.customFontDataUrl) {
        registeredFontUrlRef.current = branding.customFontDataUrl;
        const face = new FontFace(CUSTOM_FONT_FAMILY, `url(${branding.customFontDataUrl})`);
        void face
          .load()
          .then((loaded) => {
            document.fonts.add(loaded);
          })
          .catch(() => {
            registeredFontUrlRef.current = null;
          });
      }
    } else {
      const stack = FONT_STACKS[branding.font] ?? FONT_STACKS.manrope;
      root.setProperty("--font-display", stack);
      root.setProperty("--font-sans", stack);
    }

    return () => {
      root.removeProperty("--font-display");
      root.removeProperty("--font-sans");
    };
  }, [branding.font, branding.customFontDataUrl]);
};
