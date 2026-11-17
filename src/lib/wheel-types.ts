/** Domain types for the conference draw wheel. */

export type Company = {
  /** Stable id so saved winners keep pointing at the right company. */
  id: string;
  /** Full name shown on the winner reveal. */
  name: string;
  /** Approved short label drawn on the wheel segment. */
  short: string;
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
