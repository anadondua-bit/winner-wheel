import { useEffect, useRef, useState } from "react";
import { deriveWheelView } from "@/lib/wheel-derive";
import { fetchLatestDraw } from "@/lib/wheel-cloud";
import {
  LIVE_REQUEST_EVENT,
  LIVE_STATE_EVENT,
  mergeLiveStatePayload,
  openLiveSocket,
  type LiveStatePayload,
} from "@/lib/wheel-live";
import { createInitialState } from "@/lib/wheel-roster";
import type { AccentName, DrawState } from "@/lib/wheel-types";

export type MirrorStatus = "connecting" | "live" | "offline";

const toAccent = (value: unknown): AccentName =>
  value === "blue" || value === "mint" ? value : "teal";

/**
 * Read-only reflection of the draw for the stage display: an initial
 * snapshot from the show record (so a refreshed or late-joining screen
 * isn't blank), then every subsequent change over the same local
 * Socket.IO connection the command center broadcasts on. The show record
 * has no notion of the live-only phase (idle/spinning/result), so that
 * initial snapshot can only ever guess idle/complete — this hook asks the
 * command center for its actual current state the moment it connects, so
 * a refresh mid-result doesn't sit showing "ready to draw" until something
 * else happens to change there.
 */
export const useWheelMirror = () => {
  const [state, setState] = useState<DrawState>(createInitialState);
  const [status, setStatus] = useState<MirrorStatus>("connecting");
  const gotLiveStateRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const remote = await fetchLatestDraw();
        if (cancelled || gotLiveStateRef.current || !remote) return;

        const fallback = createInitialState();
        const winners = remote.winners.slice(0, fallback.config.totalDraws);
        setState({
          config: {
            title: remote.title || fallback.config.title,
            subtitle: remote.subtitle,
            totalDraws: fallback.config.totalDraws,
            accent: toAccent(remote.accent),
            wallWidth: remote.wallWidth || fallback.config.wallWidth,
            wallHeight: remote.wallHeight || fallback.config.wallHeight,
            branding: remote.branding,
            layout: remote.layout,
          },
          baseRoster: remote.roster.length ? remote.roster : fallback.baseRoster,
          winners,
          // The show record only has winners, never whether the operator has
          // already advanced past the last one — "result" is a live-only
          // phase. Guessing "result" here would re-show an old win as if it
          // just landed, so this snapshot only ever resolves to idle/complete
          // and waits for the next broadcast to know if a result is on screen.
          phase: winners.length >= fallback.config.totalDraws ? "complete" : "idle",
          phaseChangedAt: new Date().toISOString(),
        });
      } catch {
        /* the live socket is the primary path; a failed initial fetch just delays first paint */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const socket = openLiveSocket();

    socket.on(LIVE_STATE_EVENT, (payload: LiveStatePayload) => {
      gotLiveStateRef.current = true;
      setState((prev) => mergeLiveStatePayload(prev, payload));
      setStatus("live");
    });
    socket.on("connect", () => {
      setStatus("live");
      // Ask whoever's running the command center for its current state
      // right now, instead of waiting for its next unrelated change.
      socket.emit(LIVE_REQUEST_EVENT);
    });
    socket.on("disconnect", () => setStatus("offline"));
    socket.on("connect_error", () => setStatus("offline"));

    return () => {
      socket.close();
    };
  }, []);

  const derived = deriveWheelView(state);

  return {
    config: state.config,
    baseRoster: state.baseRoster,
    winners: state.winners,
    phase: state.phase,
    phaseChangedAt: state.phaseChangedAt,
    status,
    ...derived,
  };
};
