import { supabase } from "@/integrations/supabase/client";
import type { Branding, DrawState, WheelConfig } from "./wheel-types";

/**
 * One fixed broadcast channel for the whole show. The command center is the
 * only writer; the stage display (and any other viewer) only ever listens.
 * This is a direct websocket hop — independent of the Supabase-backed show
 * record, which remains the durable copy a late-joining or refreshed stage
 * recovers from.
 */
export const LIVE_CHANNEL_NAME = "award-wheel:main-stage";
export const LIVE_STATE_EVENT = "state";
/**
 * Sent by a listener (the stage display) the moment it (re)subscribes, so a
 * refresh or a late join gets the live phase immediately instead of
 * waiting for the command center's next unrelated change — which, if the
 * operator is just sitting on a result with nothing moving, might not
 * come for a while. The command center answers with a full `state` send.
 */
export const LIVE_REQUEST_EVENT = "request-state";

export const openLiveChannel = () => supabase.channel(LIVE_CHANNEL_NAME);

/**
 * Branding fields big enough (inline data URLs for the logo, the
 * background and a custom font — each up to a few MB) that resending them
 * on every single state change can saturate the broadcast channel and
 * delay the small, time-critical spin/result messages behind them. The
 * wire payload below omits one of these whenever its value hasn't changed
 * since the last successful send; the receiving end fills the gap back in
 * from whatever it already has.
 */
export const HEAVY_BRANDING_KEYS = [
  "logoDataUrl",
  "backgroundDataUrl",
  "customFontDataUrl",
] as const;
type HeavyBrandingKey = (typeof HEAVY_BRANDING_KEYS)[number];

export type LiveBranding = Omit<Branding, HeavyBrandingKey> &
  Partial<Pick<Branding, HeavyBrandingKey>>;

export type LiveStatePayload = Omit<DrawState, "config"> & {
  config: Omit<WheelConfig, "branding"> & { branding: LiveBranding };
};

/**
 * Builds the wire payload for one broadcast send. `lastSent` is the
 * sender's running record of what it last actually transmitted for each
 * heavy field, mutated in place as a side effect. `full` forces every
 * heavy field to be included regardless of whether it changed — used
 * right after (re)subscribing, so a freshly (re)connected listener always
 * gets a complete snapshot to start from.
 */
export const buildLiveStatePayload = (
  state: DrawState,
  lastSent: Partial<Record<HeavyBrandingKey, string | null>>,
  full: boolean,
): LiveStatePayload => {
  const branding: LiveBranding = { ...state.config.branding };
  for (const key of HEAVY_BRANDING_KEYS) {
    const value = state.config.branding[key];
    if (!full && key in lastSent && lastSent[key] === value) {
      delete branding[key];
    } else {
      lastSent[key] = value;
    }
  }
  return { ...state, config: { ...state.config, branding } };
};

/** Fills in any heavy branding field the sender left out because it hadn't changed. */
export const mergeLiveStatePayload = (prev: DrawState, incoming: LiveStatePayload): DrawState => {
  const branding: Branding = { ...prev.config.branding, ...incoming.config.branding };
  for (const key of HEAVY_BRANDING_KEYS) {
    if (!(key in incoming.config.branding)) {
      branding[key] = prev.config.branding[key];
    }
  }
  return { ...(incoming as DrawState), config: { ...incoming.config, branding } };
};
