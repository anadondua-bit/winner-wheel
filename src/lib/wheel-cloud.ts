import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Company, Winner } from "./wheel-types";

/**
 * Durable show record. Runs and winners are append-only: a reset starts a new
 * run instead of deleting history, and every result is written before the
 * reveal is advanced.
 */
const STAGE_KEY = "main-stage";

export type RemoteDraw = {
  runId: string;
  title: string;
  subtitle: string;
  accent: string;
  wallWidth: number;
  wallHeight: number;
  roster: Company[];
  winners: Winner[];
  startedAt: string;
};

const parseRoster = (value: Json): Company[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];
    const record = entry as Record<string, Json | undefined>;
    const { id, name, short } = record;
    if (typeof id !== "string" || typeof name !== "string" || typeof short !== "string") {
      return [];
    }
    return [{ id, name, short }];
  });
};

export const fetchLatestDraw = async (): Promise<RemoteDraw | null> => {
  const { data: run, error } = await supabase
    .from("award_wheel_runs")
    .select(
      "id, event_title, event_subtitle, accent, wall_width, wall_height, roster, started_at",
    )
    .eq("stage_key", STAGE_KEY)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!run) return null;

  const { data: rows, error: winnersError } = await supabase
    .from("award_wheel_winners")
    .select("company_id, company_name, short_name, draw_number, won_at")
    .eq("run_id", run.id)
    .order("draw_number", { ascending: true });

  if (winnersError) throw winnersError;

  return {
    runId: run.id,
    title: run.event_title,
    subtitle: run.event_subtitle,
    accent: run.accent,
    wallWidth: run.wall_width,
    wallHeight: run.wall_height,
    roster: parseRoster(run.roster),
    startedAt: run.started_at,
    winners: (rows ?? []).map((row) => ({
      companyId: row.company_id,
      name: row.company_name,
      short: row.short_name,
      draw: row.draw_number,
      wonAt: row.won_at,
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
}): Promise<string> => {
  const { data, error } = await supabase
    .from("award_wheel_runs")
    .insert({
      stage_key: STAGE_KEY,
      event_title: draw.title,
      event_subtitle: draw.subtitle,
      accent: draw.accent,
      wall_width: draw.wallWidth,
      wall_height: draw.wallHeight,
      roster: draw.roster as unknown as Json,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const appendWinners = async (runId: string, winners: Winner[]): Promise<void> => {
  if (!winners.length) return;

  const { error } = await supabase.from("award_wheel_winners").upsert(
    winners.map((winner) => ({
      run_id: runId,
      company_id: winner.companyId,
      company_name: winner.name,
      short_name: winner.short,
      draw_number: winner.draw,
      won_at: winner.wonAt,
    })),
    { onConflict: "run_id,draw_number", ignoreDuplicates: true },
  );

  if (error) throw error;
};
