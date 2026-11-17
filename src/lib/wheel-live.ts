import { supabase } from "@/integrations/supabase/client";

/**
 * One fixed broadcast channel for the whole show. The command center is the
 * only writer; the stage display (and any other viewer) only ever listens.
 * This is a direct websocket hop — independent of the Supabase-backed show
 * record, which remains the durable copy a late-joining or refreshed stage
 * recovers from.
 */
export const LIVE_CHANNEL_NAME = "award-wheel:main-stage";
export const LIVE_STATE_EVENT = "state";

export const openLiveChannel = () => supabase.channel(LIVE_CHANNEL_NAME);
