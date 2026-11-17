import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deriveWheelView } from "@/lib/wheel-derive";
import { SPIN_DURATION_MS } from "@/lib/wheel-geometry";
import { SEGMENT_SLOT_COUNT, STORAGE_KEY, createInitialState, defaultBranding } from "@/lib/wheel-roster";
import type {
  AccentName,
  Branding,
  Company,
  DrawPhase,
  DrawState,
  FontChoice,
  WheelConfig,
  Winner,
} from "@/lib/wheel-types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
};

const toAccent = (value: unknown): AccentName =>
  value === "blue" || value === "mint" ? value : "teal";

const isHex = (value: unknown): value is string =>
  typeof value === "string" && /^#?[0-9a-fA-F]{6}$/.test(value);

const toHexOrNull = (value: unknown): string | null => (isHex(value) ? value : null);

const toFont = (value: unknown): FontChoice =>
  value === "system-sans" || value === "system-serif" || value === "system-mono" || value === "custom"
    ? value
    : "manrope";

const toBranding = (value: unknown): Branding => {
  if (!isRecord(value)) return defaultBranding;
  const segmentColorsRaw = Array.isArray(value.segmentColors) ? value.segmentColors : [];

  return {
    logoDataUrl: typeof value.logoDataUrl === "string" ? value.logoDataUrl : null,
    backgroundDataUrl: typeof value.backgroundDataUrl === "string" ? value.backgroundDataUrl : null,
    font: toFont(value.font),
    customFontDataUrl: typeof value.customFontDataUrl === "string" ? value.customFontDataUrl : null,
    customFontName: typeof value.customFontName === "string" ? value.customFontName : null,
    brandMint: toHexOrNull(value.brandMint),
    brandTeal: toHexOrNull(value.brandTeal),
    brandCyan: toHexOrNull(value.brandCyan),
    brandBlue: toHexOrNull(value.brandBlue),
    segmentColors: Array.from({ length: SEGMENT_SLOT_COUNT }, (_, index) =>
      toHexOrNull(segmentColorsRaw[index]),
    ),
  };
};

const toCompany = (value: unknown): Company | null => {
  if (!isRecord(value)) return null;
  const { id, name, short } = value;
  if (typeof id !== "string" || typeof name !== "string" || typeof short !== "string") return null;
  if (!id || !name) return null;
  return { id, name, short };
};

const toWinner = (value: unknown): Winner | null => {
  if (!isRecord(value)) return null;
  const { companyId, name, short, draw, wonAt } = value;
  if (typeof companyId !== "string" || typeof name !== "string") return null;
  if (typeof draw !== "number") return null;
  return {
    companyId,
    name,
    short: typeof short === "string" ? short : name.slice(0, 13).toUpperCase(),
    draw,
    wonAt: typeof wonAt === "string" ? wonAt : new Date().toISOString(),
  };
};

/**
 * Rebuilds the persisted draw, keeping it honest after a crash or reload:
 * a spin that was interrupted is restored as its finished result, never
 * re-rolled, and winners always stay unique and in reveal order.
 */
const normalizeState = (raw: unknown): DrawState => {
  const fallback = createInitialState();
  if (!isRecord(raw)) return fallback;

  const config = isRecord(raw.config) ? raw.config : {};
  const title = typeof config.title === "string" && config.title.trim() ? config.title : fallback.config.title;
  const subtitle =
    typeof config.subtitle === "string" ? config.subtitle : fallback.config.subtitle;

  const roster = Array.isArray(raw.baseRoster)
    ? raw.baseRoster.map(toCompany).filter((company): company is Company => company !== null)
    : fallback.baseRoster;
  const baseRoster = roster.length >= fallback.config.totalDraws ? roster : fallback.baseRoster;

  const rosterIds = new Set(baseRoster.map((company) => company.id));
  const seen = new Set<string>();
  const winners = (Array.isArray(raw.winners) ? raw.winners : [])
    .map(toWinner)
    .filter((winner): winner is Winner => winner !== null && rosterIds.has(winner.companyId))
    .filter((winner) => {
      if (seen.has(winner.companyId)) return false;
      seen.add(winner.companyId);
      return true;
    })
    .slice(0, fallback.config.totalDraws)
    .map((winner, index) => ({ ...winner, draw: index + 1 }));

  const storedPhase: DrawPhase =
    raw.phase === "spinning" || raw.phase === "result" || raw.phase === "complete"
      ? raw.phase
      : "idle";

  let phase: DrawPhase = storedPhase === "spinning" ? "result" : storedPhase;
  if (phase === "result" && winners.length === 0) phase = "idle";
  if (phase === "complete" && winners.length < fallback.config.totalDraws) phase = "idle";
  if (phase !== "result" && winners.length >= fallback.config.totalDraws) phase = "complete";

  return {
    config: {
      title,
      subtitle,
      totalDraws: fallback.config.totalDraws,
      accent: toAccent(config.accent),
      wallWidth: clampInt(config.wallWidth, 320, 7680, fallback.config.wallWidth),
      wallHeight: clampInt(config.wallHeight, 200, 4320, fallback.config.wallHeight),
      branding: toBranding(config.branding),
    },
    baseRoster,
    winners,
    phase,
  };
};

const readStoredState = (): DrawState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
};

const persistState = (state: DrawState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export type AwardWheelApi = {
  config: WheelConfig;
  baseRoster: Company[];
  winners: Winner[];
  phase: DrawPhase;
  /** Companies still to be drawn (winner removed after the reveal is advanced). */
  remaining: Company[];
  /** Companies currently drawn on the wheel, including a pending winner. */
  wheelCompanies: Company[];
  pendingWinner: Winner | null;
  winnerIndex: number;
  drawsRemaining: number;
  canSpin: boolean;
  canAdvance: boolean;
  rosterLocked: boolean;
  startSpin: () => void;
  landSpin: () => void;
  advance: () => void;
  applyRoster: (companies: Company[]) => void;
  updateConfig: (patch: Partial<Omit<WheelConfig, "totalDraws">>) => void;
  resetDraw: () => void;
  /** Replaces the local draw with the saved show record (recovery path). */
  adoptRemote: (draw: {
    title: string;
    subtitle: string;
    roster: Company[];
    winners: Winner[];
    accent: AccentName;
    wallWidth: number;
    wallHeight: number;
    branding: Branding;
  }) => void;
};

export const useAwardWheel = (): AwardWheelApi => {
  const [state, setState] = useState<DrawState>(readStoredState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      persistState(state);
    } catch {
      /* storage blocked: the draw still runs from memory */
    }
  }, [state]);

  const startSpin = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "idle") return;
    if (current.winners.length >= current.config.totalDraws) return;

    const claimed = new Set(current.winners.map((winner) => winner.companyId));
    const pool = current.baseRoster.filter((company) => !claimed.has(company.id));
    if (!pool.length) return;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const winner: Winner = {
      companyId: chosen.id,
      name: chosen.name,
      short: chosen.short,
      draw: current.winners.length + 1,
      wonAt: new Date().toISOString(),
    };

    const next: DrawState = {
      ...current,
      phase: "spinning",
      winners: [...current.winners, winner],
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const landSpin = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "spinning") return;
    const next: DrawState = { ...current, phase: "result" };
    stateRef.current = next;
    setState(next);
  }, []);

  // Owns the spin's timing itself so the result lands even when nothing
  // renders the wheel (the command center has no wheel graphic at all).
  useEffect(() => {
    if (state.phase !== "spinning") return;
    const timer = window.setTimeout(landSpin, SPIN_DURATION_MS + 120);
    return () => window.clearTimeout(timer);
  }, [state.phase, landSpin]);

  const advance = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "result") return;
    const finished = current.winners.length >= current.config.totalDraws;
    const next: DrawState = { ...current, phase: finished ? "complete" : "idle" };
    stateRef.current = next;
    setState(next);
  }, []);

  const applyRoster = useCallback((companies: Company[]) => {
    const current = stateRef.current;
    if (current.winners.length > 0 || current.phase !== "idle") return;
    if (companies.length < current.config.totalDraws) return;
    const next: DrawState = { ...current, baseRoster: companies, phase: "idle" };
    stateRef.current = next;
    setState(next);
  }, []);

  const updateConfig = useCallback((patch: Partial<Omit<WheelConfig, "totalDraws">>) => {
    const current = stateRef.current;
    const next: DrawState = {
      ...current,
      config: { ...current.config, ...patch },
    };
    stateRef.current = next;
    setState(next);
  }, []);

  const adoptRemote = useCallback(
    (draw: {
      title: string;
      subtitle: string;
      roster: Company[];
      winners: Winner[];
      accent: AccentName;
      wallWidth: number;
      wallHeight: number;
      branding: Branding;
    }) => {
      const current = stateRef.current;
      if (draw.roster.length < current.config.totalDraws) return;

      const rosterIds = new Set(draw.roster.map((company) => company.id));
      const winners = draw.winners
        .filter((winner) => rosterIds.has(winner.companyId))
        .slice(0, current.config.totalDraws)
        .map((winner, index) => ({ ...winner, draw: index + 1 }));

      const phase: DrawPhase =
        winners.length >= current.config.totalDraws
          ? "complete"
          : winners.length > 0
            ? "result"
            : "idle";

      const next: DrawState = {
        ...current,
        config: {
          ...current.config,
          title: draw.title || current.config.title,
          subtitle: draw.subtitle,
          accent: toAccent(draw.accent),
          wallWidth: clampInt(draw.wallWidth, 320, 7680, current.config.wallWidth),
          wallHeight: clampInt(draw.wallHeight, 200, 4320, current.config.wallHeight),
          branding: draw.branding,
        },
        baseRoster: draw.roster,
        winners,
        phase,
      };
      stateRef.current = next;
      setState(next);
    },
    [],
  );

  const resetDraw = useCallback(() => {
    const current = stateRef.current;
    const next: DrawState = { ...current, winners: [], phase: "idle" };
    stateRef.current = next;
    setState(next);
  }, []);

  const derived = useMemo(() => deriveWheelView(state), [state]);

  return {
    config: state.config,
    baseRoster: state.baseRoster,
    winners: state.winners,
    phase: state.phase,
    startSpin,
    landSpin,
    advance,
    applyRoster,
    updateConfig,
    resetDraw,
    adoptRemote,
    ...derived,
  };
};
