import { useEffect, useRef } from "react";
import { LIVE_STATE_EVENT, openLiveChannel } from "@/lib/wheel-live";
import { supabase } from "@/integrations/supabase/client";
import type { DrawState } from "@/lib/wheel-types";

export type BroadcastStatus = "connecting" | "live" | "offline";

/**
 * Pushes every draw change to the stage display over a realtime broadcast
 * channel. Fire-and-forget: the command center stays authoritative and
 * keeps running even if nothing is listening on the other end.
 */
export const useWheelBroadcast = (
  state: DrawState,
  onStatus?: (status: BroadcastStatus) => void,
): void => {
  const channelRef = useRef<ReturnType<typeof openLiveChannel> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => {
    const channel = openLiveChannel();
    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Resend the current snapshot the moment the socket is ready, since
        // any send attempted before this point may have been dropped.
        void channel.send({
          type: "broadcast",
          event: LIVE_STATE_EVENT,
          payload: stateRef.current,
        });
        onStatusRef.current?.("live");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        onStatusRef.current?.("offline");
      }
    });

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    void channelRef.current?.send({
      type: "broadcast",
      event: LIVE_STATE_EVENT,
      payload: state,
    });
  }, [state]);
};
