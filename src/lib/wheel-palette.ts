import { hslTripletToHex } from "./wheel-color";
import type { AccentName } from "./wheel-types";

/** Mirrors the [data-accent] blocks in index.css, so the branding panel can
 * show each color picker's real current default instead of a guess. */
const ACCENT_HSL: Record<AccentName, { mint: string; teal: string; cyan: string; blue: string }> = {
  teal: { mint: "166 68% 58%", teal: "168 60% 36%", cyan: "199 74% 38%", blue: "211 81% 39%" },
  blue: { mint: "196 84% 68%", teal: "211 72% 38%", cyan: "199 86% 54%", blue: "211 81% 39%" },
  mint: { mint: "160 72% 64%", teal: "162 60% 33%", cyan: "176 62% 44%", blue: "211 81% 39%" },
};

export const accentDefaultHex = (accent: AccentName) => ({
  mint: hslTripletToHex(ACCENT_HSL[accent].mint),
  teal: hslTripletToHex(ACCENT_HSL[accent].teal),
  cyan: hslTripletToHex(ACCENT_HSL[accent].cyan),
  blue: hslTripletToHex(ACCENT_HSL[accent].blue),
});

/** Mirrors --seg-1 … --seg-10 in index.css. */
const SEGMENT_HSL = [
  "197 64% 24%",
  "168 56% 32%",
  "213 66% 31%",
  "172 60% 24%",
  "200 74% 33%",
  "207 56% 19%",
  "165 52% 29%",
  "217 46% 27%",
  "185 62% 21%",
  "192 56% 33%",
];

export const defaultSegmentHex = (): string[] => SEGMENT_HSL.map(hslTripletToHex);
