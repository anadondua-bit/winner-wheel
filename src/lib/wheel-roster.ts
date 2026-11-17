import { toCsvRow, parseCsv } from "./csv";
import type { Branding, Company, DrawState, RosterParseResult, WheelConfig } from "./wheel-types";

export const TOTAL_DRAWS = 15;
export const STORAGE_KEY = "award-wheel.draw.v1";
export const SHORT_NAME_LIMIT = 13;
export const SEGMENT_SLOT_COUNT = 10;

export const defaultBranding: Branding = {
  logoDataUrl: null,
  backgroundDataUrl: null,
  font: "manrope",
  customFontDataUrl: null,
  customFontName: null,
  brandMint: null,
  brandTeal: null,
  brandCyan: null,
  brandBlue: null,
  segmentColors: Array(SEGMENT_SLOT_COUNT).fill(null),
  segmentColorCount: SEGMENT_SLOT_COUNT,
};

export const defaultConfig: WheelConfig = {
  title: "Global Innovation Awards",
  subtitle: "Main Stage · Companies of the Year",
  totalDraws: TOTAL_DRAWS,
  accent: "teal",
  wallWidth: 2304,
  wallHeight: 1280,
  branding: defaultBranding,
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
    ?.toUpperCase()
    .slice(0, SHORT_NAME_LIMIT) ?? "COMPANY";

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

export type RosterRow = { name: string; short: string };

/** A roster-table row's React identity, independent of its editable fields. */
export type RosterRowDraft = RosterRow & { rowKey: string };

const newRowKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createRosterRow = (): RosterRowDraft => ({ rowKey: newRowKey(), name: "", short: "" });

/**
 * The one place that decides what makes a roster valid: no blank/duplicate
 * names, short names deduped and length-capped, derived when left blank,
 * and an overall count between TOTAL_DRAWS and 120. Shared by the text
 * textarea, the row-by-row table editor and CSV import — all three just
 * get rows into this shape first.
 */
const buildRoster = (rows: RosterRow[]): RosterParseResult => {
  const problems: string[] = [];
  const warnings: string[] = [];
  const companies: Company[] = [];
  const seenNames = new Set<string>();
  const seenShorts = new Set<string>();

  rows.forEach((row) => {
    const name = row.name.trim().replace(/\s+/g, " ");
    if (!name) return;

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      warnings.push(`"${name}" appears twice and was skipped.`);
      return;
    }
    seenNames.add(key);

    const short = row.short.trim().toUpperCase();
    const label = short || shortenName(name);
    if (short && short.length > SHORT_NAME_LIMIT) {
      warnings.push(`"${short}" is longer than ${SHORT_NAME_LIMIT} characters on the wheel.`);
    }
    const clipped = label.slice(0, SHORT_NAME_LIMIT);
    if (seenShorts.has(clipped)) {
      warnings.push(`Short name "${clipped}" is used more than once.`);
    }
    seenShorts.add(clipped);

    companies.push({
      id: `company-${slugify(name) || companies.length + 1}`,
      name,
      short: clipped,
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
      return { name: rawName ?? "", short: rawShort ?? "" };
    });

  return buildRoster(rows);
};

/** Same validation, for editors that already hold structured rows (the table, CSV import). */
export const parseRosterRows = (rows: RosterRow[]): RosterParseResult => buildRoster(rows);

/** "Full Name,SHORT" per line, quoted if either field needs it. */
export const companiesToCsv = (companies: Company[]): string =>
  ["name,short", ...companies.map((company) => toCsvRow([company.name, company.short]))].join("\n");

/** Accepts an optional "name,short" header row; tolerates a name-only column. */
export const companiesFromCsv = (text: string): RosterRow[] => {
  const rows = parseCsv(text);
  if (!rows.length) return [];

  const looksLikeHeader = rows[0]?.[0]?.trim().toLowerCase() === "name";
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;

  return dataRows
    .filter((row) => row.some((field) => field.trim()))
    .map((row) => ({ name: (row[0] ?? "").trim(), short: (row[1] ?? "").trim() }));
};
