import type { Company, DrawState, RosterParseResult, WheelConfig } from "./wheel-types";

export const TOTAL_DRAWS = 15;
export const STORAGE_KEY = "award-wheel.draw.v1";
export const SHORT_NAME_LIMIT = 13;

export const defaultConfig: WheelConfig = {
  title: "Global Innovation Awards",
  subtitle: "Main Stage · Companies of the Year",
  totalDraws: TOTAL_DRAWS,
  accent: "teal",
  wallWidth: 2304,
  wallHeight: 1280,
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

/** Parses the operator's pasted roster and reports what blocks the draw. */
export const parseRoster = (text: string): RosterParseResult => {
  const problems: string[] = [];
  const warnings: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const companies: Company[] = [];
  const seenNames = new Set<string>();
  const seenShorts = new Set<string>();

  lines.forEach((line) => {
    const [rawName, rawShort] = line.split(/\s*[|;\t]\s*/);
    const name = (rawName ?? "").trim().replace(/\s+/g, " ");
    if (!name) return;

    const key = name.toLowerCase();
    if (seenNames.has(key)) {
      warnings.push(`"${name}" appears twice and was skipped.`);
      return;
    }
    seenNames.add(key);

    const short = (rawShort ?? "").trim().toUpperCase();
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
