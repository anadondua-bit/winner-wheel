import { useEffect, useRef } from "react";
import {
  LIVE_REQUEST_EVENT,
  LIVE_STATE_EVENT,
  buildLiveStatePayload,
  openLiveSocket,
} from "@/lib/wheel-live";
import type { DrawState } from "@/lib/wheel-types";

export type BroadcastStatus = "connecting" | "live" | "offline";

/**
 * Pushes every draw change to the stage display over a local Socket.IO
 * connection. Fire-and-forget: the command center stays authoritative and
 * keeps running even if nothing is listening on the other end.
 *
 * Heavy branding assets (logo/background/custom-font data URLs) are only
 * ever included in a send when they've actually changed — otherwise a
 * routine spin/result/advance tick would re-transmit several MB of
 * unchanged image/font data over the socket every time, which is enough to
 * delay or drop the small, time-critical phase message behind it. See
 * `buildLiveStatePayload`.
 *
 * Also answers a stage display's `LIVE_REQUEST_EVENT` (sent the moment it
 * connects — a refresh, a late join) with a full, undiffed snapshot, so it
 * doesn't have to wait for the next unrelated change here to find out the
 * live phase.
 */
export const useWheelBroadcast = (
  state: DrawState,
  onStatus?: (status: BroadcastStatus) => void,
): void => {
  const socketRef = useRef<ReturnType<typeof openLiveSocket> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const lastSentHeavyRef = useRef<Partial<Record<"logoDataUrl" | "backgroundDataUrl" | "customFontDataUrl", string | null>>>({});

  useEffect(() => {
    const socket = openLiveSocket();
    socketRef.current = socket;

    socket.on(LIVE_REQUEST_EVENT, () => {
      socket.emit(LIVE_STATE_EVENT, buildLiveStatePayload(stateRef.current, lastSentHeavyRef.current, true));
    });

    socket.on("connect", () => {
      // Resend the current snapshot the moment the socket is ready, since
      // any send attempted before this point may have been dropped. A
      // fresh connection means whoever's listening has no baseline yet, so
      // this one send is always the full, undiffed state.
      socket.emit(LIVE_STATE_EVENT, buildLiveStatePayload(stateRef.current, lastSentHeavyRef.current, true));
      onStatusRef.current?.("live");
    });
    socket.on("disconnect", () => onStatusRef.current?.("offline"));
    socket.on("connect_error", () => onStatusRef.current?.("offline"));

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    socketRef.current?.emit(LIVE_STATE_EVENT, buildLiveStatePayload(state, lastSentHeavyRef.current, false));
  }, [state]);
};
