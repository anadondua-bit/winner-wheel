import { SEGMENT_SLOT_COUNT, defaultBranding } from "./wheel-roster";
import type { AccentName, Branding, FontChoice } from "./wheel-types";

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

export const toFontChoice = (value: unknown): FontChoice =>
  value === "system-sans" || value === "system-serif" || value === "system-mono" || value === "custom"
    ? value
    : "manrope";

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
    brandMint: toHexOrNull(value.brandMint),
    brandTeal: toHexOrNull(value.brandTeal),
    brandCyan: toHexOrNull(value.brandCyan),
    brandBlue: toHexOrNull(value.brandBlue),
    segmentColors: Array.from({ length: SEGMENT_SLOT_COUNT }, (_, index) =>
      toHexOrNull(segmentColorsRaw[index]),
    ),
  };
};
