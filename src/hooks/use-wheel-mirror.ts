import { useEffect, useRef, useState } from "react";
import { deriveWheelView } from "@/lib/wheel-derive";
import { fetchLatestDraw } from "@/lib/wheel-cloud";
import { LIVE_STATE_EVENT, openLiveChannel } from "@/lib/wheel-live";
import { createInitialState } from "@/lib/wheel-roster";
import { supabase } from "@/integrations/supabase/client";
import type { AccentName, DrawState } from "@/lib/wheel-types";

export type MirrorStatus = "connecting" | "live" | "offline";

const toAccent = (value: unknown): AccentName =>
  value === "blue" || value === "mint" ? value : "teal";

/**
 * Read-only reflection of the draw for the stage display: an initial
 * snapshot from the show record (so a refreshed or late-joining screen
 * isn't blank), then every subsequent change over the same realtime
 * channel the command center broadcasts on.
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
          },
          baseRoster: remote.roster.length ? remote.roster : fallback.baseRoster,
          winners,
          // The show record only has winners, never whether the operator has
          // already advanced past the last one — "result" is a live-only
          // phase. Guessing "result" here would re-show an old win as if it
          // just landed, so this snapshot only ever resolves to idle/complete
          // and waits for the next broadcast to know if a result is on screen.
          phase: winners.length >= fallback.config.totalDraws ? "complete" : "idle",
        });
      } catch {
        /* the live channel is the primary path; a failed initial fetch just delays first paint */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = openLiveChannel();

    channel
      .on("broadcast", { event: LIVE_STATE_EVENT }, ({ payload }) => {
        gotLiveStateRef.current = true;
        setState(payload as DrawState);
        setStatus("live");
      })
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("live");
        } else if (
          subscribeStatus === "CHANNEL_ERROR" ||
          subscribeStatus === "TIMED_OUT" ||
          subscribeStatus === "CLOSED"
        ) {
          setStatus("offline");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const derived = deriveWheelView(state);

  return {
    config: state.config,
    baseRoster: state.baseRoster,
    winners: state.winners,
    phase: state.phase,
    status,
    ...derived,
  };
};
