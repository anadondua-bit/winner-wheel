import { toCsvRow, parseCsv } from "./csv";
import type {
  Branding,
  Company,
  DrawState,
  FontChoice,
  Layout,
  RosterParseResult,
  WheelConfig,
} from "./wheel-types";

export const TOTAL_DRAWS = 15;
export const STORAGE_KEY = "award-wheel.draw.v1";
export const SEGMENT_SLOT_COUNT = 10;

export const defaultBranding: Branding = {
  logoDataUrl: "data:image/png;base64,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",
  backgroundDataUrl: null,
  font: "manrope",
  customFontDataUrl: null,
  customFontName: null,
  headerTitleFont: null,
  statusFont: null,
  winnerPanelFont: null,
  winnerStatusFont: null,
  winnerEyebrowFont: null,
  winnerNameFont: null,
  drawCounterFont: null,
  revealedCounterFont: null,
  wheelLabelFont: null,
  statusLiveLabel: null,
  statusConnectingLabel: null,
  statusOfflineLabel: null,
  winnerStatusCompleteLabel: null,
  winnerStatusWinnerLabel: null,
  winnerStatusInPlayLabel: null,
  winnerStatusReadyLabel: null,
  winnerStatusNextDrawLabel: null,
  eyebrowWinnerDrawLabel: null,
  eyebrowTurningLabel: null,
  eyebrowInProgressLabel: null,
  eyebrowCeremonyClosedLabel: null,
  eyebrowWheelSetLabel: null,
  eyebrowDrawOfLabel: null,
  drawCounterLabel: null,
  revealedCounterLabel: null,
  brandMint: null,
  brandTeal: null,
  brandCyan: null,
  brandBlue: null,
  segmentColors: Array(SEGMENT_SLOT_COUNT).fill(null),
  segmentColorCount: SEGMENT_SLOT_COUNT,
  winnerFill: null,
  winnerLabel: null,
  rimStart: null,
  rimEnd: null,
  hub: null,
  rimHalo: null,
  rimEdgeLight: null,
  rimEdgeDark: null,
  frameShadow: null,
  stud: null,
  studRing: null,
  studCore: null,
  hubRing: null,
  hubEdge: null,
  hubCore: null,
  hubDot: null,
  hairline: null,
  labelBright: null,
  labelHalo: null,
  headerTitle: null,
  statusText: null,
  winnerPanelText: null,
  stageText: null,
  accentButtons: null,
  tintWinnerPanel: null,
  tintControlBar: null,
};

export const defaultLayout: Layout = {
  logoScale: 1,
  statusScale: 1,
  wheelScale: 1,
  winnerPanelScale: 1,
  titleScale: 1,
};

export const defaultConfig: WheelConfig = {
  title: "Caucasus Strategic Partners Conference 2026",
  subtitle: "Main Stage · Companies of the Year",
  totalDraws: TOTAL_DRAWS,
  accent: "teal",
  wallWidth: 2304,
  wallHeight: 1280,
  branding: defaultBranding,
  layout: defaultLayout,
};

/**
 * Placeholder roster. Production replaces it with the approved list through
 * the roster panel; ids stay stable so saved winners keep resolving.
 */
const sampleCompanies: Array<[string, string]> = [
  ["Northwind Analytics", "NORTHWIND"],
  ["Bluepeak Systems", "BLUEPEAK"],
  ["Solstice Robotics", "SOLSTICE"],
  ["Harborline Media", "HARBORLINE"],
  ["Vertex BioLabs", "VERTEX"],
  ["Lumen & Co.", "LUMEN"],
  ["Kestrel Financial", "KESTREL"],
  ["Greenfield Energy", "GREENFIELD"],
  ["Astra Mobility", "ASTRA"],
  ["Silverline Retail", "SILVERLINE"],
  ["Orbital Networks", "ORBITAL"],
  ["Cobalt Studios", "COBALT"],
  ["Meridian Health", "MERIDIAN"],
  ["Ironwood Manufacturing", "IRONWOOD"],
  ["Nexa Cloud Services", "NEXA"],
  ["Pacific Rim Logistics", "PACIFIC"],
  ["Ardent Consulting", "ARDENT"],
  ["Helix Genomics", "HELIX"],
  ["Brightwater Foods", "BRIGHTWATER"],
  ["Quantum Edge AI", "QUANTUM"],
  ["Juniper Design Group", "JUNIPER"],
  ["Falcon Aerospace", "FALCON"],
  ["Stonebridge Capital", "STONEBRIDGE"],
  ["Evergreen AgriTech", "EVERGREEN"],
  ["Crestline Hospitality", "CRESTLINE"],
  ["Nordvind Shipping", "NORDVIND"],
  ["Amplify Learning", "AMPLIFY"],
  ["Redwood Insurance", "REDWOOD"],
  ["Cyan Digital", "CYAN"],
  ["Trellis Software", "TRELLIS"],
  ["Atlas Urban Works", "ATLAS"],
  ["Pinnacle Sports Media", "PINNACLE"],
  ["Vantage Legal", "VANTAGE"],
  ["Halcyon Travel", "HALCYON"],
  ["Brimstone Metals", "BRIMSTONE"],
  ["Nova Medical Devices", "NOVAMED"],
  ["Celeste Cosmetics", "CELESTE"],
  ["Titan Infrastructure", "TITAN"],
  ["Wavelength Audio", "WAVELENGTH"],
  ["Fieldstone Realty", "FIELDSTONE"],
  ["Lattice Semiconductor", "LATTICE"],
  ["Moraine Water", "MORAINE"],
  ["Sable Fashion House", "SABLE"],
  ["Trident Marine", "TRIDENT"],
  ["Kinship Care", "KINSHIP"],
  ["Zephyr Wind Power", "ZEPHYR"],
  ["Basalt Mining Co.", "BASALT"],
  ["Orchid Biotech", "ORCHID"],
  ["Compass Education", "COMPASS"],
  ["Emberline Energy", "EMBERLINE"],
];

export const sampleRoster: Company[] = sampleCompanies.map(([name, short], index) => ({
  id: `company-${index + 1}`,
  name,
  short,
  font: null,
}));

export const createInitialState = (): DrawState => ({
  config: { ...defaultConfig },
  baseRoster: sampleRoster.map((company) => ({ ...company })),
  winners: [],
  phase: "idle",
});

/** One company per line: "Full Company Name | SHORT NAME" */
export const formatRoster = (companies: Company[]): string =>
  companies.map((company) => `${company.name} | ${company.short}`).join("\n");

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const shortenName = (name: string): string =>
  name
    .replace(/[^A-Za-z0-9&.\- ]/g, "")
    .split(/\s+/)
    .filter(Boolean)[0]
    ?.toUpperCase() ?? "COMPANY";

/**
 * Normalizes an uploaded .csv/.txt file into the same "Name | SHORT" lines
 * the textarea already accepts, so parseRoster stays the single source of
 * truth for validation. A line that already uses |, ; or tab is left alone;
 * a plain CSV line ("Name,SHORT" or just "Name") gets its first comma
 * turned into the same separator.
 */
export const normalizeUploadedRoster = (text: string): string =>
  text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || /[|;\t]/.test(trimmed)) return trimmed;
      return trimmed.replace(",", " | ");
    })
    .join("\n");

export type RosterRow = { name: string; short: string; font: FontChoice | null };

/** A roster-table row's React identity, independent of its editable fields. */
export type RosterRowDraft = RosterRow & { rowKey: string };

const newRowKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createRosterRow = (): RosterRowDraft => ({
  rowKey: newRowKey(),
  name: "",
  short: "",
  font: null,
});

const toRowFont = (value: string | undefined): FontChoice | null =>
  value === "manrope" ||
  value === "system-sans" ||
  value === "system-serif" ||
  value === "system-mono" ||
  value === "custom"
    ? value
    : null;

/**
 * The one place that decides what makes a roster valid: no blank names,
 * short names derived when left blank, and an overall count between
 * TOTAL_DRAWS and 120. Duplicate full names and duplicate or long short
 * names are allowed — every row that has a name becomes its own company,
 * each with a guaranteed-unique id regardless of any name it shares.
 * Shared by the text textarea, the row-by-row table editor and CSV import
 * — all three just get rows into this shape first.
 */
const buildRoster = (rows: RosterRow[]): RosterParseResult => {
  const problems: string[] = [];
  const warnings: string[] = [];
  const companies: Company[] = [];

  rows.forEach((row) => {
    const name = row.name.trim().replace(/\s+/g, " ");
    if (!name) return;

    const short = row.short.trim().toUpperCase();
    const label = short || shortenName(name);

    companies.push({
      id: `company-${slugify(name) || "company"}-${companies.length + 1}`,
      name,
      short: label,
      font: row.font,
    });
  });

  if (companies.length < TOTAL_DRAWS) {
    problems.push(
      `The roster needs at least ${TOTAL_DRAWS} companies — ${companies.length} found.`,
    );
  }
  if (companies.length > 120) {
    problems.push("The wheel supports up to 120 companies.");
  }

  return { companies, problems, warnings };
};

/** Parses the operator's pasted roster and reports what blocks the draw. */
export const parseRoster = (text: string): RosterParseResult => {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, rawShort] = line.split(/\s*[|;\t]\s*/);
      return { name: rawName ?? "", short: rawShort ?? "", font: null };
    });

  return buildRoster(rows);
};

/** Same validation, for editors that already hold structured rows (the table, CSV import). */
export const parseRosterRows = (rows: RosterRow[]): RosterParseResult => buildRoster(rows);

/** "Full Name,SHORT,FONT" per line, quoted if any field needs it; font is blank unless set. */
export const companiesToCsv = (companies: Company[]): string =>
  [
    "name,short,font",
    ...companies.map((company) => toCsvRow([company.name, company.short, company.font ?? ""])),
  ].join("\n");

/** Accepts an optional "name,short,font" header row; tolerates a name-only column and a missing font column. */
export const companiesFromCsv = (text: string): RosterRow[] => {
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const looksLikeHeader = rows[0]?.[0]?.trim().toLowerCase() === "name";
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((row) => row.some((field) => field.trim()))
    .map((row) => ({
      name: (row[0] ?? "").trim(),
      short: (row[1] ?? "").trim(),
      font: toRowFont(row[2]?.trim()),
    }));
};
