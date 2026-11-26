import { useEffect, useRef } from "react";
import { hexToHslTriplet, splitRgbaHex } from "@/lib/wheel-color";
import { CUSTOM_FONT_FAMILY, FONT_STACKS, fontChoiceToFamily } from "@/lib/wheel-fonts";
import type { Branding, FontChoice } from "@/lib/wheel-types";

/** Resolves one font choice to a font-family stack; null means "inherit the base font" (caller removes the var). */
const resolveFontStack = (choice: FontChoice | null, hasCustomFont: boolean): string | null => {
  if (!choice) return null;
  if (choice === "custom") return hasCustomFont ? fontChoiceToFamily("custom") : null;
  return FONT_STACKS[choice];
};

type ComponentFontKey =
  | "headerTitleFont"
  | "statusFont"
  | "winnerPanelFont"
  | "winnerStatusFont"
  | "winnerEyebrowFont"
  | "winnerNameFont"
  | "drawCounterFont"
  | "revealedCounterFont"
  | "wheelLabelFont"
  | "footerCaptionFont"
  | "bodyHeadlineFont"
  | "bodySubtextFont";

/** Per-component font overrides and the CSS custom property each one drives. */
const COMPONENT_FONT_VARS: Array<[key: ComponentFontKey, cssVar: string]> = [
  ["headerTitleFont", "--font-header-title"],
  ["statusFont", "--font-status"],
  ["winnerPanelFont", "--font-winner-panel"],
  ["winnerStatusFont", "--font-winner-status"],
  ["winnerEyebrowFont", "--font-winner-eyebrow"],
  ["winnerNameFont", "--font-winner-name"],
  ["drawCounterFont", "--font-draw-counter"],
  ["revealedCounterFont", "--font-revealed-counter"],
  ["wheelLabelFont", "--font-wheel-label"],
  ["footerCaptionFont", "--font-footer-caption"],
  ["bodyHeadlineFont", "--font-body-headline"],
  ["bodySubtextFont", "--font-body-subtext"],
];

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
  ["rimHalo", "--rim-halo"],
  ["rimEdgeLight", "--rim-edge-light"],
  ["rimEdgeDark", "--rim-edge-dark"],
  ["frameShadow", "--frame-shadow"],
  ["stud", "--stud"],
  ["studRing", "--stud-ring"],
  ["studCore", "--stud-core"],
  ["hubRing", "--hub-ring"],
  ["hubEdge", "--hub-edge"],
  ["hubCore", "--hub-core"],
  ["hubDot", "--hub-dot"],
  ["hairline", "--wheel-hairline"],
  ["labelBright", "--label-bright"],
  ["labelHalo", "--label-halo"],
  ["headerTitle", "--text-header-title"],
  ["statusText", "--status-text"],
  ["statusDotColor", "--status-dot"],
  ["winnerPanelText", "--winner-panel-text"],
  ["stageText", "--stage-text"],
  ["accentButtons", "--primary"],
  ["winnerStatusColor", "--winner-status-color"],
  ["winnerEyebrowColor", "--winner-eyebrow-color"],
  ["winnerNameColor", "--winner-name-color"],
  ["drawCounterColor", "--draw-counter-color"],
  ["revealedCounterColor", "--revealed-counter-color"],
  ["footerCaptionColor", "--footer-caption-color"],
  ["bodyHeadlineColor", "--body-headline-color"],
  ["bodySubtextColor", "--body-subtext-color"],
];

type PanelTintKey = "tintWinnerPanel";

/**
 * Panel tints carry their own alpha (an #RRGGBBAA value from the RGBA
 * picker) instead of the stylesheet's two fixed stop opacities. That alpha
 * becomes a 0–1 intensity multiplier on the gradient's original 0.14/0.04
 * stops — set to 1 (fully opaque hex, i.e. no alpha suffix) it reproduces
 * the old hardcoded look exactly.
 */
const PANEL_TINT_VARS: Array<[key: PanelTintKey, colorVar: string, alphaVar1: string, alphaVar2: string]> = [
  ["tintWinnerPanel", "--tint-winner-panel", "--tint-winner-panel-a1", "--tint-winner-panel-a2"],
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

    PANEL_TINT_VARS.forEach(([key, colorVar, alphaVar1, alphaVar2]) => {
      const stored = branding[key];
      const parsed = stored ? splitRgbaHex(stored) : null;
      const triplet = parsed ? hexToHslTriplet(parsed.hex) : null;
      if (triplet && parsed) {
        root.setProperty(colorVar, triplet);
        root.setProperty(alphaVar1, String(parsed.alpha * 0.14));
        root.setProperty(alphaVar2, String(parsed.alpha * 0.04));
      } else {
        root.removeProperty(colorVar);
        root.removeProperty(alphaVar1);
        root.removeProperty(alphaVar2);
      }
    });

    if (branding.winnerPanelBorderOpacity !== null) {
      root.setProperty("--winner-panel-border-opacity", String(branding.winnerPanelBorderOpacity));
    } else {
      root.removeProperty("--winner-panel-border-opacity");
    }

    // Unlike the tint pair above, this alpha is the gradient stop's literal CSS
    // opacity, not a multiplier — it replaces the old fixed brand-ink/0.4 fade.
    const endParsed = branding.tintWinnerPanelEnd ? splitRgbaHex(branding.tintWinnerPanelEnd) : null;
    const endTriplet = endParsed ? hexToHslTriplet(endParsed.hex) : null;
    if (endTriplet && endParsed) {
      root.setProperty("--tint-winner-panel-end", endTriplet);
      root.setProperty("--tint-winner-panel-end-a", String(endParsed.alpha));
    } else {
      root.removeProperty("--tint-winner-panel-end");
      root.removeProperty("--tint-winner-panel-end-a");
    }

    // The Live indicator pill's fill/outline: same literal-alpha pattern as the
    // gradient-end color above, except the alpha is also forced to 0 when its
    // "enabled" toggle is off — color and visibility are independent knobs.
    const fillParsed = branding.statusFillColor ? splitRgbaHex(branding.statusFillColor) : null;
    const fillTriplet = fillParsed ? hexToHslTriplet(fillParsed.hex) : null;
    if (fillTriplet) root.setProperty("--status-fill", fillTriplet);
    else root.removeProperty("--status-fill");
    root.setProperty(
      "--status-fill-a",
      String(branding.statusFillEnabled ? (fillParsed?.alpha ?? 0.25) : 0),
    );

    const outlineParsed = branding.statusOutlineColor ? splitRgbaHex(branding.statusOutlineColor) : null;
    const outlineTriplet = outlineParsed ? hexToHslTriplet(outlineParsed.hex) : null;
    if (outlineTriplet) root.setProperty("--status-outline", outlineTriplet);
    else root.removeProperty("--status-outline");
    root.setProperty(
      "--status-outline-a",
      String(branding.statusOutlineEnabled ? (outlineParsed?.alpha ?? 0.15) : 0),
    );

    return () => {
      BRAND_VARS.forEach(([, cssVar]) => root.removeProperty(cssVar));
      branding.segmentColors.forEach((_, index) => root.removeProperty(`--seg-${index + 1}`));
      root.removeProperty("--tint-winner-panel-end");
      root.removeProperty("--tint-winner-panel-end-a");
      root.removeProperty("--status-fill");
      root.removeProperty("--status-fill-a");
      root.removeProperty("--status-outline");
      root.removeProperty("--status-outline-a");
      PANEL_TINT_VARS.forEach(([, colorVar, alphaVar1, alphaVar2]) => {
        root.removeProperty(colorVar);
        root.removeProperty(alphaVar1);
        root.removeProperty(alphaVar2);
      });
      root.removeProperty("--winner-panel-border-opacity");
    };
  }, [branding]);

  useEffect(() => {
    const root = document.documentElement.style;
    const hasCustomFont = Boolean(branding.customFontDataUrl);
    const usesCustomFont =
      hasCustomFont &&
      (branding.font === "custom" || COMPONENT_FONT_VARS.some(([key]) => branding[key] === "custom"));

    if (branding.font === "custom" && hasCustomFont) {
      root.setProperty("--font-display", `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`);
      root.setProperty("--font-sans", `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`);
    } else {
      const stack = FONT_STACKS[branding.font] ?? FONT_STACKS.manrope;
      root.setProperty("--font-display", stack);
      root.setProperty("--font-sans", stack);
    }

    if (usesCustomFont && registeredFontUrlRef.current !== branding.customFontDataUrl) {
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

    COMPONENT_FONT_VARS.forEach(([key, cssVar]) => {
      const stack = resolveFontStack(branding[key], hasCustomFont);
      if (stack) root.setProperty(cssVar, stack);
      else root.removeProperty(cssVar);
    });

    return () => {
      root.removeProperty("--font-display");
      root.removeProperty("--font-sans");
      COMPONENT_FONT_VARS.forEach(([, cssVar]) => root.removeProperty(cssVar));
    };
  }, [branding.font, branding.customFontDataUrl, ...COMPONENT_FONT_VARS.map(([key]) => branding[key])]);
};

/**
 * Same mappings as the hook above, but as a plain object instead of a
 * :root mutation — for scoping a preview of unsaved branding edits to one
 * subtree (e.g. the roster dialog's live stage preview) via an inline
 * `style`, without touching the document-wide vars the real stage reads.
 * CSS custom properties cascade, so a key just left out here means that
 * subtree inherits the real, applied value from :root — exactly the
 * "unset" behavior the hook gets by removeProperty-ing it.
 */
export const brandingCssVars = (branding: Branding): Record<string, string> => {
  const vars: Record<string, string> = {};

  BRAND_VARS.forEach(([key, cssVar]) => {
    const hex = branding[key];
    const triplet = hex ? hexToHslTriplet(hex) : null;
    if (triplet) vars[cssVar] = triplet;
  });

  branding.segmentColors.forEach((hex, index) => {
    const triplet = hex ? hexToHslTriplet(hex) : null;
    if (triplet) vars[`--seg-${index + 1}`] = triplet;
  });

  PANEL_TINT_VARS.forEach(([key, colorVar, alphaVar1, alphaVar2]) => {
    const stored = branding[key];
    const parsed = stored ? splitRgbaHex(stored) : null;
    const triplet = parsed ? hexToHslTriplet(parsed.hex) : null;
    if (triplet && parsed) {
      vars[colorVar] = triplet;
      vars[alphaVar1] = String(parsed.alpha * 0.14);
      vars[alphaVar2] = String(parsed.alpha * 0.04);
    }
  });

  if (branding.winnerPanelBorderOpacity !== null) {
    vars["--winner-panel-border-opacity"] = String(branding.winnerPanelBorderOpacity);
  }

  const endParsed = branding.tintWinnerPanelEnd ? splitRgbaHex(branding.tintWinnerPanelEnd) : null;
  const endTriplet = endParsed ? hexToHslTriplet(endParsed.hex) : null;
  if (endTriplet && endParsed) {
    vars["--tint-winner-panel-end"] = endTriplet;
    vars["--tint-winner-panel-end-a"] = String(endParsed.alpha);
  }

  const fillParsed = branding.statusFillColor ? splitRgbaHex(branding.statusFillColor) : null;
  const fillTriplet = fillParsed ? hexToHslTriplet(fillParsed.hex) : null;
  if (fillTriplet) vars["--status-fill"] = fillTriplet;
  vars["--status-fill-a"] = String(branding.statusFillEnabled ? (fillParsed?.alpha ?? 0.25) : 0);

  const outlineParsed = branding.statusOutlineColor ? splitRgbaHex(branding.statusOutlineColor) : null;
  const outlineTriplet = outlineParsed ? hexToHslTriplet(outlineParsed.hex) : null;
  if (outlineTriplet) vars["--status-outline"] = outlineTriplet;
  vars["--status-outline-a"] = String(branding.statusOutlineEnabled ? (outlineParsed?.alpha ?? 0.15) : 0);

  const hasCustomFont = Boolean(branding.customFontDataUrl);
  if (branding.font === "custom" && hasCustomFont) {
    vars["--font-display"] = `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`;
    vars["--font-sans"] = `'${CUSTOM_FONT_FAMILY}', ui-sans-serif, sans-serif`;
  } else {
    const stack = FONT_STACKS[branding.font] ?? FONT_STACKS.manrope;
    vars["--font-display"] = stack;
    vars["--font-sans"] = stack;
  }

  COMPONENT_FONT_VARS.forEach(([key, cssVar]) => {
    const stack = resolveFontStack(branding[key], hasCustomFont);
    if (stack) vars[cssVar] = stack;
  });

  return vars;
};
