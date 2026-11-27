import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "show.sqlite"));

db.exec(`
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    stage_key TEXT NOT NULL DEFAULT 'main-stage',
    event_title TEXT NOT NULL DEFAULT '',
    event_subtitle TEXT NOT NULL DEFAULT '',
    accent TEXT NOT NULL DEFAULT 'teal',
    wall_width INTEGER NOT NULL DEFAULT 2304,
    wall_height INTEGER NOT NULL DEFAULT 1280,
    roster TEXT NOT NULL,
    started_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS runs_latest_idx ON runs (stage_key, started_at DESC);

  CREATE TABLE IF NOT EXISTS winners (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES runs(id),
    company_id TEXT NOT NULL,
    company_name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    draw_number INTEGER NOT NULL,
    won_at TEXT NOT NULL,
    UNIQUE(run_id, draw_number),
    UNIQUE(run_id, company_id)
  );
  CREATE INDEX IF NOT EXISTS winners_run_idx ON winners (run_id, draw_number);

  CREATE TABLE IF NOT EXISTS commands (
    stage_key TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    requested_at TEXT NOT NULL
  );
`);

export type RunRow = {
  id: string;
  stage_key: string;
  event_title: string;
  event_subtitle: string;
  accent: string;
  wall_width: number;
  wall_height: number;
  roster: string;
  started_at: string;
};

export type WinnerRow = {
  id: string;
  run_id: string;
  company_id: string;
  company_name: string;
  short_name: string;
  draw_number: number;
  won_at: string;
};

const STAGE_KEY = "main-stage";

export const getLatestRun = (): RunRow | undefined =>
  db
    .prepare(
      "SELECT * FROM runs WHERE stage_key = ? ORDER BY started_at DESC LIMIT 1",
    )
    .get(STAGE_KEY) as RunRow | undefined;

export const getWinnersForRun = (runId: string): WinnerRow[] =>
  db
    .prepare("SELECT * FROM winners WHERE run_id = ? ORDER BY draw_number ASC")
    .all(runId) as WinnerRow[];

export const createRun = (draw: {
  title: string;
  subtitle: string;
  accent: string;
  wallWidth: number;
  wallHeight: number;
  rosterJson: string;
}): string => {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO runs (id, stage_key, event_title, event_subtitle, accent, wall_width, wall_height, roster, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    STAGE_KEY,
    draw.title,
    draw.subtitle,
    draw.accent,
    draw.wallWidth,
    draw.wallHeight,
    draw.rosterJson,
    new Date().toISOString(),
  );
  return id;
};

export const appendWinnerRows = (
  runId: string,
  winners: Array<{
    companyId: string;
    companyName: string;
    shortName: string;
    drawNumber: number;
    wonAt: string;
  }>,
): void => {
  const insert = db.prepare(
    `INSERT OR IGNORE INTO winners (id, run_id, company_id, company_name, short_name, draw_number, won_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const winner of winners) {
    insert.run(
      randomUUID(),
      runId,
      winner.companyId,
      winner.companyName,
      winner.shortName,
      winner.drawNumber,
      winner.wonAt,
    );
  }
};

export const getStageCommand = (): { command: string; requestedAt: string } | undefined => {
  const row = db
    .prepare("SELECT command, requested_at FROM commands WHERE stage_key = ?")
    .get(STAGE_KEY) as { command: string; requested_at: string } | undefined;
  return row ? { command: row.command, requestedAt: row.requested_at } : undefined;
};

export const setStageCommand = (command: "start" | "close"): void => {
  db.prepare(
    `INSERT INTO commands (stage_key, command, requested_at) VALUES (?, ?, ?)
     ON CONFLICT(stage_key) DO UPDATE SET command = excluded.command, requested_at = excluded.requested_at`,
  ).run(STAGE_KEY, command, new Date().toISOString());
};
