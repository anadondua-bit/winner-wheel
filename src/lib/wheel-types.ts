/** Domain types for the conference draw wheel. */

export type Company = {
  /** Stable id so saved winners keep pointing at the right company. */
  id: string;
  /** Full name shown on the winner reveal. */
  name: string;
  /** Approved short label drawn on the wheel segment. */
  short: string;
  /** This company's own font for its wheel-segment label; null inherits the wheel's label font. */
  font: FontChoice | null;
};

export type Winner = {
  companyId: string;
  name: string;
  short: string;
  /** 1-based draw number in reveal order. */
  draw: number;
  wonAt: string;
};

export type DrawPhase = "idle" | "spinning" | "result" | "complete";

export type AccentName = "teal" | "blue" | "mint";

export type FontChoice = "manrope" | "system-sans" | "system-serif" | "system-mono" | "custom";

/**
 * Everything the operator can brand. Images and fonts are stored as data
 * URLs — there's no object storage wired up, so the show record (and the
 * live broadcast to the stage) carries them inline. Null means "use the
 * built-in default for this slot."
 */
export type Branding = {
  logoDataUrl: string | null;
  backgroundDataUrl: string | null;
  /** The default font for every component below; null on a component means "use this". */
  font: FontChoice;
  customFontDataUrl: string | null;
  customFontName: string | null;
  /**
   * Per-component font overrides — "custom" reuses the one custom upload
   * above. Null inherits the nearer default: winnerStatusFont, winnerEyebrowFont,
   * winnerNameFont, drawCounterFont and revealedCounterFont all fall back to
   * winnerPanelFont first, then to the base `font`; every other field falls
   * back straight to `font`.
   */
  headerTitleFont: FontChoice | null;
  statusFont: FontChoice | null;
  /** Fallback for every winner-panel field below that hasn't been given its own font. */
  winnerPanelFont: FontChoice | null;
  /** The status pill label: "Winner", "In play", "Ready", "Next draw", "Draw complete". */
  winnerStatusFont: FontChoice | null;
  /** The eyebrow line above the headline: "Winner · draw N", "Draw in progress", etc. */
  winnerEyebrowFont: FontChoice | null;
  /** The revealed winner's name. */
  winnerNameFont: FontChoice | null;
  /** The header's "DRAW N / 15" counter. */
  drawCounterFont: FontChoice | null;
  /** The footer's "N / 15 REVEALED" counter. */
  revealedCounterFont: FontChoice | null;
  /** The company short names drawn on the wheel segments. */
  wheelLabelFont: FontChoice | null;
  /**
   * Custom wording for every fixed stage label; null keeps the built-in
   * word. Only the constant parts are editable — a winner's name and a
   * wheel segment's short name are roster data, not copy, so they aren't
   * here. `eyebrowDrawOfLabel` is a template: `{n}` and `{m}` are replaced
   * with the next draw number and the total.
   */
  statusLiveLabel: string | null;
  statusConnectingLabel: string | null;
  statusOfflineLabel: string | null;
  winnerStatusCompleteLabel: string | null;
  winnerStatusWinnerLabel: string | null;
  winnerStatusInPlayLabel: string | null;
  winnerStatusReadyLabel: string | null;
  winnerStatusNextDrawLabel: string | null;
  /** Prefix before the draw number: "Winner · draw {n}". */
  eyebrowWinnerDrawLabel: string | null;
  eyebrowTurningLabel: string | null;
  eyebrowInProgressLabel: string | null;
  eyebrowCeremonyClosedLabel: string | null;
  eyebrowWheelSetLabel: string | null;
  /** Template with `{n}` (next draw) and `{m}` (total) placeholders. */
  eyebrowDrawOfLabel: string | null;
  /** Prefix before the numbers in the header's draw counter. */
  drawCounterLabel: string | null;
  /** Suffix after the numbers in the footer's revealed counter. */
  revealedCounterLabel: string | null;
  /** Hex overrides for the four brand hues; null keeps the accent preset's value. */
  brandMint: string | null;
  brandTeal: string | null;
  brandCyan: string | null;
  brandBlue: string | null;
  /** Hex override per wheel segment slot (cycles across however many companies are on the wheel); null keeps the derived default. */
  segmentColors: Array<string | null>;
  /** How many of the segment color slots actually get cycled across the wheel (2–10); fewer reads bolder/more graphic. */
  segmentColorCount: number;
  /** The winning segment's fill and the label drawn on top of it. */
  winnerFill: string | null;
  winnerLabel: string | null;
  /** The wheel's fixed chassis: rim gradient endpoints and hub. The pointer is a fixed silver finish, not brandable. */
  rimStart: string | null;
  rimEnd: string | null;
  hub: string | null;
  /** Fine chassis detail — the rim's outer glow and two edge lines, plus the frame shadow ringing the segments. Null tracks the current brand tokens. */
  rimHalo: string | null;
  rimEdgeLight: string | null;
  rimEdgeDark: string | null;
  frameShadow: string | null;
  /** The 16 rivet studs set into the rim: body, ring and center dot. */
  stud: string | null;
  studRing: string | null;
  studCore: string | null;
  /** The hub's ring, edge line, center disc and center dot — in addition to its base fill above. */
  hubRing: string | null;
  hubEdge: string | null;
  hubCore: string | null;
  hubDot: string | null;
  /** The thin lines dividing segments, the default (non-winning) segment label color, and the dark outline behind every label for legibility. */
  hairline: string | null;
  labelBright: string | null;
  labelHalo: string | null;
  /** The bottom-left event title. */
  headerTitle: string | null;
  /** The "Live" status pill, top left. */
  statusText: string | null;
  /** Every text inside the winner/result card: status, draw counter, winner name, subtext. */
  winnerPanelText: string | null;
  /** Fallback color for any stage text above that hasn't been given its own color. Never affects the command center's own UI. */
  stageText: string | null;
  accentButtons: string | null;
  /** Subtle background tints for the glass panels that still exist (Winner panel is the only one on Stage; Control bar is Control-only). */
  tintWinnerPanel: string | null;
  tintControlBar: string | null;
};

/**
 * Size multipliers for the main stage's five components; 1 = default size.
 * Each scales the whole component (box and text together), so the operator
 * can rebalance a wall's composition without touching any other piece.
 */
export type Layout = {
  logoScale: number;
  /** The "Live" status pill and the fullscreen button beside it. */
  statusScale: number;
  wheelScale: number;
  /** The whole winner/result card, text included. */
  winnerPanelScale: number;
  /** The bottom-left event title. */
  titleScale: number;
};

export type WheelConfig = {
  title: string;
  subtitle: string;
  /** Fixed at 15 draws for this ceremony. */
  totalDraws: number;
  /** Conference accent used for the rim, halo, CTA and reveal accents. */
  accent: AccentName;
  /** Native LED wall pixels, used to frame the composition. */
  wallWidth: number;
  wallHeight: number;
  branding: Branding;
  layout: Layout;
};

export type DrawState = {
  config: WheelConfig;
  /** The full approved roster; eligible companies are derived from it. */
  baseRoster: Company[];
  winners: Winner[];
  phase: DrawPhase;
};

export type RosterParseResult = {
  companies: Company[];
  problems: string[];
  warnings: string[];
};

/** Whether the show record has every result. */
export type SaveStatus = "idle" | "saving" | "saved" | "error";
