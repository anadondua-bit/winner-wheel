import { normalizeBranding, normalizeLayout, toFontChoiceOrNull } from "./wheel-normalize";
import type { Branding, Company, Layout, Winner } from "./wheel-types";

/**
 * Durable show record, kept by the local server (see server/index.ts) in a
 * SQLite file — no cloud dependency. Runs and winners are append-only: a
 * reset starts a new run instead of deleting history, and every result is
 * written before the reveal is advanced.
 *
 * There's no object storage wired up for this project, so uploaded
 * branding (logo, background, custom font) rides along as data URLs
 * inside the same roster payload the company list already used.
 */

export type RemoteDraw = {
  runId: string;
  title: string;
  subtitle: string;
  accent: string;
  wallWidth: number;
  wallHeight: number;
  roster: Company[];
  branding: Branding;
  layout: Layout;
  winners: Winner[];
  startedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseCompanies = (value: unknown): Company[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const { id, name, short, font } = entry;
    if (typeof id !== "string" || typeof name !== "string" || typeof short !== "string") return [];
    return [{ id, name, short, font: toFontChoiceOrNull(font) }];
  });
};

type RemoteDrawResponse = {
  runId: string;
  title: string;
  subtitle: string;
  accent: string;
  wallWidth: number;
  wallHeight: number;
  roster: unknown;
  branding: unknown;
  layout: unknown;
  startedAt: string;
  winners: Array<{ companyId: string; name: string; short: string; draw: number; wonAt: string }>;
} | null;

export const fetchLatestDraw = async (): Promise<RemoteDraw | null> => {
  const res = await fetch("/api/draw/latest");
  if (!res.ok) throw new Error(`fetchLatestDraw failed: ${res.status}`);
  const data = (await res.json()) as RemoteDrawResponse;
  if (!data) return null;

  return {
    runId: data.runId,
    title: data.title,
    subtitle: data.subtitle,
    accent: data.accent,
    wallWidth: data.wallWidth,
    wallHeight: data.wallHeight,
    roster: parseCompanies(data.roster),
    branding: normalizeBranding(data.branding),
    layout: normalizeLayout(data.layout),
    startedAt: data.startedAt,
    winners: data.winners.map((winner) => ({
      companyId: winner.companyId,
      name: winner.name,
      short: winner.short,
      draw: winner.draw,
      wonAt: winner.wonAt,
    })),
  };
};

export const createDrawRun = async (draw: {
  title: string;
  subtitle: string;
  accent: string;
  wallWidth: number;
  wallHeight: number;
  roster: Company[];
  branding: Branding;
  layout: Layout;
}): Promise<string> => {
  const res = await fetch("/api/draw/runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(draw),
  });
  if (!res.ok) throw new Error(`createDrawRun failed: ${res.status}`);
  const data = (await res.json()) as { id: string };
  return data.id;
};

export type StageCommand = "start" | "close";

/**
 * One-row remote control for the physical stage display: a small helper
 * running on the stage machine polls this row and launches or closes the
 * kiosk browser window in response. Decoupled from the live socket on
 * purpose — that's for in-page state, this is for a machine that isn't
 * running any of this app's JS yet when it needs to hear "open".
 */
export const sendStageCommand = async (command: StageCommand): Promise<void> => {
  const res = await fetch("/api/stage-command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error(`sendStageCommand failed: ${res.status}`);
};

export const appendWinners = async (runId: string, winners: Winner[]): Promise<void> => {
  if (!winners.length) return;

  const res = await fetch(`/api/draw/runs/${encodeURIComponent(runId)}/winners`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ winners }),
  });
  if (!res.ok) throw new Error(`appendWinners failed: ${res.status}`);
};
