import { SEGMENT_SLOT_COUNT, defaultBranding, defaultLayout } from "./wheel-roster";
import type { AccentName, Branding, FontChoice, Layout } from "./wheel-types";

/**
 * Shared, defensive parsing for anything that can arrive as loosely-typed
 * data: localStorage JSON, a Supabase jsonb column, or an imported settings
 * CSV. One copy of "what counts as a valid X" instead of three.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

export const toAccentName = (value: unknown): AccentName =>
  value === "blue" || value === "mint" ? value : "teal";

export const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#?[0-9a-fA-F]{6}$/.test(value);

export const toHexOrNull = (value: unknown): string | null => (isHexColor(value) ? value : null);

/** Same as isHexColor, but also accepts an 8-digit #RRGGBBAA (panel tints carry their own alpha). */
export const isRgbaHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(value);

export const toRgbaHexOrNull = (value: unknown): string | null =>
  isRgbaHexColor(value) ? value : null;

/** A 0–1 opacity override; anything out of range or non-numeric stays null ("use the built-in default"). */
export const toOpacityOrNull = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return null;
  return Math.round(parsed * 100) / 100;
};

/** A real on/off toggle (not nullable — "unset" just means the fallback). Accepts the CSV's "true"/"false" strings too. */
export const toBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
};

/** A custom label override: trimmed, length-capped, empty string treated as "not set". */
export const toTextOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 60) : null;
};

export const toFontChoice = (value: unknown): FontChoice =>
  value === "system-sans" || value === "system-serif" || value === "system-mono" || value === "custom"
    ? value
    : "manrope";

/** Same set as toFontChoice, but "not set" stays null (inherit the base font) instead of falling back to manrope. */
export const toFontChoiceOrNull = (value: unknown): FontChoice | null =>
  value === "manrope" ||
  value === "system-sans" ||
  value === "system-serif" ||
  value === "system-mono" ||
  value === "custom"
    ? value
    : null;

export const normalizeBranding = (value: unknown): Branding => {
  if (!isRecord(value)) return defaultBranding;
  const segmentColorsRaw = Array.isArray(value.segmentColors) ? value.segmentColors : [];

  return {
    logoDataUrl: typeof value.logoDataUrl === "string" && value.logoDataUrl ? value.logoDataUrl : null,
    backgroundDataUrl:
      typeof value.backgroundDataUrl === "string" && value.backgroundDataUrl ? value.backgroundDataUrl : null,
    font: toFontChoice(value.font),
    customFontDataUrl:
      typeof value.customFontDataUrl === "string" && value.customFontDataUrl ? value.customFontDataUrl : null,
    customFontName:
      typeof value.customFontName === "string" && value.customFontName ? value.customFontName : null,
    headerTitleFont: toFontChoiceOrNull(value.headerTitleFont),
    statusFont: toFontChoiceOrNull(value.statusFont),
    winnerPanelFont: toFontChoiceOrNull(value.winnerPanelFont),
    winnerStatusFont: toFontChoiceOrNull(value.winnerStatusFont),
    winnerEyebrowFont: toFontChoiceOrNull(value.winnerEyebrowFont),
    winnerNameFont: toFontChoiceOrNull(value.winnerNameFont),
    drawCounterFont: toFontChoiceOrNull(value.drawCounterFont),
    revealedCounterFont: toFontChoiceOrNull(value.revealedCounterFont),
    wheelLabelFont: toFontChoiceOrNull(value.wheelLabelFont),
    footerCaptionFont: toFontChoiceOrNull(value.footerCaptionFont),
    bodyHeadlineFont: toFontChoiceOrNull(value.bodyHeadlineFont),
    bodySubtextFont: toFontChoiceOrNull(value.bodySubtextFont),
    winnerStatusColor: toHexOrNull(value.winnerStatusColor),
    winnerEyebrowColor: toHexOrNull(value.winnerEyebrowColor),
    winnerNameColor: toHexOrNull(value.winnerNameColor),
    drawCounterColor: toHexOrNull(value.drawCounterColor),
    revealedCounterColor: toHexOrNull(value.revealedCounterColor),
    footerCaptionColor: toHexOrNull(value.footerCaptionColor),
    bodyHeadlineColor: toHexOrNull(value.bodyHeadlineColor),
    bodySubtextColor: toHexOrNull(value.bodySubtextColor),
    statusLiveLabel: toTextOrNull(value.statusLiveLabel),
    statusConnectingLabel: toTextOrNull(value.statusConnectingLabel),
    statusOfflineLabel: toTextOrNull(value.statusOfflineLabel),
    winnerStatusCompleteLabel: toTextOrNull(value.winnerStatusCompleteLabel),
    winnerStatusWinnerLabel: toTextOrNull(value.winnerStatusWinnerLabel),
    winnerStatusInPlayLabel: toTextOrNull(value.winnerStatusInPlayLabel),
    winnerStatusReadyLabel: toTextOrNull(value.winnerStatusReadyLabel),
    winnerStatusNextDrawLabel: toTextOrNull(value.winnerStatusNextDrawLabel),
    eyebrowWinnerDrawLabel: toTextOrNull(value.eyebrowWinnerDrawLabel),
    eyebrowTurningLabel: toTextOrNull(value.eyebrowTurningLabel),
    eyebrowInProgressLabel: toTextOrNull(value.eyebrowInProgressLabel),
    eyebrowCeremonyClosedLabel: toTextOrNull(value.eyebrowCeremonyClosedLabel),
    eyebrowWheelSetLabel: toTextOrNull(value.eyebrowWheelSetLabel),
    eyebrowDrawOfLabel: toTextOrNull(value.eyebrowDrawOfLabel),
    drawCounterLabel: toTextOrNull(value.drawCounterLabel),
    revealedCounterLabel: toTextOrNull(value.revealedCounterLabel),
    footerCaptionRevealedLabel: toTextOrNull(value.footerCaptionRevealedLabel),
    footerCaptionCompleteLabel: toTextOrNull(value.footerCaptionCompleteLabel),
    footerCaptionLiveLabel: toTextOrNull(value.footerCaptionLiveLabel),
    bodyHeadlineSpinningLabel: toTextOrNull(value.bodyHeadlineSpinningLabel),
    bodyHeadlineCompleteLabel: toTextOrNull(value.bodyHeadlineCompleteLabel),
    bodyHeadlineFirstLabel: toTextOrNull(value.bodyHeadlineFirstLabel),
    bodyHeadlineNextLabel: toTextOrNull(value.bodyHeadlineNextLabel),
    bodySubtextSpinningLabel: toTextOrNull(value.bodySubtextSpinningLabel),
    bodySubtextCompleteLabel: toTextOrNull(value.bodySubtextCompleteLabel),
    bodySubtextFirstLabel: toTextOrNull(value.bodySubtextFirstLabel),
    bodySubtextNextLabel: toTextOrNull(value.bodySubtextNextLabel),
    brandMint: toHexOrNull(value.brandMint),
    brandTeal: toHexOrNull(value.brandTeal),
    brandCyan: toHexOrNull(value.brandCyan),
    brandBlue: toHexOrNull(value.brandBlue),
    segmentColors: Array.from({ length: SEGMENT_SLOT_COUNT }, (_, index) =>
      toHexOrNull(segmentColorsRaw[index]),
    ),
    segmentColorCount: clampInt(value.segmentColorCount, 2, SEGMENT_SLOT_COUNT, SEGMENT_SLOT_COUNT),
    winnerFill: toHexOrNull(value.winnerFill),
    winnerLabel: toHexOrNull(value.winnerLabel),
    rimStart: toHexOrNull(value.rimStart),
    rimEnd: toHexOrNull(value.rimEnd),
    hub: toHexOrNull(value.hub),
    rimHalo: toHexOrNull(value.rimHalo),
    rimEdgeLight: toHexOrNull(value.rimEdgeLight),
    rimEdgeDark: toHexOrNull(value.rimEdgeDark),
    frameShadow: toHexOrNull(value.frameShadow),
    stud: toHexOrNull(value.stud),
    studRing: toHexOrNull(value.studRing),
    studCore: toHexOrNull(value.studCore),
    hubRing: toHexOrNull(value.hubRing),
    hubEdge: toHexOrNull(value.hubEdge),
    hubCore: toHexOrNull(value.hubCore),
    hubDot: toHexOrNull(value.hubDot),
    hairline: toHexOrNull(value.hairline),
    labelBright: toHexOrNull(value.labelBright),
    labelHalo: toHexOrNull(value.labelHalo),
    headerTitle: toHexOrNull(value.headerTitle),
    statusText: toHexOrNull(value.statusText),
    statusFillColor: toRgbaHexOrNull(value.statusFillColor),
    statusFillEnabled: toBool(value.statusFillEnabled, true),
    statusOutlineColor: toRgbaHexOrNull(value.statusOutlineColor),
    statusOutlineEnabled: toBool(value.statusOutlineEnabled, true),
    statusDotColor: toHexOrNull(value.statusDotColor),
    winnerPanelText: toHexOrNull(value.winnerPanelText),
    stageText: toHexOrNull(value.stageText),
    accentButtons: toHexOrNull(value.accentButtons),
    tintWinnerPanel: toRgbaHexOrNull(value.tintWinnerPanel),
    tintWinnerPanelEnd: toRgbaHexOrNull(value.tintWinnerPanelEnd),
    winnerPanelBorderOpacity: toOpacityOrNull(value.winnerPanelBorderOpacity),
  };
};

/** Keeps a component scale within a range that can't overlap or clip its neighbors. */
export const clampScale = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.round(Math.min(1.4, Math.max(0.7, parsed)) * 100) / 100;
};

export const normalizeLayout = (value: unknown): Layout => {
  if (!isRecord(value)) return defaultLayout;
  return {
    logoScale: clampScale(value.logoScale),
    statusScale: clampScale(value.statusScale),
    wheelScale: clampScale(value.wheelScale),
    winnerPanelScale: clampScale(value.winnerPanelScale),
    titleScale: clampScale(value.titleScale),
  };
};
