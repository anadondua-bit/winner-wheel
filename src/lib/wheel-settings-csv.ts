import { parseCsv, toCsvRow } from "./csv";
import { SEGMENT_SLOT_COUNT, defaultConfig } from "./wheel-roster";
import { clampInt, normalizeBranding, toAccentName } from "./wheel-normalize";
import type { WheelConfig } from "./wheel-types";

/**
 * A full backup/restore of everything in the "Roster & branding" dialog
 * except the company list itself (that's its own CSV) — titles, accent,
 * wall size and every brand asset, as one flat key/value CSV so it can be
 * archived or handed to another machine and brought back exactly.
 */
const BRANDING_SCALAR_KEYS = [
  "font",
  "customFontName",
  "customFontDataUrl",
  "brandMint",
  "brandTeal",
  "brandCyan",
  "brandBlue",
  "logoDataUrl",
  "backgroundDataUrl",
  "winnerFill",
  "winnerLabel",
  "rimStart",
  "rimEnd",
  "hub",
  "pointer",
  "headerTitle",
  "stageText",
  "accentButtons",
  "tintWinnerPanel",
  "tintWinnersRail",
  "tintControlBar",
] as const;

export const configToSettingsCsv = (config: WheelConfig): string => {
  const rows: Array<[string, string]> = [
    ["title", config.title],
    ["subtitle", config.subtitle],
    ["accent", config.accent],
    ["wallWidth", String(config.wallWidth)],
    ["wallHeight", String(config.wallHeight)],
  ];

  BRANDING_SCALAR_KEYS.forEach((key) => {
    rows.push([`branding.${key}`, config.branding[key] ?? ""]);
  });
  rows.push(["branding.segmentColorCount", String(config.branding.segmentColorCount)]);
  config.branding.segmentColors.forEach((hex, index) => {
    rows.push([`branding.segmentColors.${index + 1}`, hex ?? ""]);
  });

  return ["key,value", ...rows.map(([key, value]) => toCsvRow([key, value]))].join("\n");
};

export const settingsCsvToConfigPatch = (text: string): Partial<Omit<WheelConfig, "totalDraws">> => {
  const rows = parseCsv(text);
  const map = new Map<string, string>();

  rows.forEach((row, index) => {
    if (index === 0 && row[0]?.trim().toLowerCase() === "key") return;
    if (!row[0]) return;
    map.set(row[0], row[1] ?? "");
  });

  const brandingRecord: Record<string, unknown> = {};
  BRANDING_SCALAR_KEYS.forEach((key) => {
    const value = map.get(`branding.${key}`);
    if (value) brandingRecord[key] = value;
  });
  brandingRecord.segmentColors = Array.from(
    { length: SEGMENT_SLOT_COUNT },
    (_, index) => map.get(`branding.segmentColors.${index + 1}`) || null,
  );
  brandingRecord.segmentColorCount = map.get("branding.segmentColorCount");

  return {
    title: map.get("title")?.trim() || defaultConfig.title,
    subtitle: map.get("subtitle") ?? defaultConfig.subtitle,
    accent: toAccentName(map.get("accent")),
    wallWidth: clampInt(map.get("wallWidth"), 320, 7680, defaultConfig.wallWidth),
    wallHeight: clampInt(map.get("wallHeight"), 200, 4320, defaultConfig.wallHeight),
    branding: normalizeBranding(brandingRecord),
  };
};
