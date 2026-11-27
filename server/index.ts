import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import {
  appendWinnerRows,
  createRun,
  getLatestRun,
  getStageCommand,
  getWinnersForRun,
  setStageCommand,
} from "./db.ts";

/**
 * The whole backend for the show: a tiny REST API in front of a local
 * SQLite file (the durable show record) plus a Socket.IO relay for the
 * live Control -> Stage broadcast. Replaces Supabase entirely — everything
 * here runs on whichever machine starts it, with no cloud dependency.
 * Deliberately no auth: this only ever runs on a trusted local network
 * (or behind a tunnel only the operator shares), same posture the
 * Supabase anon-key setup it replaces already had.
 */

const PORT = Number(process.env.PORT) || 4000;
const STATE_EVENT = "state";
const REQUEST_EVENT = "request-state";

const readJsonBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

const sendJson = (res: ServerResponse, status: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
  });
  res.end(payload);
};

type RosterPayload = { companies: unknown; branding: unknown; layout: unknown };

const parseRoster = (raw: string): RosterPayload => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as RosterPayload;
  } catch {
    /* fall through to empty */
  }
  return { companies: [], branding: null, layout: null };
};

const httpServer = createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }

    try {
      if (req.method === "GET" && url.pathname === "/api/draw/latest") {
        const run = getLatestRun();
        if (!run) {
          sendJson(res, 200, null);
          return;
        }
        const winners = getWinnersForRun(run.id);
        const roster = parseRoster(run.roster);
        sendJson(res, 200, {
          runId: run.id,
          title: run.event_title,
          subtitle: run.event_subtitle,
          accent: run.accent,
          wallWidth: run.wall_width,
          wallHeight: run.wall_height,
          roster: roster.companies,
          branding: roster.branding,
          layout: roster.layout,
          startedAt: run.started_at,
          winners: winners.map((row) => ({
            companyId: row.company_id,
            name: row.company_name,
            short: row.short_name,
            draw: row.draw_number,
            wonAt: row.won_at,
          })),
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/draw/runs") {
        const body = (await readJsonBody(req)) as {
          title: string;
          subtitle: string;
          accent: string;
          wallWidth: number;
          wallHeight: number;
          roster: unknown;
          branding: unknown;
          layout: unknown;
        };
        const id = createRun({
          title: body.title,
          subtitle: body.subtitle,
          accent: body.accent,
          wallWidth: body.wallWidth,
          wallHeight: body.wallHeight,
          rosterJson: JSON.stringify({
            companies: body.roster,
            branding: body.branding,
            layout: body.layout,
          }),
        });
        sendJson(res, 200, { id });
        return;
      }

      const winnersMatch = url.pathname.match(/^\/api\/draw\/runs\/([^/]+)\/winners$/);
      if (req.method === "POST" && winnersMatch) {
        const runId = winnersMatch[1];
        const body = (await readJsonBody(req)) as {
          winners: Array<{ companyId: string; name: string; short: string; draw: number; wonAt: string }>;
        };
        appendWinnerRows(
          runId,
          (body.winners ?? []).map((winner) => ({
            companyId: winner.companyId,
            companyName: winner.name,
            shortName: winner.short,
            drawNumber: winner.draw,
            wonAt: winner.wonAt,
          })),
        );
        sendJson(res, 204, null);
        return;
      }

      if (req.method === "GET" && url.pathname === "/api/stage-command") {
        sendJson(res, 200, getStageCommand() ?? null);
        return;
      }

      if (req.method === "POST" && url.pathname === "/api/stage-command") {
        const body = (await readJsonBody(req)) as { command: "start" | "close" };
        setStageCommand(body.command);
        sendJson(res, 204, null);
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
    }
  })();
});

const io = new SocketIOServer(httpServer, {
  path: "/socket.io",
  cors: { origin: "*" },
  // Default is 1 MB; a full branding sync (logo + background + custom
  // font, each up to a few hundred KB, base64-inflated ~1.33x) can exceed
  // that in one message, so give it real headroom.
  maxHttpBufferSize: 20 * 1024 * 1024,
});

io.on("connection", (socket) => {
  // A plain relay: whatever one client sends, every other connected
  // client gets — "broadcast to everyone but the sender".
  socket.on(STATE_EVENT, (payload) => {
    socket.broadcast.emit(STATE_EVENT, payload);
  });
  socket.on(REQUEST_EVENT, () => {
    socket.broadcast.emit(REQUEST_EVENT);
  });
});

httpServer.listen(PORT, () => {
  console.log(`award-wheel server listening on http://localhost:${PORT}`);
});
