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

/**
 * Exact hex defaults for every other wheel-part/canvas color — these are
 * authoritative (not derived from an accent), and index.css's :root carries
 * the same values pre-converted to HSL so the look is identical before the
 * operator ever opens the panel.
 */
export const WHEEL_PART_DEFAULT_HEX = {
  winnerFill: "#4BDDBB",
  winnerLabel: "#08120F",
  rimStart: "#25937D",
  rimEnd: "#0A1214",
  hub: "#CFDCDD",
  pointer: "#E6F7F0",
  headerTitle: "#EEF2F2",
  stageText: "#EEF2F2",
  accentButtons: "#31B496",
  tintWinnerPanel: "#EAF4F2",
  tintWinnersRail: "#E4F0F1",
  tintControlBar: "#E6F2F1",
} as const;
