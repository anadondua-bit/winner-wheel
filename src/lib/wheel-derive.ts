import type { Company, DrawState, Winner } from "./wheel-types";

export type WheelView = {
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
};

/**
 * Pure projection from a draw record to what the wheel and the operator
 * console need to render. Shared by the authoritative hook (command center)
 * and the read-only mirror (stage display) so both agree on the same rules.
 */
export const deriveWheelView = (state: DrawState): WheelView => {
  const claimed = new Set(state.winners.map((winner) => winner.companyId));
  const remaining = state.baseRoster.filter((company) => !claimed.has(company.id));
  const pendingWinner =
    state.phase === "spinning" || state.phase === "result"
      ? state.winners[state.winners.length - 1] ?? null
      : null;

  const wheelCompanies = pendingWinner
    ? state.baseRoster.filter(
        (company) => !claimed.has(company.id) || company.id === pendingWinner.companyId,
      )
    : remaining;

  const winnerIndex = pendingWinner
    ? wheelCompanies.findIndex((company) => company.id === pendingWinner.companyId)
    : -1;

  return {
    remaining,
    wheelCompanies,
    pendingWinner,
    winnerIndex,
    drawsRemaining: state.config.totalDraws - state.winners.length,
    canSpin:
      state.phase === "idle" &&
      state.winners.length < state.config.totalDraws &&
      remaining.length > 0,
    canAdvance: state.phase === "result",
    rosterLocked: state.winners.length > 0 || state.phase === "spinning",
  };
};
